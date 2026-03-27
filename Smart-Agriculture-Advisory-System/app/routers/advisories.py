from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

from app.database import get_db
from app import schemas, models
from app.advisory_engine import evaluate_farm_conditions, calculate_crop_stage
from app.weather_service import fetch_weather_forecast, build_weather_summary, parse_location
from app.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/advisory", response_model=dict)
async def create_advisory(
    advisory_data: schemas.AdvisoryCreate,
    db: Session = Depends(get_db)
):
    """Create an advisory for a farm manually."""
    farm = db.query(models.Farm).filter(models.Farm.id == advisory_data.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    advisory = models.Advisory(
        farm_id=advisory_data.farm_id,
        advisory_type=advisory_data.advisory_type,
        severity=advisory_data.severity,
        confidence=advisory_data.confidence,
        title=advisory_data.title,
        message=advisory_data.message,
        detailed_message=advisory_data.detailed_message,
        reasoning=advisory_data.reasoning,
        generated_by=advisory_data.generated_by,
        model_version=advisory_data.model_version,
        valid_from=datetime.utcnow(),
        valid_to=None
    )

    db.add(advisory)
    db.commit()
    db.refresh(advisory)

    return {
        "id": advisory.id,
        "farm_id": advisory.farm_id,
        "advisory_type": advisory.advisory_type,
        "message": advisory.message,
        "confidence": advisory.confidence
    }


@router.post("/generate/{farm_id}")
async def generate_farm_advisories(farm_id: int, db: Session = Depends(get_db)):
    """
    Auto-generate advisories for a farm using weather data + rule engine + ML.
    Fetches fresh weather, evaluates all applicable rules, stores results, queues SMS.
    """
    logger.info(f"Generating advisories for farm {farm_id}")
    
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        logger.warning(f"Farm not found: {farm_id}")
        raise HTTPException(status_code=404, detail="Farm not found")

    location = parse_location(farm.location or "")
    if not location:
        logger.error(f"Invalid or missing location for farm {farm_id}: {farm.location}")
        raise HTTPException(status_code=400, detail="Farm location not set or invalid format")

    lat, lon = location
    
    try:
        # Fetch and store weather
        logger.debug(f"Fetching weather forecast for farm {farm_id} at ({lat}, {lon})")
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
        logger.debug(f"Stored {len(forecasts)} weather forecasts for farm {farm_id}")
    except Exception as e:
        logger.error(f"Failed to fetch/store weather for farm {farm_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch weather data")

    try:
        weather_summary = build_weather_summary(forecasts)
        sowing_date = farm.sowing_date or datetime.utcnow()
        crop_stage = calculate_crop_stage(farm.crop_name or "Rice", sowing_date)

        farm_data = {
            "farm_id": farm.id,
            "crop_name": farm.crop_name or "Rice",
            "sowing_date": sowing_date,
            "soil_ph": farm.soil_ph,
            "soil_nitrogen": farm.soil_nitrogen,
            "soil_phosphorus": farm.soil_phosphorus,
            "soil_potassium": farm.soil_potassium,
        }

        logger.debug(f"Evaluating farm conditions for farm {farm_id}")
        triggered_advisories = evaluate_farm_conditions(farm_data, weather_summary, crop_stage)
        logger.info(f"Generated {len(triggered_advisories)} advisories for farm {farm_id}")
    except Exception as e:
        logger.error(f"Failed to evaluate farm conditions for farm {farm_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate advisories")

    created = []
    farmer = farm.farmer

    for adv in triggered_advisories:
        try:
            advisory = models.Advisory(
                farm_id=farm.id,
                advisory_type=adv["advisory_type"],
                severity=adv["severity"],
                confidence=adv["confidence"],
                title=adv["title"][:100],
                message=adv["message"],
                reasoning=adv["reasoning"],
                generated_by=adv.get("generated_by", "rule_engine"),
                model_version=adv.get("model_version"),
                shap_explanation=adv.get("shap_explanation"),
                valid_from=datetime.utcnow(),
            )
            db.add(advisory)
            db.flush()

            if farmer and farmer.prefer_sms and farmer.consented_advisory:
                try:
                    from app.translations import format_sms
                    from app.tasks import send_sms_task
                    
                    lang = farmer.preferred_language or "en"
                    sms_text = format_sms(
                        advisory_type=adv["advisory_type"],
                        message=adv["message"],
                        severity=adv["severity"],
                        crop_name=farm.crop_name or "",
                        language=lang
                    )
                    
                    msg = models.Message(
                        farmer_id=farmer.id,
                        advisory_id=advisory.id,
                        channel="sms",
                        content=sms_text,
                        status="pending"
                    )
                    db.add(msg)
                    db.flush()
                    
                    logger.debug(f"Queueing SMS for farmer {farmer.id}, advisory {advisory.id}")
                    send_sms_task.delay(
                        farmer_id=farmer.id,
                        message_text=sms_text,
                        phone_number=farmer.phone,
                        advisory_id=advisory.id,
                        language=lang,
                        db_message_id=msg.id
                    )
                except Exception as e:
                    logger.error(f"Failed to queue SMS for farmer {farmer.id}: {str(e)}", exc_info=True)
                    # Continue processing other advisories even if SMS queueing fails

            created.append({
                "id": advisory.id,
                "advisory_type": adv["advisory_type"],
                "severity": adv["severity"],
                "confidence": adv["confidence"],
                "message": adv["message"][:80],
                "generated_by": adv.get("generated_by", "rule_engine"),
            })
        except Exception as e:
            logger.error(f"Failed to create advisory for farm {farm_id}: {str(e)}", exc_info=True)
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to create advisory")

    db.commit()
    logger.info(f"Successfully created {len(created)} advisories for farm {farm_id}")

    return {
        "farm_id": farm_id,
        "crop": farm.crop_name,
        "crop_stage": crop_stage,
        "weather_source": forecasts[0]["source"] if forecasts else "none",
        "weather_summary": weather_summary,
        "advisories_generated": len(created),
        "advisories": created
    }


@router.post("/generate-all")
async def generate_all_farms(db: Session = Depends(get_db)):
    """Auto-generate advisories for all active farms (daily job trigger)."""
    logger.info("Starting advisory generation for all farms")
    
    farms = db.query(models.Farm).filter(models.Farm.is_active == True).all()
    results = {"queued": 0, "skipped": 0, "farm_ids": [], "errors": []}
    
    logger.info(f"Found {len(farms)} active farms to process")

    for farm in farms:
        if not parse_location(farm.location or ""):
            logger.debug(f"Skipping farm {farm.id} - invalid location")
            results["skipped"] += 1
            continue
        try:
            from app.tasks import generate_farm_advisories_task
            generate_farm_advisories_task.delay(farm.id)
            results["queued"] += 1
            results["farm_ids"].append(farm.id)
            logger.debug(f"Queued advisory generation for farm {farm.id}")
        except Exception as e:
            logger.error(f"Failed to queue advisory generation for farm {farm.id}: {str(e)}", exc_info=True)
            results["skipped"] += 1
            results["errors"].append({"farm_id": farm.id, "error": str(e)})

    logger.info(f"Advisory generation batch complete: queued={results['queued']}, skipped={results['skipped']}")
    return results


@router.get("/farm/{farm_id}", response_model=List[schemas.AdvisoryResponse])
async def get_farm_advisories(
    farm_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recent advisories for a farm."""
    advisories = db.query(models.Advisory).filter(
        models.Advisory.farm_id == farm_id
    ).order_by(desc(models.Advisory.generated_at)).limit(limit).all()
    return advisories


@router.get("/advisory/{advisory_id}", response_model=dict)
async def get_advisory_detail(advisory_id: int, db: Session = Depends(get_db)):
    """Get advisory with full details, reasoning, and SHAP explanation."""
    advisory = db.query(models.Advisory).filter(models.Advisory.id == advisory_id).first()
    if not advisory:
        raise HTTPException(status_code=404, detail="Advisory not found")

    return {
        "id": advisory.id,
        "advisory_type": advisory.advisory_type,
        "title": advisory.title,
        "message": advisory.message,
        "detailed_message": advisory.detailed_message,
        "reasoning": advisory.reasoning,
        "confidence": advisory.confidence,
        "severity": advisory.severity,
        "generated_by": advisory.generated_by,
        "model_version": advisory.model_version,
        "shap_explanation": advisory.shap_explanation,
        "generated_at": advisory.generated_at
    }


@router.put("/advisory/{advisory_id}")
async def update_advisory(advisory_id: int, updates: dict, db: Session = Depends(get_db)):
    """Update advisory fields."""
    advisory = db.query(models.Advisory).filter(models.Advisory.id == advisory_id).first()
    if not advisory:
        raise HTTPException(status_code=404, detail="Advisory not found")

    allowed_fields = ["valid_to", "shap_explanation"]
    for field, value in updates.items():
        if field in allowed_fields:
            setattr(advisory, field, value)

    db.commit()
    db.refresh(advisory)
    return advisory
