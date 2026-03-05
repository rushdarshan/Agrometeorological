from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import os

from app.database import Base

# Check if using PostGIS
USE_POSTGIS = "postgresql" in os.getenv("DATABASE_URL", "sqlite")

# Conditional import
if USE_POSTGIS:
    from sqlalchemy.ext.gis import Geometry
else:
    # For SQLite, we'll just use String to store location as "lat,lng"
    Geometry = None

# Enums for advisory types and severity levels
class AdvisoryType(str, enum.Enum):
    SOWING = "sowing"
    IRRIGATION = "irrigation"
    FERTILIZATION = "fertilization"
    PEST_ALERT = "pest_alert"
    DISEASE_ALERT = "disease_alert"
    FROST_WARNING = "frost_warning"
    HEAT_STRESS = "heat_stress"

class ConfidenceLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class FeedbackType(str, enum.Enum):
    HELPFUL = "helpful"
    NOT_HELPFUL = "not_helpful"
    NEUTRAL = "neutral"

# Models
class User(Base):
    """Extension officer or admin user."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="extension_officer")  # extension_officer, admin, agronomist
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    farms_managed = relationship("Farm", back_populates="extension_officer")
    messages_sent = relationship("BroadcastMessage", back_populates="sender")

class Farmer(Base):
    """Farmer profile with location and consent."""
    __tablename__ = "farmers"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True)
    name = Column(String)
    village = Column(String)
    district = Column(String)
    state = Column(String)
    
    # Location: PostGIS POINT for PostgreSQL, STRING "lat,lng" for SQLite
    if USE_POSTGIS:
        location = Column(Geometry("POINT", srid=4326))
    else:
        location = Column(String)  # Format: "22.3707,72.3694"
    
    # Consent flags
    consented_advisory = Column(Boolean, default=False)
    consented_data_use = Column(Boolean, default=False)
    consented_at = Column(DateTime, nullable=True)
    
    # Contact preferences
    preferred_language = Column(String, default="en")
    prefer_sms = Column(Boolean, default=True)
    prefer_voice = Column(Boolean, default=False)
    prefer_push = Column(Boolean, default=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    farms = relationship("Farm", back_populates="farmer")
    feedbacks = relationship("AdvisoryFeedback", back_populates="farmer")
    messages = relationship("Message", back_populates="farmer")

class Farm(Base):
    """Farm details including crop and area."""
    __tablename__ = "farms"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    extension_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    farm_name = Column(String)
    
    # Location: PostGIS POLYGON for PostgreSQL, STRING for SQLite
    if USE_POSTGIS:
        location = Column(Geometry("POLYGON", srid=4326))
    else:
        location = Column(String)  # Format: "22.3707,72.3694"
    
    area_hectares = Column(Float)
    
    # Crop info
    crop_name = Column(String, index=True)
    sowing_date = Column(DateTime, nullable=True)
    estimated_harvest_date = Column(DateTime, nullable=True)
    
    # Soil properties (user-provided or sensor data)
    soil_ph = Column(Float, nullable=True)
    soil_nitrogen = Column(Float, nullable=True)
    soil_phosphorus = Column(Float, nullable=True)
    soil_potassium = Column(Float, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    farmer = relationship("Farmer", back_populates="farms")
    extension_officer = relationship("User", back_populates="farms_managed")
    advisories = relationship("Advisory", back_populates="farm")

class WeatherForecast(Base):
    """Ingested weather forecast data."""
    __tablename__ = "weather_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    
    # Forecast variables
    forecast_date = Column(DateTime, index=True)
    temperature_min = Column(Float)
    temperature_max = Column(Float)
    temperature_mean = Column(Float)
    humidity = Column(Float)
    rainfall = Column(Float)
    wind_speed = Column(Float, nullable=True)
    
    # Source metadata
    source = Column(String)  # e.g., "openweathermap", "ecmwf", "gfs"
    lead_time_hours = Column(Integer)  # hours from forecast issue to valid time
    
    # Processing metadata
    is_bias_corrected = Column(Boolean, default=False)
    raw_data = Column(JSON, nullable=True)
    
    ingested_at = Column(DateTime, default=datetime.utcnow)
    
    farm = relationship("Farm")

class Advisory(Base):
    """Generated advisory (rule-based or ML-driven)."""
    __tablename__ = "advisories"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    
    advisory_type = Column(Enum(AdvisoryType), index=True)
    severity = Column(Enum(ConfidenceLevel))
    confidence = Column(Float)  # 0.0 to 1.0
    
    # Content
    title = Column(String)
    message = Column(Text)  # Concise SMS-friendly text
    detailed_message = Column(Text, nullable=True)  # For dashboard
    reasoning = Column(Text)  # Explainability: why this advisory?
    
    # Model metadata
    generated_by = Column(String)  # "rule_engine" or "ml_model"
    model_version = Column(String, nullable=True)
    shap_explanation = Column(JSON, nullable=True)
    
    # Timeline
    valid_from = Column(DateTime)
    valid_to = Column(DateTime, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    farm = relationship("Farm", back_populates="advisories")
    feedbacks = relationship("AdvisoryFeedback", back_populates="advisory")
    messages = relationship("Message", back_populates="advisory")

class Message(Base):
    """Sent message (SMS, push, etc.)."""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    advisory_id = Column(Integer, ForeignKey("advisories.id"), nullable=True)
    
    channel = Column(String)  # "sms", "push", "voice", "email"
    content = Column(Text)
    
    # Delivery tracking
    status = Column(String, default="pending")  # pending, sent, delivered, failed
    provider_message_id = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    farmer = relationship("Farmer", back_populates="messages")
    advisory = relationship("Advisory", back_populates="messages")

class AdvisoryFeedback(Base):
    """Farmer feedback on advisory helpfulness."""
    __tablename__ = "advisory_feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    advisory_id = Column(Integer, ForeignKey("advisories.id"))
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    
    feedback_type = Column(Enum(FeedbackType))
    feedback_text = Column(Text, nullable=True)
    
    # Meta
    created_at = Column(DateTime, default=datetime.utcnow)
    
    advisory = relationship("Advisory", back_populates="feedbacks")
    farmer = relationship("Farmer", back_populates="feedbacks")

class BroadcastMessage(Base):
    """Broadcast message from extension officer to region."""
    __tablename__ = "broadcast_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    
    content = Column(Text)
    target_region = Column(String)  # village, district, etc.
    target_crop = Column(String, nullable=True)
    
    scheduled_send_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sender = relationship("User", back_populates="messages_sent")
