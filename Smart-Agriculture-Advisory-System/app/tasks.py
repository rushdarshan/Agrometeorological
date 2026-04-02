"""
Celery async task queue for background SMS delivery.
Redis is used as both broker and result backend.
Includes error handling, retry logic, and structured logging.
"""

import os
from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure

from app.logging_config import get_logger

logger = get_logger(__name__)

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


# Task lifecycle hooks for logging
@task_prerun.connect
def task_prerun_handler(task_id=None, task=None, args=None, kwargs=None, **extra):
    """Log when a task starts."""
    logger.info(f"Task starting: {task.name} [task_id={task_id}]")


@task_postrun.connect
def task_postrun_handler(task_id=None, task=None, args=None, kwargs=None, retval=None, **extra):
    """Log when a task completes successfully."""
    logger.info(f"Task completed: {task.name} [task_id={task_id}]")


@task_failure.connect
def task_failure_handler(task_id=None, exception=None, args=None, kwargs=None, traceback=None, **extra):
    """Log when a task fails."""
    logger.error(
        f"Task failed: {extra.get('task').name} [task_id={task_id}]",
        exc_info=(type(exception), exception, traceback)
    )


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    retry_backoff=True,
    retry_backoff_max=600,
    name="app.tasks.send_sms_task"
)
def send_sms_task(
    self,
    farmer_id: int,
    message_text: str,
    phone_number: str,
    advisory_id: int = None,
    language: str = "en",
    db_message_id: int = None
):
    """
    Send a single SMS asynchronously with exponential backoff retry.
    Updates message status in database after send attempt.
    
    Args:
        self: Celery task instance for retry logic
        farmer_id: ID of the farmer to send SMS to
        message_text: SMS text content
        phone_number: Farmer's phone number
        advisory_id: Associated advisory ID (optional)
        language: SMS language code
        db_message_id: Database message record ID to update
    """
    from app.database import SessionLocal
    from app import models
    from app.sms_gateway import send_sms
    from datetime import datetime

    db = SessionLocal()
    try:
        # --- Circuit Breaker: Rate Limiting ---
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        recent_messages = db.query(models.Message).filter(
            models.Message.farmer_id == farmer_id,
            models.Message.created_at >= today_start,
            models.Message.status != "failed"
        ).count()

        if recent_messages >= 2:
            logger.warning(f"Rate limit exceeded: Farmer {farmer_id} already got {recent_messages} messages today.")
            if db_message_id:
                msg = db.query(models.Message).filter(models.Message.id == db_message_id).first()
                if msg:
                    msg.status = "failed"
                    msg.error_message = "Rate limit exceeded (max 2/day)"
                    db.commit()
            return {"success": False, "error": "Rate limit exceeded"}
        # ---------------------------------------

        logger.info(f"Sending SMS to farmer {farmer_id} (phone: {phone_number[:3]}***)")
        result = send_sms(phone_number, message_text, advisory_id)

        # Update message record with delivery status
        if db_message_id:
            msg = db.query(models.Message).filter(models.Message.id == db_message_id).first()
            if msg:
                if result["success"]:
                    msg.status = "sent"
                    msg.provider_message_id = result.get("message_sid")
                    msg.sent_at = datetime.utcnow()
                    logger.info(f"SMS sent successfully: farmer={farmer_id}, message_id={db_message_id}")
                else:
                    msg.status = "failed"
                    msg.error_message = result.get("error", "Unknown error")[:255]
                    logger.warning(f"SMS delivery failed: farmer={farmer_id}, error={result.get('error')}")
                db.commit()

        # Do not retry for non-recoverable errors
        non_recoverable_errors = [
            "SMS disabled in configuration",
            "Phone number is empty",
            "Invalid phone number length"
        ]
        error_msg = result.get("error", "")
        
        should_retry = not result["success"] and not any(e in error_msg for e in non_recoverable_errors)
        
        if should_retry:
            logger.warning(f"Retrying SMS for farmer {farmer_id}, attempt {self.request.retries + 1}")
            raise self.retry(
                exc=Exception(result.get("error", "SMS send failed")),
                countdown=min(2 ** self.request.retries * 60, 600)  # Exponential backoff, max 10 min
            )

        return result

    except self.MaxRetriesExceededError:
        logger.error(f"Max retries exceeded for SMS to farmer {farmer_id}")
        if db_message_id:
            msg = db.query(models.Message).filter(models.Message.id == db_message_id).first()
            if msg:
                msg.status = "failed"
                msg.error_message = "Max retries exceeded"
                db.commit()
        raise
    except Exception as exc:
        logger.error(f"SMS task error for farmer {farmer_id}: {str(exc)}", exc_info=True)
        
        # Update message status on any error
        if db_message_id:
            try:
                msg = db.query(models.Message).filter(models.Message.id == db_message_id).first()
                if msg:
                    msg.status = "failed"
                    msg.error_message = str(exc)[:255]
                    db.commit()
            except Exception as db_error:
                logger.error(f"Failed to update message status: {str(db_error)}", exc_info=True)
        
        # Retry with exponential backoff
        try:
            logger.warning(f"Retrying SMS for farmer {farmer_id}, attempt {self.request.retries + 1}")
            raise self.retry(
                exc=exc,
                countdown=min(2 ** self.request.retries * 60, 600)
            )
        except self.MaxRetriesExceededError:
            logger.error(f"SMS delivery permanently failed for farmer {farmer_id} after {self.max_retries} retries")
            raise
    finally:
        db.close()


