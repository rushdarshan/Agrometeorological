from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums
class AdvisoryType(str, Enum):
    SOWING = "sowing"
    IRRIGATION = "irrigation"
    FERTILIZATION = "fertilization"
    PEST_ALERT = "pest_alert"
    DISEASE_ALERT = "disease_alert"
    FROST_WARNING = "frost_warning"
    HEAT_STRESS = "heat_stress"


class ConfidenceLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# --- Authentication Schemas ---

class FarmerRegister(BaseModel):
    phone: str = Field(..., pattern=r"^\+?[0-9]{10,15}$")
    name: str
    village: str
    district: str
    state: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    crop_name: str
    sowing_date: datetime
    area_hectares: float = Field(..., gt=0)
    consented_advisory: bool
    consented_data_use: bool
    preferred_language: str = "en"


class FarmerResponse(BaseModel):
    id: int
    phone: str
    name: str
    village: str
    district: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    password: str
    role: Optional[str] = "extension_officer"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user_id: int
    email: str
    role: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# --- Farm Schemas ---

class FarmCreate(BaseModel):
    farm_name: str
    area_hectares: float = Field(..., gt=0)
    crop_name: str
    sowing_date: datetime
    soil_ph: Optional[float] = None
    soil_nitrogen: Optional[float] = None
    soil_phosphorus: Optional[float] = None
    soil_potassium: Optional[float] = None


class FarmResponse(BaseModel):
    id: int
    farmer_id: int
    farm_name: str
    crop_name: str
    area_hectares: float
    sowing_date: datetime
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Weather Forecast Schemas ---

class WeatherForecastCreate(BaseModel):
    forecast_date: datetime
    temperature_min: float
    temperature_max: float
    temperature_mean: float
    humidity: float = Field(..., ge=0, le=100)
    rainfall: float = Field(..., ge=0)
    wind_speed: Optional[float] = None
    source: str
    lead_time_hours: int


class WeatherForecastResponse(BaseModel):
    id: int
    farm_id: int
    forecast_date: datetime
    temperature_mean: float
    humidity: float
    rainfall: float
    source: str
    is_bias_corrected: bool
    ingested_at: datetime

    class Config:
        from_attributes = True


# --- Advisory Schemas ---

class AdvisoryCreate(BaseModel):
    farm_id: int
    advisory_type: AdvisoryType
    severity: ConfidenceLevel
    confidence: float = Field(..., ge=0, le=1)
    title: str
    message: str
    detailed_message: Optional[str] = None
    reasoning: str
    generated_by: str
    model_version: Optional[str] = None


class AdvisoryResponse(BaseModel):
    id: int
    farm_id: int
    advisory_type: AdvisoryType
    severity: ConfidenceLevel
    confidence: float
    title: str
    message: str
    reasoning: str
    generated_by: str
    generated_at: datetime

    class Config:
        from_attributes = True


# --- Message Schemas ---

class MessageCreate(BaseModel):
    farmer_id: int
    advisory_id: Optional[int] = None
    channel: str = "sms"
    content: str


class MessageResponse(BaseModel):
    id: int
    farmer_id: int
    channel: str
    status: str
    sent_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Feedback Schemas ---

class FeedbackCreate(BaseModel):
    advisory_id: int
    feedback_type: str  # "helpful", "not_helpful", "neutral"
    feedback_text: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    advisory_id: int
    farmer_id: int
    feedback_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Dashboard Schemas ---

class AdvisoryWithFarmName(BaseModel):
    id: int
    farm_id: int
    farm_name: str
    crop_name: str
    advisory_type: AdvisoryType
    message: str
    severity: ConfidenceLevel
    generated_at: datetime


class FarmDashboardView(BaseModel):
    id: int
    farm_name: str
    crop_name: str
    area_hectares: float
    village: str
    district: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    last_advisory: Optional[AdvisoryWithFarmName]
    last_weather: Optional[WeatherForecastResponse]


class RegionalStats(BaseModel):
    total_farms: int
    total_farmers: int
    active_advisories_count: int
    avg_engagement_rate: float
    advisory_type_distribution: dict
    sms_delivery_rate: float


class WeeklyTrendPoint(BaseModel):
    date: str
    count: int


class AdvisoryTrendResponse(BaseModel):
    trend: List[WeeklyTrendPoint]
    days: int


# --- Crop Prediction Schemas ---

class CropPredictionResult(BaseModel):
    crop: str
    confidence: float


class CropPredictResponse(BaseModel):
    recommended_crop: Optional[str]
    top_predictions: List[CropPredictionResult]
    shap_explanation: Optional[dict]
    model_version: Optional[str]
    model_available: bool
