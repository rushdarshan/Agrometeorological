from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from app.database import get_db
from app import schemas, models
from app.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/farms", response_model=List[dict])
async def list_farms(
    district: Optional[str] = None,
    crop: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get list of farms for dashboard. Includes lat/lon for map view.
    """
    logger.debug(f"Listing farms: district={district}, crop={crop}, limit={limit}")
    
    query = db.query(models.Farm, models.Farmer).join(models.Farmer)

    if district:
        query = query.filter(models.Farmer.district == district)
    if crop:
        query = query.filter(models.Farm.crop_name == crop)

    farms_data = query.limit(limit).all()
    logger.debug(f"Found {len(farms_data)} farms")

    result = []
    for farm, farmer in farms_data:
        lat, lon = None, None
        try:
            if farm.location and "," in str(farm.location):
                parts = str(farm.location).split(",")
                lat = float(parts[0].strip())
                lon = float(parts[1].strip())
        except ValueError as e:
            logger.warning(f"Failed to parse location for farm {farm.id}: {farm.location} - {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error parsing location for farm {farm.id}: {str(e)}", exc_info=True)

        try:
            last_advisory = db.query(models.Advisory).filter(
                models.Advisory.farm_id == farm.id
            ).order_by(models.Advisory.generated_at.desc()).first()

            last_weather = db.query(models.WeatherForecast).filter(
                models.WeatherForecast.farm_id == farm.id
            ).order_by(models.WeatherForecast.ingested_at.desc()).first()

            result.append({
                "id": farm.id,
                "farm_name": farm.farm_name,
                "crop_name": farm.crop_name,
                "area_hectares": farm.area_hectares,
                "village": farmer.village,
                "district": farmer.district,
                "farmer_name": farmer.name,
                "farmer_phone": farmer.phone,
                "lat": lat,
                "lon": lon,
                "last_advisory": {
                    "id": last_advisory.id,
                    "advisory_type": last_advisory.advisory_type.value,
                    "message": last_advisory.message,
                    "severity": last_advisory.severity.value,
                    "confidence": last_advisory.confidence,
                    "generated_at": last_advisory.generated_at
                } if last_advisory else None,
                "last_weather": {
                    "temp_mean": last_weather.temperature_mean,
                    "humidity": last_weather.humidity,
                    "rainfall": last_weather.rainfall,
                    "source": last_weather.source,
                } if last_weather else None,
            })
        except Exception as e:
            logger.error(f"Failed to build farm response for farm {farm.id}: {str(e)}", exc_info=True)
            # Still add farm to result with minimal data rather than failing completely
            result.append({
                "id": farm.id,
                "farm_name": farm.farm_name,
                "crop_name": farm.crop_name,
                "area_hectares": farm.area_hectares,
                "village": farmer.village,
                "district": farmer.district,
                "farmer_name": farmer.name,
                "farmer_phone": farmer.phone,
                "lat": lat,
                "lon": lon,
                "last_advisory": None,
                "last_weather": None,
            })

    return result


@router.get("/regional-stats")
async def get_regional_stats(
    district: Optional[str] = None,
    crop: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get aggregated statistics for a region."""
    logger.debug(f"Calculating regional stats: district={district}, crop={crop}")
    
    try:
        farmer_query = db.query(models.Farmer)
        farm_query = db.query(models.Farm)

        if district:
            farmer_query = farmer_query.filter(models.Farmer.district == district)
            farm_query = farm_query.join(models.Farmer).filter(models.Farmer.district == district)
        if crop:
            farm_query = farm_query.filter(models.Farm.crop_name == crop)

        total_farmers = farmer_query.count()
        total_farms = farm_query.count()
        logger.debug(f"Stats: farmers={total_farmers}, farms={total_farms}")

        one_week_ago = datetime.utcnow() - timedelta(days=7)
        active_advisories = db.query(func.count(models.Advisory.id)).filter(
            models.Advisory.generated_at >= one_week_ago
        ).scalar() or 0

        type_dist = db.query(
            models.Advisory.advisory_type,
            func.count(models.Advisory.id)
        ).group_by(models.Advisory.advisory_type).all()

        feedbacks = db.query(models.AdvisoryFeedback).all()
        if feedbacks:
            helpful = sum(1 for f in feedbacks if f.feedback_type == "helpful")
            engagement_rate = (helpful / len(feedbacks) * 100)
        else:
            engagement_rate = 0

        total_msgs = db.query(func.count(models.Message.id)).scalar() or 0
        sent_msgs = db.query(func.count(models.Message.id)).filter(
            models.Message.status.in_(["sent", "delivered"])
        ).scalar() or 0
        sms_delivery_rate = round((sent_msgs / total_msgs * 100) if total_msgs > 0 else 0, 1)

        logger.info(f"Regional stats calculated: advisories={active_advisories}, delivery_rate={sms_delivery_rate}%")

        return {
            "total_farms": total_farms,
            "total_farmers": total_farmers,
            "active_advisories_count": active_advisories,
            "avg_engagement_rate": round(engagement_rate, 2),
            "advisory_type_distribution": {item[0].value: item[1] for item in type_dist},
            "sms_delivery_rate": sms_delivery_rate,
            "district": district,
            "crop": crop
        }
    except Exception as e:
        logger.error(f"Failed to calculate regional stats: {str(e)}", exc_info=True)
        # Return partial data with zeros instead of failing completely
        return {
            "total_farms": 0,
            "total_farmers": 0,
            "active_advisories_count": 0,
            "avg_engagement_rate": 0,
            "advisory_type_distribution": {},
            "sms_delivery_rate": 0,
            "district": district,
            "crop": crop,
            "error": "Partial data due to calculation error"
        }


@router.get("/advisory-trend")
async def advisory_trend(days: int = 14, db: Session = Depends(get_db)):
    """Daily advisory count for the past N days — for frontend trend chart."""
    since = datetime.utcnow() - timedelta(days=days)
    advisories = db.query(models.Advisory).filter(models.Advisory.generated_at >= since).all()

    counts: dict = defaultdict(int)
    for adv in advisories:
        day = adv.generated_at.strftime("%Y-%m-%d")
        counts[day] += 1

    result = []
    for i in range(days - 1, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        result.append({"date": day, "count": counts.get(day, 0)})

    return {"trend": result, "days": days}


@router.get("/farm/{farm_id}/timeline")
async def get_farm_timeline(farm_id: int, days: int = 30, db: Session = Depends(get_db)):
    """Full timeline of advisories, weather, and messages for a farm."""
    since = datetime.utcnow() - timedelta(days=days)

    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    farmer = farm.farmer

    advisories = db.query(models.Advisory).filter(
        and_(models.Advisory.farm_id == farm_id, models.Advisory.generated_at >= since)
    ).order_by(models.Advisory.generated_at).all()

    forecast = db.query(models.WeatherForecast).filter(
        and_(models.WeatherForecast.farm_id == farm_id, models.WeatherForecast.forecast_date >= since)
    ).order_by(models.WeatherForecast.forecast_date).all()

    messages = []
    if farmer:
        messages = db.query(models.Message).filter(
            and_(models.Message.farmer_id == farmer.id, models.Message.created_at >= since)
        ).order_by(models.Message.created_at.desc()).limit(20).all()

    return {
        "farm_id": farm_id,
        "farm_name": farm.farm_name,
        "crop_name": farm.crop_name,
        "farmer_name": farmer.name if farmer else None,
        "days": days,
        "advisories": [
            {
                "id": a.id,
                "advisory_type": a.advisory_type.value,
                "message": a.message,
                "severity": a.severity.value,
                "confidence": a.confidence,
                "generated_by": a.generated_by,
                "shap_explanation": a.shap_explanation,
                "generated_at": a.generated_at.isoformat()
            } for a in advisories
        ],
        "weather": [
            {
                "date": w.forecast_date,
                "temp_mean": w.temperature_mean,
                "temp_min": w.temperature_min,
                "temp_max": w.temperature_max,
                "humidity": w.humidity,
                "rainfall": w.rainfall,
                "source": w.source,
            } for w in forecast
        ],
        "messages": [
            {
                "id": m.id,
                "channel": m.channel,
                "content": m.content[:80],
                "status": m.status,
                "sent_at": m.sent_at,
            } for m in messages
        ]
    }


@router.get("/broadcast/{message_id}")
async def get_broadcast(message_id: int, db: Session = Depends(get_db)):
    msg = db.query(models.BroadcastMessage).filter(models.BroadcastMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    return {
        "id": msg.id, "content": msg.content,
        "target_region": msg.target_region, "target_crop": msg.target_crop,
        "sent_at": msg.sent_at, "created_at": msg.created_at
    }


@router.post("/broadcast")
async def create_broadcast(
    content: str,
    target_region: str,
    target_crop: Optional[str] = None,
    user_id: int = None,
    db: Session = Depends(get_db)
):
    """Create and queue a broadcast message to all matching farmers."""
    logger.info(f"Creating broadcast message for region: {target_region}, crop: {target_crop}")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        logger.warning(f"Unauthorized broadcast attempt - invalid user: {user_id}")
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        broadcast = models.BroadcastMessage(
            sender_id=user_id,
            content=content,
            target_region=target_region,
            target_crop=target_crop,
            scheduled_send_at=None
        )
        db.add(broadcast)
        db.commit()
        db.refresh(broadcast)
        logger.info(f"Broadcast created: id={broadcast.id}")
    except Exception as e:
        logger.error(f"Failed to create broadcast message: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create broadcast")

    query = db.query(models.Farmer).filter(
        models.Farmer.district == target_region,
        models.Farmer.is_active == True,
        models.Farmer.consented_advisory == True
    )
    if target_crop:
        query = query.join(models.Farm).filter(models.Farm.crop_name == target_crop)

    farmers = query.all()
    logger.info(f"Found {len(farmers)} farmers for broadcast")
    
    queued = 0
    failed = 0
    
    for farmer in farmers:
        try:
            from app.tasks import send_sms_task
            logger.debug(f"Queueing broadcast SMS for farmer {farmer.id}")
            send_sms_task.delay(
                farmer_id=farmer.id,
                message_text=content[:160],
                phone_number=farmer.phone,
                language=farmer.preferred_language or "en"
            )
            queued += 1
        except Exception as e:
            logger.error(f"Failed to queue SMS for farmer {farmer.id}: {str(e)}", exc_info=True)
            failed += 1

    logger.info(f"Broadcast queued: {queued} sent, {failed} failed")

    return {
        "id": broadcast.id,
        "created_at": broadcast.created_at,
        "target_region": target_region,
        "farmers_queued": queued,
        "farmers_failed": failed
    }
