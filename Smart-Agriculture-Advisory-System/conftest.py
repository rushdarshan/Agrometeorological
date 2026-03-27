"""
Pytest configuration and fixtures for Smart Agriculture Advisory System.

This module sets up:
- In-memory SQLite database for testing
- FastAPI TestClient with dependency overrides
- Database session fixtures with rollback
- Sample data fixtures (farmers, farms, weather, advisories)
- Authentication fixtures with JWT tokens
"""

import pytest
import os
import sys
from datetime import datetime, timedelta, UTC
from typing import Generator

from sqlalchemy import create_engine, event, Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Add the app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.database import Base, get_db
from app.main import app
from app.models import (
    User, Farmer, Farm, Crop, AdvisoryType, ConfidenceLevel,
    FeedbackType, WeatherData, Advisory, Feedback, SoilData
)
from app.auth_utils import create_access_token, hash_password
from app.schemas import FarmerRegister, FarmCreate


# ============================================================================
# DATABASE SETUP
# ============================================================================

@pytest.fixture(scope="session")
def db_engine() -> Engine:
    """
    Create an in-memory SQLite database engine for all tests.
    Uses StaticPool to maintain connection across threads.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables from models
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Cleanup
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine: Engine) -> Generator[Session, None, None]:
    """
    Create a fresh database session for each test.
    
    Uses transaction rollback to ensure test isolation without
    recreating tables each time (much faster).
    """
    connection = db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> TestClient:
    """
    Create a FastAPI TestClient with database session override.
    
    All database calls in the app will use the test session,
    ensuring test isolation.
    """
    
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass  # Don't close the session - we handle it in the fixture
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield TestClient(app)
    
    # Cleanup overrides
    app.dependency_overrides.clear()


# ============================================================================
# SAMPLE DATA FIXTURES
# ============================================================================

@pytest.fixture
def test_farmer_data() -> dict:
    """
    Provide valid farmer registration data for testing.
    """
    return {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+234801234567",
        "password": "SecurePass123!",
        "location": "6.5244,3.3792",  # Lagos coordinates
        "state": "Lagos",
        "lga": "Alimosho"
    }


@pytest.fixture
def test_farm_data() -> dict:
    """
    Provide valid farm creation data for testing.
    """
    return {
        "name": "Green Valley Farm",
        "location": "6.5244,3.3792",
        "size_hectares": 5.5,
        "crops": ["maize", "cassava"],
        "soil_type": "loam",
        "notes": "Testing farm with mixed crops"
    }


@pytest.fixture
def test_weather_data() -> dict:
    """
    Provide sample weather forecast data matching API format.
    """
    return {
        "location": "6.5244,3.3792",
        "forecast": [
            {
                "date": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
                "temp_min": 22,
                "temp_max": 28,
                "humidity": 75,
                "rainfall": 5.2,
                "wind_speed": 12,
                "cloud_cover": 60,
                "pressure": 1013,
            },
            {
                "date": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
                "temp_min": 21,
                "temp_max": 27,
                "humidity": 78,
                "rainfall": 8.5,
                "wind_speed": 14,
                "cloud_cover": 80,
                "pressure": 1011,
            },
        ]
    }


@pytest.fixture
def test_advisory_data() -> dict:
    """
    Provide sample advisory data for testing.
    """
    return {
        "farm_id": 1,
        "advisory_type": AdvisoryType.IRRIGATION,
        "title": "Irrigation Advisory for Maize",
        "description": "Based on current soil moisture and weather forecast",
        "recommendation": "Irrigate for 3 hours",
        "confidence": ConfidenceLevel.HIGH,
        "data": {
            "soil_moisture": 45.2,
            "rainfall_forecast": 5.2,
            "days_to_maturity": 45,
        }
    }


@pytest.fixture
def test_feedback_data() -> dict:
    """
    Provide sample feedback data for testing.
    """
    return {
        "advisory_id": 1,
        "feedback_type": FeedbackType.HELPFUL,
        "comment": "Very helpful advisory, saved time",
        "rating": 5,
    }


# ============================================================================
# DATABASE ENTITY FIXTURES
# ============================================================================

@pytest.fixture
def farmer_in_db(db_session: Session, test_farmer_data: dict) -> Farmer:
    """
    Create and persist a test farmer in the database.
    Useful for tests that need an already-registered farmer.
    """
    farmer = Farmer(
        name=test_farmer_data["name"],
        email=test_farmer_data["email"],
        phone=test_farmer_data["phone"],
        hashed_password=hash_password(test_farmer_data["password"]),
        location=test_farmer_data["location"],
        state=test_farmer_data["state"],
        lga=test_farmer_data["lga"],
        is_active=True,
    )
    db_session.add(farmer)
    db_session.commit()
    db_session.refresh(farmer)
    return farmer


@pytest.fixture
def farm_in_db(db_session: Session, farmer_in_db: Farmer) -> Farm:
    """
    Create and persist a test farm in the database.
    """
    farm = Farm(
        farmer_id=farmer_in_db.id,
        name="Test Farm",
        location="6.5244,3.3792",
        size_hectares=5.5,
        soil_type="loam",
        notes="Test farm",
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)
    return farm


@pytest.fixture
def crop_in_db(db_session: Session, farm_in_db: Farm) -> Crop:
    """
    Create and persist a test crop in the database.
    """
    crop = Crop(
        farm_id=farm_in_db.id,
        name="Maize",
        variety="Hybrid",
        planting_date=datetime.now(UTC) - timedelta(days=30),
        expected_harvest_date=datetime.now(UTC) + timedelta(days=90),
        area_hectares=2.5,
        status="growing",
    )
    db_session.add(crop)
    db_session.commit()
    db_session.refresh(crop)
    return crop


@pytest.fixture
def advisory_in_db(
    db_session: Session,
    farm_in_db: Farm,
    test_advisory_data: dict
) -> Advisory:
    """
    Create and persist a test advisory in the database.
    """
    advisory = Advisory(
        farm_id=farm_in_db.id,
        advisory_type=test_advisory_data["advisory_type"],
        title=test_advisory_data["title"],
        description=test_advisory_data["description"],
        recommendation=test_advisory_data["recommendation"],
        confidence=test_advisory_data["confidence"],
        data=test_advisory_data["data"],
        created_at=datetime.now(UTC),
    )
    db_session.add(advisory)
    db_session.commit()
    db_session.refresh(advisory)
    return advisory


@pytest.fixture
def weather_data_in_db(
    db_session: Session,
    farm_in_db: Farm,
    test_weather_data: dict
) -> list[WeatherData]:
    """
    Create and persist test weather data in the database.
    """
    weather_records = []
    for forecast in test_weather_data["forecast"]:
        weather = WeatherData(
            farm_id=farm_in_db.id,
            date=datetime.fromisoformat(forecast["date"]),
            temp_min=forecast["temp_min"],
            temp_max=forecast["temp_max"],
            humidity=forecast["humidity"],
            rainfall=forecast["rainfall"],
            wind_speed=forecast["wind_speed"],
            cloud_cover=forecast["cloud_cover"],
            pressure=forecast["pressure"],
            source="test_openweathermap",
        )
        db_session.add(weather)
        weather_records.append(weather)
    
    db_session.commit()
    for record in weather_records:
        db_session.refresh(record)
    
    return weather_records


# ============================================================================
# AUTHENTICATION FIXTURES
# ============================================================================

@pytest.fixture
def auth_headers(farmer_in_db: Farmer) -> dict:
    """
    Create authorization headers with a valid JWT token for a test farmer.
    """
    access_token = create_access_token(
        data={"sub": farmer_in_db.email},
        expires_delta=timedelta(hours=24)
    )
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def admin_headers(db_session: Session) -> dict:
    """
    Create authorization headers for an admin user.
    """
    admin = User(
        email="admin@example.com",
        phone="+234802345678",
        hashed_password=hash_password("AdminPass123!"),
        full_name="Admin User",
        role="admin",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    
    access_token = create_access_token(
        data={"sub": admin.email},
        expires_delta=timedelta(hours=24)
    )
    return {"Authorization": f"Bearer {access_token}"}


# ============================================================================
# PYTEST CONFIGURATION
# ============================================================================

def pytest_configure(config):
    """
    Register custom markers for test categorization.
    """
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow"
    )
    config.addinivalue_line(
        "markers", "auth: marks tests related to authentication"
    )
    config.addinivalue_line(
        "markers", "weather: marks tests related to weather service"
    )
    config.addinivalue_line(
        "markers", "advisory: marks tests related to advisories"
    )
