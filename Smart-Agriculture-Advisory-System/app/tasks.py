"""
Celery async task queue for background SMS delivery.
Redis is used as both broker and result backend.
"""

import os
import logging
from celery import Celery

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "agriculture_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.tasks.send_sms_task": {"queue": "sms"},
        "app.tasks.send_bulk_sms_task": {"queue": "sms"},
        "app.tasks.generate_farm_advisories_task": {"queue": "advisories"},
    }
)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60, name="app.tasks.send_sms_task")
def send_sms_task(self, farmer_id: int, message_text: str, phone_number: str,
                  advisory_id: int = None, language: str = "en", db_message_id: int = None):
    """
    Send a single SMS asynchronously. Retries up to 3 times on failure.
    Updates message status in database after send.
    """
    from app.database import SessionLocal
    from app import models
    from app.sms_gateway import send_sms

    db = SessionLocal()
    try:
        result = send_sms(phone_number, message_text, advisory_id)

        if db_message_id:
            msg = db.query(models.Message).filter(models.Message.id == db_message_id).first()
            if msg:
                from datetime import datetime
                if result["success"]:
                    msg.status = "sent"
                    msg.provider_message_id = result.get("message_sid")
                    msg.sent_at = datetime.utcnow()
                else:
                    msg.status = "failed"
                    msg.error_message = result.get("error", "")[:255]
                db.commit()

        if not result["success"] and result.get("error") != "SMS disabled in configuration":
            raise self.retry(exc=Exception(result.get("error", "SMS send failed")))

        return result

    except Exception as exc:
        if db_message_id:
            msg = db.query(models.Message).filter(models.Message.id == db_message_id).first()
            if msg:
                msg.status = "failed"
                msg.error_message = str(exc)[:255]
                db.commit()
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(name="app.tasks.send_bulk_sms_task")
def send_bulk_sms_task(farm_id: int, message_text: str, advisory_id: int = None):
    """Send SMS to all farmers in a farm (just one farmer per farm for now)."""
    from app.database import SessionLocal
    from app import models

    db = SessionLocal()
    try:
        farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
        if not farm or not farm.farmer:
            return {"sent": 0, "error": "Farm or farmer not found"}

        farmer = farm.farmer
        if farmer.prefer_sms and farmer.consented_advisory:
            send_sms_task.delay(
                farmer_id=farmer.id,
                message_text=message_text,
                phone_number=farmer.phone,
                advisory_id=advisory_id,
                language=farmer.preferred_language or "en"
            )
            return {"sent": 1, "farmer_id": farmer.id}
        return {"sent": 0, "reason": "Farmer not opted in for SMS"}
    finally:
        db.close()


@celery_app.task(name="app.tasks.generate_farm_advisories_task")
def generate_farm_advisories_task(farm_id: int):
    """Background task to generate advisories for a single farm."""
    from app.database import SessionLocal
    from app import models
    from app.advisory_engine import evaluate_farm_conditions, calculate_crop_stage
    from app.weather_service import fetch_weather_forecast, build_weather_summary, parse_location
    from datetime import datetime

    db = SessionLocal()
    try:
        farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
        if not farm:
            return {"error": f"Farm {farm_id} not found"}

        # Get location
        location = parse_location(farm.location or "")
        if not location:
            return {"error": "Farm location not set"}

        lat, lon = location
        forecasts = fetch_weather_forecast(lat, lon)

        # Store weather forecasts
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

        weather_summary = build_weather_summary(forecasts)
        farm_data = {
            "farm_id": farm.id,
            "crop_name": farm.crop_name or "Rice",
            "sowing_date": farm.sowing_date,
            "soil_ph": farm.soil_ph,
            "soil_nitrogen": farm.soil_nitrogen,
            "soil_phosphorus": farm.soil_phosphorus,
            "soil_potassium": farm.soil_potassium,
        }
        crop_stage = calculate_crop_stage(farm.crop_name or "Rice", farm.sowing_date or datetime.utcnow())
        advisories = evaluate_farm_conditions(farm_data, weather_summary, crop_stage)

        created = 0
        for adv in advisories:
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
                valid_from=datetime.utcnow()
            )
            db.add(advisory)
            db.flush()

            # Queue SMS
            send_bulk_sms_task.delay(farm.id, adv["message"], advisory.id)
            created += 1

        db.commit()
        return {"farm_id": farm_id, "advisories_created": created, "weather_source": forecasts[0]["source"] if forecasts else "none"}
    finally:
        db.close()