@celery_app.task(name="app.tasks.send_bulk_sms_task")
def send_bulk_sms_task(farm_id: int, message_text: str, advisory_id: int = None):
    """
    Send SMS to all farmers associated with a farm.
    Handles farm/farmer not found gracefully with logging.
    """
    from app.database import SessionLocal
    from app import models

    db = SessionLocal()
    try:
        logger.info(f"Starting bulk SMS send for farm {farm_id}")
        
        farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
        if not farm:
            logger.error(f"Farm not found: {farm_id}")
            return {"sent": 0, "error": "Farm not found"}
        
        if not farm.farmer:
            logger.warning(f"No farmer associated with farm {farm_id}")
            return {"sent": 0, "error": "Farm or farmer not found"}

        farmer = farm.farmer
        if farmer.prefer_sms and farmer.consented_advisory:
            logger.info(f"Queuing SMS for farmer {farmer.id} associated with farm {farm_id}")
            send_sms_task.delay(
                farmer_id=farmer.id,
                message_text=message_text,
                phone_number=farmer.phone,
                advisory_id=advisory_id,
                language=farmer.preferred_language or "en"
            )
            return {"sent": 1, "farmer_id": farmer.id}
        else:
            reason = "SMS not preferred" if not farmer.prefer_sms else "Advisory consent not given"
            logger.info(f"Farmer {farmer.id} opted out: {reason}")
            return {"sent": 0, "reason": reason}
    except Exception as e:
        logger.error(f"Error in bulk SMS task for farm {farm_id}: {str(e)}", exc_info=True)
        return {"sent": 0, "error": str(e)}
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=1, name="retrain_ml_model_task")
def retrain_ml_model_task(self, admin_id: int):
    """
    Background worker task to trigger ML model retraining using fresh telemetry data.
    """
    logger.info(f"ML Retraining initiated by Admin ID: {admin_id}")
    try:
        from app.model_trainer import train_and_save
        from app.models import CropYieldTelemetry
        from app.database import SessionLocal
        import pandas as pd
        from pathlib import Path
        
        db = SessionLocal()
        
        # 1. Fetch live telemetry data
        recent_telemetry = db.query(CropYieldTelemetry).filter(
            CropYieldTelemetry.is_successful == True
        ).all()
        
        # 2. Convert to DataFrame mimicking the Kaggle CSV
        if recent_telemetry:
            logger.info(f"Injecting {len(recent_telemetry)} fresh telemetry rows into training corpus.")
            new_data = []
            for t in recent_telemetry:
                new_data.append({
                    "N": t.soil_nitrogen,
                    "P": t.soil_phosphorus,
                    "K": t.soil_potassium,
                    "temperature": t.temperature,
                    "humidity": t.humidity,
                    "ph": t.soil_ph,
                    "rainfall": t.rainfall,
                    "label": t.crop_label
                })
            new_df = pd.DataFrame(new_data)
            
            # Temporary: Save to a staging CSV and let `train_and_save` use an updated dataset,
            # or dynamically inject into `train_and_save`. 
            # For this pipeline, we rewrite the local CSV before triggering the trainer script
            BASE_DIR = Path(__file__).parent.parent
            DATA_PATH = BASE_DIR / "Crop_recommendation.csv"
            
            if DATA_PATH.exists():
                old_df = pd.read_csv(DATA_PATH)
                combined_df = pd.concat([old_df, new_df], ignore_index=True)
                combined_df.to_csv(DATA_PATH, index=False)
                logger.info(f"Updated Crop_recommendation.csv. New shape: {combined_df.shape}")
        
        # 3. Trigger Retrain (Updates .joblib models and metadata.json automatically)
        model, le, metadata = train_and_save()
        
        logger.info(f"ML Model Retraining completed successfully. New Version: {metadata.get('version')}")
        return {"success": True, "samples_injected": len(recent_telemetry) if recent_telemetry else 0}
        
    except Exception as e:
        logger.error(f"Failed to retrain ML model: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.generate_farm_advisories_task")
