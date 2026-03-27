"""
Weather data ingestion and message delivery endpoints.
- Fetches weather from OpenWeatherMap (or mock) for farm locations
- Queues advisory SMS messages via Celery/Twilio
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app import schemas, models
from app.weather_service import fetch_weather_forecast, build_weather_summary, parse_location
from app.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# WEATHER INGESTION
# ---------------------------------------------------------------------------

@router.get("/farm/{farm_id}")
async def get_farm_weather(farm_id: int, db: Session = Depends(get_db)):
    """
    Fetch and store 7-day weather forecast for a farm.
    Uses OpenWeatherMap live API (or mock if key not configured).
    """
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    location = parse_location(farm.location or "")
    if not location:
        raise HTTPException(status_code=400, detail="Farm location not set or invalid")

    lat, lon = location
    forecasts = fetch_weather_forecast(lat, lon)

    # Persist forecasts (replace today's entries)
    saved = []
    for fc in forecasts:
        wf = models.WeatherForecast(
            farm_id=farm.id,
            forecast_date=fc["forecast_date"],
            temperature_min=fc["temperature_min"],
            temperature_max=fc["temperature_max"],
            temperature_mean=fc["temperature_mean"],
            humidity=fc["humidity"],
            rainfall=fc["rainfall"],
            wind_speed=fc.get("wind_speed"),
            source=fc["source"],
            lead_time_hours=fc["lead_time_hours"],
            raw_data=fc.get("raw_data")
        )
        db.add(wf)
        saved.append({
            "date": fc["forecast_date"].strftime("%Y-%m-%d"),
            "temp_min": fc["temperature_min"],
            "temp_max": fc["temperature_max"],
            "temp_mean": fc["temperature_mean"],
            "humidity": fc["humidity"],
            "rainfall": fc["rainfall"],
            "wind_speed": fc.get("wind_speed"),
            "source": fc["source"],
        })

    db.commit()
    summary = build_weather_summary(forecasts)

    return {
        "farm_id": farm_id,
        "location": {"lat": lat, "lon": lon},
        "forecast_days": len(saved),
        "source": forecasts[0]["source"] if forecasts else "none",
        "summary": summary,
        "daily": saved
    }


@router.get("/farm/{farm_id}/forecast")
async def get_stored_forecast(farm_id: int, days: int = 7, db: Session = Depends(get_db)):
    """Return stored weather forecast records for a farm (for frontend display)."""
    from datetime import timedelta
    since = datetime.utcnow() - timedelta(hours=24)

    forecasts = (
        db.query(models.WeatherForecast)
        .filter(
            models.WeatherForecast.farm_id == farm_id,
            models.WeatherForecast.ingested_at >= since
        )
        .order_by(models.WeatherForecast.forecast_date)
        .limit(days)
        .all()
    )

    return {
        "farm_id": farm_id,
        "records": [
            {
                "date": f.forecast_date.strftime("%Y-%m-%d"),
                "temp_min": f.temperature_min,
                "temp_max": f.temperature_max,
                "temp_mean": f.temperature_mean,
                "humidity": f.humidity,
                "rainfall": f.rainfall,
                "wind_speed": f.wind_speed,
                "source": f.source,
            }
            for f in forecasts
        ]
    }


@router.post("/ingest-all")
async def ingest_weather_all_farms(db: Session = Depends(get_db)):
    """
    Ingest weather for all active farms. For scheduled job / cron.
    Returns count of farms updated and any errors.
    """
    farms = db.query(models.Farm).filter(models.Farm.is_active == True).all()
    results = {"updated": 0, "skipped": 0, "errors": []}

    for farm in farms:
        location = parse_location(farm.location or "")
        if not location:
            results["skipped"] += 1
            continue

        try:
            lat, lon = location
            forecasts = fetch_weather_forecast(lat, lon)
            for fc in forecasts:
                wf = models.WeatherForecast(
                    farm_id=farm.id,
                    forecast_date=fc["forecast_date"],
                    temperature_min=fc["temperature_min"],
                    temperature_max=fc["temperature_max"],
                    temperature_mean=fc["temperature_mean"],
                    humidity=fc["humidity"],
                    rainfall=fc["rainfall"],
                    wind_speed=fc.get("wind_speed"),
                    source=fc["source"],
                    lead_time_hours=fc["lead_time_hours"],
                    raw_data=fc.get("raw_data")
                )
                db.add(wf)
            db.commit()
            results["updated"] += 1
        except Exception as e:
            results["errors"].append({"farm_id": farm.id, "error": str(e)})

    return results


# ---------------------------------------------------------------------------
# MESSAGE DELIVERY (SMS)
# ---------------------------------------------------------------------------

@router.post("/message", response_model=schemas.MessageResponse)
async def send_message(
    message_data: schemas.MessageCreate,
    db: Session = Depends(get_db)
):
    """
    Queue a message for delivery to a farmer via SMS (and/or push).
    Uses Celery async queue if available; falls back to direct send.
    """
    logger.debug(f"Sending message to farmer {message_data.farmer_id}")
    
    farmer = db.query(models.Farmer).filter(models.Farmer.id == message_data.farmer_id).first()
    if not farmer:
        logger.warning(f"Farmer not found: {message_data.farmer_id}")
        raise HTTPException(status_code=404, detail="Farmer not found")

    # Create message record
    msg = models.Message(
        farmer_id=message_data.farmer_id,
        advisory_id=message_data.advisory_id,
        channel=message_data.channel,
        content=message_data.content,
        status="pending"
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Enqueue async SMS via Celery
    try:
        from app.tasks import send_sms_task
        logger.debug(f"Queueing async SMS task for farmer {farmer.id}")
        send_sms_task.delay(
            farmer_id=farmer.id,
            message_text=message_data.content,
            phone_number=farmer.phone,
            advisory_id=message_data.advisory_id,
            language=farmer.preferred_language or "en",
            db_message_id=msg.id
        )
    except Exception as e:
        logger.warning(f"Celery not available, falling back to synchronous SMS send: {str(e)}")
        # Celery not available — send synchronously
        try:
            from app.sms_gateway import send_sms
            result = send_sms(farmer.phone, message_data.content, message_data.advisory_id)
            msg.status = "sent" if result["success"] else "failed"
            msg.provider_message_id = result.get("message_sid")
            msg.error_message = result.get("error") if not result["success"] else None
            msg.sent_at = datetime.utcnow() if result["success"] else None
            db.commit()
            db.refresh(msg)
            logger.info(f"Synchronous SMS sent to farmer {farmer.id}: {'success' if result['success'] else 'failed'}")
        except Exception as sync_error:
            logger.error(f"Failed to send SMS synchronously for farmer {farmer.id}: {str(sync_error)}", exc_info=True)
            msg.status = "failed"
            msg.error_message = str(sync_error)[:255]
            db.commit()

    return msg


@router.put("/message/{message_id}")
async def update_message_status(
    message_id: int,
    status: str,
    provider_message_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update message delivery status (e.g., webhook callback from Twilio)."""
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    allowed_statuses = {"pending", "sent", "delivered", "failed"}
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from {allowed_statuses}")

    msg.status = status
    if provider_message_id:
        msg.provider_message_id = provider_message_id
    if status == "delivered":
        msg.delivered_at = datetime.utcnow()

    db.commit()
    return {"id": msg.id, "status": msg.status}


@router.get("/message/{message_id}", response_model=schemas.MessageResponse)
async def get_message(message_id: int, db: Session = Depends(get_db)):
    """Get message details."""
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg


@router.get("/delivery-stats")
async def delivery_stats(db: Session = Depends(get_db)):
    """SMS delivery statistics."""
    total = db.query(func.count(models.Message.id)).scalar()
    sent = db.query(func.count(models.Message.id)).filter(models.Message.status == "sent").scalar()
    delivered = db.query(func.count(models.Message.id)).filter(models.Message.status == "delivered").scalar()
    failed = db.query(func.count(models.Message.id)).filter(models.Message.status == "failed").scalar()
    pending = db.query(func.count(models.Message.id)).filter(models.Message.status == "pending").scalar()

    delivery_rate = round(((sent + delivered) / total * 100) if total > 0 else 0, 1)

    return {
        "total": total,
        "sent": sent,
        "delivered": delivered,
        "failed": failed,
        "pending": pending,
        "delivery_rate_percent": delivery_rate
    }
