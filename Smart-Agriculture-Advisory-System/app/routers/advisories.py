from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from app.database import get_db
from app import schemas, models

router = APIRouter()

@router.post("/advisory", response_model=dict)
async def create_advisory(
    advisory_data: schemas.AdvisoryCreate,
    db: Session = Depends(get_db)
):
    """
    Create an advisory for a farm.
    
    Called by the advisory engine (rule-based or ML-driven).
    Includes reasoning and confidence score for explainability.
    """
    # Verify farm exists
    farm = db.query(models.Farm).filter(
        models.Farm.id == advisory_data.farm_id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Create advisory
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
        valid_from=__import__('datetime').datetime.utcnow(),
        valid_to=None  # Can be updated by scheduler
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
async def get_advisory_detail(
    advisory_id: int,
    db: Session = Depends(get_db)
):
    """Get advisory with full details and explanations."""
    advisory = db.query(models.Advisory).filter(
        models.Advisory.id == advisory_id
    ).first()
    
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
async def update_advisory(
    advisory_id: int,
    updates: dict,
    db: Session = Depends(get_db)
):
    """Update advisory (e.g., add SHAP explanation after fact)."""
    advisory = db.query(models.Advisory).filter(
        models.Advisory.id == advisory_id
    ).first()
    
    if not advisory:
        raise HTTPException(status_code=404, detail="Advisory not found")
    
    allowed_fields = ["valid_to", "shap_explanation"]
    for field, value in updates.items():
        if field in allowed_fields:
            setattr(advisory, field, value)
    
    db.commit()
    db.refresh(advisory)
    
    return advisory