def generate_farm_advisories_task(farm_id: int):
    """
    Background task to generate advisories for a single farm.
    Includes comprehensive error handling and logging at each step.
    """
    from app.database import SessionLocal
    from app import models
    from app.advisory_engine import evaluate_farm_conditions, calculate_crop_stage
    from app.weather_service import fetch_weather_forecast, build_weather_summary, parse_location
    from datetime import datetime

    db = SessionLocal()
    try:
        logger.info(f"Generating advisories for farm {farm_id}")
        
        farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
        if not farm:
            logger.error(f"Farm not found: {farm_id}")
            return {"error": f"Farm {farm_id} not found"}

        # Get location
        location = parse_location(farm.location or "")
        if not location:
            logger.warning(f"Farm {farm_id} has invalid location: {farm.location}")
            return {"error": "Farm location not set"}

        try:
            lat, lon = location
            logger.debug(f"Fetching weather for farm {farm_id} at ({lat}, {lon})")
            forecasts = fetch_weather_forecast(lat, lon)
            logger.debug(f"Retrieved {len(forecasts)} weather forecasts for farm {farm_id}")
        except Exception as e:
            logger.error(f"Failed to fetch weather for farm {farm_id}: {str(e)}", exc_info=True)
            return {"error": f"Failed to fetch weather: {str(e)}"}

        try:
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
            logger.debug(f"Stored {len(forecasts)} weather records for farm {farm_id}")
        except Exception as e:
            logger.error(f"Failed to store weather forecasts for farm {farm_id}: {str(e)}", exc_info=True)
            db.rollback()
            return {"error": f"Failed to store weather: {str(e)}"}

        try:
            weather_summary = build_weather_summary(forecasts)
            crop_stage = calculate_crop_stage(farm.crop_name or "Rice", farm.sowing_date or datetime.utcnow())
            
            farm_data = {
                "farm_id": farm.id,
                "crop_name": farm.crop_name or "Rice",
                "sowing_date": farm.sowing_date,
                "soil_ph": farm.soil_ph,
                "soil_nitrogen": farm.soil_nitrogen,
                "soil_phosphorus": farm.soil_phosphorus,
                "soil_potassium": farm.soil_potassium,
            }
            
            logger.debug(f"Evaluating farm conditions for farm {farm_id}")
            advisories = evaluate_farm_conditions(farm_data, weather_summary, crop_stage)
            logger.info(f"Generated {len(advisories)} advisories for farm {farm_id}")
        except Exception as e:
            logger.error(f"Failed to evaluate farm conditions for farm {farm_id}: {str(e)}", exc_info=True)
            return {"error": f"Failed to generate advisories: {str(e)}"}

        try:
            created = 0
            for adv in advisories:
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
                        valid_from=datetime.utcnow()
                    )
                    db.add(advisory)
                    db.flush()

                    # Determine if we should trigger an SMS (State-Change & Critical Alert Logic)
                    should_send_sms = False
                    
                    # 1. Urgent / Critical Alerts always fire
                    if adv.get("severity") == "high":
                        should_send_sms = True
                    elif adv.get("advisory_type") in ["disease_alert", "pest_alert", "frost_warning", "heat_stress"]:
                        should_send_sms = True
                    # 2. ML Model Delta Tracking
                    elif adv.get("generated_by") == "ml_model":
                        last_ml_adv = db.query(models.Advisory).filter(
                            models.Advisory.farm_id == farm.id,
                            models.Advisory.generated_by == "ml_model",
                            models.Advisory.id != advisory.id
                        ).order_by(models.Advisory.generated_at.desc()).first()
                        
                        if last_ml_adv:
                            # Title usually holds the crop prediction. If prediction changed, fire SMS!
                            if last_ml_adv.title != advisory.title:
                                should_send_sms = True
                            # If confidence dramatically shifted down (e.g. >15% drop)
                            elif last_ml_adv.confidence is not None and advisory.confidence is not None:
                                if (last_ml_adv.confidence - advisory.confidence) > 0.15:
                                    should_send_sms = True
                        else:
                            # First time ML recommendation ever
                            should_send_sms = True
                    
                    if should_send_sms:
                        logger.debug(f"Queuing SMS for advisory {adv['advisory_type']}, farm {farm_id}")
                        send_bulk_sms_task.delay(farm.id, adv["message"], advisory.id)
                    else:
                        logger.debug(f"Skipping SMS for routine advisory {adv['advisory_type']}, farm {farm_id}")
                    created += 1
                except Exception as adv_error:
                    logger.error(f"Failed to create advisory for farm {farm_id}: {str(adv_error)}", exc_info=True)
                    db.rollback()
                    continue

            db.commit()
            result = {
                "farm_id": farm_id,
                "advisories_created": created,
                "weather_source": forecasts[0]["source"] if forecasts else "none"
            }
            logger.info(f"Advisory generation complete for farm {farm_id}: {created} created")
            return result
        except Exception as e:
            logger.error(f"Failed to commit advisories for farm {farm_id}: {str(e)}", exc_info=True)
            db.rollback()
            return {"error": f"Failed to save advisories: {str(e)}"}
    except Exception as e:
        logger.error(f"Unexpected error in generate_farm_advisories_task for farm {farm_id}: {str(e)}", exc_info=True)
        return {"error": f"Unexpected error: {str(e)}"}
    finally:
        db.close()
