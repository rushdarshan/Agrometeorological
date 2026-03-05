from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, models
import os

router = APIRouter()

@router.post("/register", response_model=schemas.FarmerResponse)
async def register_farmer(
    farmer_data: schemas.FarmerRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new farmer with location and crop info.
    
    - Validates phone format and GPS coordinates
    - Stores consent for advisory and data use
    - Returns farmer ID for subsequent requests
    """
    # Check if farmer already exists
    existing = db.query(models.Farmer).filter(
        models.Farmer.phone == farmer_data.phone
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Format location based on database type
    USE_POSTGIS = "postgresql" in os.getenv("DATABASE_URL", "sqlite")
    
    if USE_POSTGIS:
        from geoalchemy2 import WKTElement
        location = WKTElement(
            f"POINT({farmer_data.longitude} {farmer_data.latitude})",
            srid=4326
        )
    else:
        # For SQLite: store as "lat,lng" string
        location = f"{farmer_data.latitude},{farmer_data.longitude}"
    
    # Create farmer record
    farmer = models.Farmer(
        phone=farmer_data.phone,
        name=farmer_data.name,
        village=farmer_data.village,
        district=farmer_data.district,
        state=farmer_data.state,
        location=location,
        consented_advisory=farmer_data.consented_advisory,
        consented_data_use=farmer_data.consented_data_use,
        preferred_language=farmer_data.preferred_language
    )
    
    db.add(farmer)
    db.flush()
    
    # Create associated farm record
    farm = models.Farm(
        farmer_id=farmer.id,
        farm_name=f"{farmer_data.name}'s Farm",
        location=location,  # Use same location as farmer
        area_hectares=farmer_data.area_hectares,
        crop_name=farmer_data.crop_name,
        sowing_date=farmer_data.sowing_date
    )
    
    db.add(farm)
    db.commit()
    db.refresh(farmer)
    
    return farmer

@router.get("/farmer/{farmer_id}", response_model=schemas.FarmerResponse)
async def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    """Retrieve farmer details by ID."""
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == farmer_id
    ).first()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    return farmer

@router.put("/farmer/{farmer_id}")
async def update_farmer_preferences(
    farmer_id: int,
    updates: dict,
    db: Session = Depends(get_db)
):
    """Update farmer preferences and contact settings."""
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == farmer_id
    ).first()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Allow updates to preferences
    allowed_fields = ["preferred_language", "prefer_sms", "prefer_voice", "prefer_push"]
    for field, value in updates.items():
        if field in allowed_fields:
            setattr(farmer, field, value)
    
    db.commit()
    db.refresh(farmer)
    
    return farmer
