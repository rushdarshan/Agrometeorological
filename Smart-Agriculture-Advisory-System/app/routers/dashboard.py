from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app import schemas, models

router = APIRouter()

@router.get("/farms", response_model=List[dict])
async def list_farms(
    district: Optional[str] = None,
    crop: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get list of farms for dashboard display.
    
    Optional filters by district and crop.
    Returns last advisory and weather for each farm.
    """
    query = db.query(models.Farm, models.Farmer).join(models.Farmer)
    
    if district:
        query = query.filter(models.Farmer.district == district)
    if crop:
        query = query.filter(models.Farm.crop_name == crop)
    
    farms_data = query.limit(limit).all()
    
    result = []
    for farm, farmer in farms_data:
        # Get last advisory
        last_advisory = db.query(models.Advisory).filter(
            models.Advisory.farm_id == farm.id
        ).order_by(models.Advisory.generated_at.desc()).first()
        
        result.append({
            "id": farm.id,
            "farm_name": farm.farm_name,
            "crop_name": farm.crop_name,
            "area_hectares": farm.area_hectares,
            "village": farmer.village,
            "last_advisory": {
                "id": last_advisory.id,
                "advisory_type": last_advisory.advisory_type,
                "message": last_advisory.message,
                "confidence": last_advisory.confidence,
                "generated_at": last_advisory.generated_at
            } if last_advisory else None,
            "last_weather": None
        })
    
    return result

@router.get("/regional-stats")
async def get_regional_stats(
    district: Optional[str] = None,
    crop: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get aggregated statistics for a region."""
    farmer_query = db.query(models.Farmer)
    farm_query = db.query(models.Farm)
    
    if district:
        farmer_query = farmer_query.filter(models.Farmer.district == district)
        farm_query = farm_query.join(models.Farmer).filter(
            models.Farmer.district == district
        )
    
    if crop:
        farm_query = farm_query.filter(models.Farm.crop_name == crop)
    
    total_farmers = farmer_query.count()
    total_farms = farm_query.count()
    
    # Active advisories (issued in last 7 days)
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    active_advisories = db.query(func.count(models.Advisory.id)).filter(
        models.Advisory.generated_at >= one_week_ago
    ).scalar()
    
    # Advisory type distribution
    type_dist = db.query(
        models.Advisory.advisory_type,
        func.count(models.Advisory.id)
    ).group_by(models.Advisory.advisory_type).all()
    
    # Feedback metrics
    feedbacks = db.query(models.AdvisoryFeedback).all()
    if feedbacks:
        helpful = sum(1 for f in feedbacks if f.feedback_type == "helpful")
        engagement_rate = (helpful / len(feedbacks) * 100)
    else:
        engagement_rate = 0
    
    return {
        "total_farms": total_farms,
        "total_farmers": total_farmers,
        "active_advisories_count": active_advisories,
        "avg_engagement_rate": round(engagement_rate, 2),
        "advisory_type_distribution": dict(type_dist),
        "district": district,
        "crop": crop
    }

@router.get("/farm/{farm_id}/timeline")
async def get_farm_timeline(
    farm_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get timeline of advisories and weather for a farm."""
    since = datetime.utcnow() - timedelta(days=days)
    
    advisories = db.query(models.Advisory).filter(
        and_(
            models.Advisory.farm_id == farm_id,
            models.Advisory.generated_at >= since
        )
    ).order_by(models.Advisory.generated_at).all()
    
    forecast = db.query(models.WeatherForecast).filter(
        and_(
            models.WeatherForecast.farm_id == farm_id,
            models.WeatherForecast.forecast_date >= since
        )
    ).order_by(models.WeatherForecast.forecast_date).all()
    
    return {
        "farm_id": farm_id,
        "days": days,
        "advisories": [
            {
                "id": a.id,
                "type": a.advisory_type,
                "message": a.message,
                "severity": a.severity,
                "generated_at": a.generated_at
            } for a in advisories
        ],
        "weather": [
            {
                "date": w.forecast_date,
                "temp_mean": w.temperature_mean,
                "humidity": w.humidity,
                "rainfall": w.rainfall
            } for w in forecast
        ]
    }

@router.get("/broadcast/{message_id}")
async def get_broadcast(message_id: int, db: Session = Depends(get_db)):
    """Get broadcast message details."""
    msg = db.query(models.BroadcastMessage).filter(
        models.BroadcastMessage.id == message_id
    ).first()
    
    if not msg:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    
    return {
        "id": msg.id,
        "content": msg.content,
        "target_region": msg.target_region,
        "target_crop": msg.target_crop,
        "sent_at": msg.sent_at,
        "created_at": msg.created_at
    }

@router.post("/broadcast")
async def create_broadcast(
    content: str,
    target_region: str,
    target_crop: Optional[str] = None,
    user_id: int = None,
    db: Session = Depends(get_db)
):
    """Create a broadcast message from extension officer."""
    
    # Verify user exists (would be from JWT auth in production)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    broadcast = models.BroadcastMessage(
        sender_id=user_id,
        content=content,
        target_region=target_region,
        target_crop=target_crop,
        scheduled_send_at=None  # Send immediately
    )
    
    db.add(broadcast)
    db.commit()
    db.refresh(broadcast)
    
    # TODO: Trigger async job to send to all matching farmers
    
    return {
        "id": broadcast.id,
        "created_at": broadcast.created_at,
        "target_region": target_region
    }
