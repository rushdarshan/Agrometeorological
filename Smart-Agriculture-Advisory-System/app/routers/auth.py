from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.database import get_db
from app import schemas, models
from app.auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user
)
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
    existing = db.query(models.Farmer).filter(
        models.Farmer.phone == farmer_data.phone
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    USE_POSTGIS = "postgresql" in os.getenv("DATABASE_URL", "sqlite")

    if USE_POSTGIS:
        from geoalchemy2 import WKTElement
        location = WKTElement(
            f"POINT({farmer_data.longitude} {farmer_data.latitude})",
            srid=4326
        )
    else:
        location = f"{farmer_data.latitude},{farmer_data.longitude}"

    farmer = models.Farmer(
        phone=farmer_data.phone,
        name=farmer_data.name,
        village=farmer_data.village,
        district=farmer_data.district,
        state=farmer_data.state,
        location=location,
        consented_advisory=farmer_data.consented_advisory,
        consented_data_use=farmer_data.consented_data_use,
        consented_at=datetime.utcnow() if farmer_data.consented_advisory else None,
        preferred_language=farmer_data.preferred_language
    )

    db.add(farmer)
    db.flush()

    farm = models.Farm(
        farmer_id=farmer.id,
        farm_name=f"{farmer_data.name}'s Farm",
        location=location,
        area_hectares=farmer_data.area_hectares,
        crop_name=farmer_data.crop_name,
        sowing_date=farmer_data.sowing_date
    )

    db.add(farm)
    db.commit()
    db.refresh(farmer)

    return farmer


@router.post("/login", response_model=schemas.TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Extension officer login.
    Returns JWT access token + refresh token.
    """
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    }


@router.post("/refresh", response_model=schemas.TokenResponse)
async def refresh_token(
    token_data: schemas.RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Issue new access token from a valid refresh token."""
    payload = decode_token(token_data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    new_refresh = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    }


@router.get("/me")
async def get_me(current_user: models.User = Depends(get_current_user)):
    """Return the currently authenticated extension officer."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }


@router.post("/create-officer", response_model=schemas.UserResponse)
async def create_officer(
    data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """
    Create an extension officer account (admin/setup use).
    """
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=data.email,
        full_name=data.full_name,
        phone=data.phone,
        hashed_password=hash_password(data.password),
        role=data.role or "extension_officer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/farmer/{farmer_id}", response_model=schemas.FarmerResponse)
async def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    """Retrieve farmer details by ID."""
    farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
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
    farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    allowed_fields = ["preferred_language", "prefer_sms", "prefer_voice", "prefer_push"]
    for field, value in updates.items():
        if field in allowed_fields:
            setattr(farmer, field, value)

    db.commit()
    db.refresh(farmer)
    return farmer
