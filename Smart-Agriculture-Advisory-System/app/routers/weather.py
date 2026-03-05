from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from app.database import get_db
from app import schemas, models

router = APIRouter()

@router.post("/feedback", response_model=schemas.FeedbackResponse)
async def submit_feedback(
    feedback_data: schemas.FeedbackCreate,
    farmer_id: int,
    db: Session = Depends(get_db)
):
    """
    Submit farmer feedback on advisory helpfulness.
    
    Collected via SMS reply or app interaction.
    Used to train and improve advisory models.
    """
    # Verify advisory and farmer exist
    advisory = db.query(models.Advisory).filter(
        models.Advisory.id == feedback_data.advisory_id
    ).first()
    if not advisory:
        raise HTTPException(status_code=404, detail="Advisory not found")
    
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == farmer_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Create feedback
    feedback = models.AdvisoryFeedback(
        advisory_id=feedback_data.advisory_id,
        farmer_id=farmer_id,
        feedback_type=feedback_data.feedback_type,
        feedback_text=feedback_data.feedback_text
    )
    
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    return feedback

@router.get("/advisory/{advisory_id}/feedback")
async def get_advisory_feedback(
    advisory_id: int,
    db: Session = Depends(get_db)
):
    """Get feedback aggregation for an advisory."""
    feedbacks = db.query(models.AdvisoryFeedback).filter(
        models.AdvisoryFeedback.advisory_id == advisory_id
    ).all()
    
    total = len(feedbacks)
    helpful = sum(1 for f in feedbacks if f.feedback_type == "helpful")
    not_helpful = sum(1 for f in feedbacks if f.feedback_type == "not_helpful")
    neutral = sum(1 for f in feedbacks if f.feedback_type == "neutral")
    
    return {
        "advisory_id": advisory_id,
        "total_feedbacks": total,
        "helpful": helpful,
        "not_helpful": not_helpful,
        "neutral": neutral,
        "helpful_percent": (helpful / total * 100) if total > 0 else 0
    }

@router.get("/farmer/{farmer_id}/feedbacks")
async def get_farmer_feedbacks(
    farmer_id: int,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get feedback history for a farmer."""
    feedbacks = db.query(models.AdvisoryFeedback).filter(
        models.AdvisoryFeedback.farmer_id == farmer_id
    ).order_by(desc(models.AdvisoryFeedback.created_at)).limit(limit).all()
    
    return feedbacks
