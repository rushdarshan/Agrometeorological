from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app import schemas, models
from app.sms_gateway import send_sms, format_phone_number
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/message", response_model=schemas.MessageResponse)
async def send_message(
    message_data: schemas.MessageCreate,
    db: Session = Depends(get_db)
):
    """
    Queue a message for delivery (SMS, push, voice, etc.).
    
    Called by the messaging pipeline after advisory generation.
    Tracks delivery status for monitoring.
    """
    # Verify farmer exists
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == message_data.farmer_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Create message record
    message = models.Message(
        farmer_id=message_data.farmer_id,
        advisory_id=message_data.advisory_id,
        channel=message_data.channel,
        content=message_data.content,
        status="pending"
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Send SMS for SMS channels
    if message_data.channel == "sms" and farmer.phone:
        try:
            formatted_phone = format_phone_number(farmer.phone)
            sms_result = send_sms(
                phone_number=formatted_phone,
                message_text=message_data.content,
                advisory_id=message_data.advisory_id
            )
            
            if sms_result["success"]:
                message.status = "sent"
                message.provider_message_id = sms_result.get("message_sid")
                logger.info(f"✓ SMS sent successfully. SID: {sms_result.get('message_sid')}")
            else:
                message.status = "failed"
                message.error_message = sms_result.get("error")
                logger.warning(f"✗ SMS send failed: {sms_result.get('error')}")
            
            db.commit()
            db.refresh(message)
        
        except Exception as e:
            message.status = "failed"
            message.error_message = str(e)
            db.commit()
            db.refresh(message)
            logger.error(f"Exception sending SMS: {e}")
    
    return message

@router.put("/message/{message_id}")
async def update_message_status(
    message_id: int,
    status: str,
    provider_message_id: Optional[str] = None,
    error_message: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Update message delivery status.
    
    Called by SMS gateway callbacks or scheduled checker.
    """
    message = db.query(models.Message).filter(
        models.Message.id == message_id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.status = status
    if provider_message_id:
        message.provider_message_id = provider_message_id
    if error_message:
        message.error_message = error_message
    if status in ["sent", "delivered"]:
        message.sent_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return message

@router.get("/message/{message_id}", response_model=schemas.MessageResponse)
async def get_message(message_id: int, db: Session = Depends(get_db)):
    """Retrieve message details."""
    message = db.query(models.Message).filter(
        models.Message.id == message_id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return message

@router.get("/delivery-stats")
async def get_delivery_stats(db: Session = Depends(get_db)):
    """Get SMS delivery statistics."""
    total = db.query(models.Message).count()
    sent = db.query(models.Message).filter(
        models.Message.status.in_(["sent", "delivered"])
    ).count()
    failed = db.query(models.Message).filter(
        models.Message.status == "failed"
    ).count()
    pending = db.query(models.Message).filter(
        models.Message.status == "pending"
    ).count()
    
    success_rate = (sent / total * 100) if total > 0 else 0
    
    return {
        "total_messages": total,
        "sent": sent,
        "delivered": db.query(models.Message).filter(
            models.Message.status == "delivered"
        ).count(),
        "failed": failed,
        "pending": pending,
        "success_rate_percent": round(success_rate, 2)
    }
