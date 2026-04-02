from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models import CropYieldTelemetry, User
from app.schemas import CropYieldTelemetryCreate, CropYieldTelemetryResponse
from app.auth_utils import get_current_user
from app.tasks import retrain_ml_model_task

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

@router.post("/telemetry", response_model=CropYieldTelemetryResponse, status_code=status.HTTP_201_CREATED)
def submit_telemetry(
    payload: CropYieldTelemetryCreate,
    db: Session = Depends(get_db)
):
    """
    Ingest a successful real-world crop yield directly from the field.
    This data expands the historical baseline to eventually retrain the ML model.
    """
    try:
        telemetry = CropYieldTelemetry(**payload.dict())
        db.add(telemetry)
        db.commit()
        db.refresh(telemetry)
        return telemetry
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record telemetry: {str(e)}"
        )


@router.post("/retrain", status_code=status.HTTP_202_ACCEPTED)
def trigger_retraining(
    current_user: User = Depends(get_current_user)
):
    """
    [Admin Only] Trigger a Celery task to retrain the Random Forest model using 
    the base dataset + any new ingested telemetry.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to trigger model retraining."
        )
    
    # Trigger background Celery ML retraining task
    task = retrain_ml_model_task.delay(admin_id=current_user.id)
    return {"message": "Retraining task initiated", "task_id": task.id}
