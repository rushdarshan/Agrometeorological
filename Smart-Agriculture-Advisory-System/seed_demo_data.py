#!/usr/bin/env python3
"""
Seed script to populate database with demo data for presentation
"""
from datetime import datetime, timedelta
from app.models import Base, Farmer, Farm, Advisory, WeatherForecast, AdvisoryType, ConfidenceLevel
from app.database import DATABASE_URL, SessionLocal, init_db
from sqlalchemy import create_engine

def clear_data(session):
    """Clear existing data"""
    session.query(WeatherForecast).delete()
    session.query(Advisory).delete()
    session.query(Farm).delete()
    session.query(Farmer).delete()
    session.commit()
    print("[OK] Cleared existing data")

def seed_farmers(session):
    """Create test farmers"""
    farmers = [
        Farmer(
            phone="919876543210",
            name="Ramesh Patel",
            village="Kaira",
            district="Kaira",
            state="Gujarat",
            location="22.3707,72.3694",
            consented_advisory=True,
            consented_data_use=True,
            preferred_language="en",
            consented_at=datetime.utcnow()
        ),
        Farmer(
            phone="919123456789",
            name="Priya Singh",
            village="Mehsana",
            district="Mehsana",
            state="Gujarat",
            location="23.5940,72.3692",
            consented_advisory=True,
            consented_data_use=True,
            preferred_language="gu",
            consented_at=datetime.utcnow()
        ),
    ]
    session.add_all(farmers)
    session.commit()
    print(f"[OK] Created {len(farmers)} farmers")
    return farmers

def seed_farms(session, farmers):
    """Create test farms"""
    farms = [
        # Ramesh's farms
        Farm(
            farmer_id=farmers[0].id,
            farm_name="Ramesh's Wheat Farm",
            crop_name="Wheat",
            location="22.3707,72.3694",
            area_hectares=5.0,
            sowing_date=datetime.utcnow() - timedelta(days=45),
            estimated_harvest_date=datetime.utcnow() + timedelta(days=60),
            soil_ph=7.2,
            soil_nitrogen=45.5,
            soil_phosphorus=22.3,
            soil_potassium=180.5,
        ),
        Farm(
            farmer_id=farmers[0].id,
            farm_name="Ramesh's Cotton Farm",
            crop_name="Cotton",
            location="22.3707,72.3694",
            area_hectares=3.5,
            sowing_date=datetime.utcnow() - timedelta(days=30),
            estimated_harvest_date=datetime.utcnow() + timedelta(days=90),
            soil_ph=7.0,
            soil_nitrogen=40.0,
            soil_phosphorus=20.0,
            soil_potassium=170.0,
        ),
        # Priya's farms
        Farm(
            farmer_id=farmers[1].id,
            farm_name="Priya's Rice Farm",
            crop_name="Rice",
            location="23.5940,72.3692",
            area_hectares=4.0,
            sowing_date=datetime.utcnow() - timedelta(days=60),
            estimated_harvest_date=datetime.utcnow() + timedelta(days=30),
            soil_ph=6.8,
            soil_nitrogen=50.0,
            soil_phosphorus=25.0,
            soil_potassium=190.0,
        ),
        Farm(
            farmer_id=farmers[1].id,
            farm_name="Priya's Sugarcane Farm",
            crop_name="Sugarcane",
            location="23.5940,72.3692",
            area_hectares=6.0,
            sowing_date=datetime.utcnow() - timedelta(days=120),
            estimated_harvest_date=datetime.utcnow() + timedelta(days=150),
            soil_ph=7.1,
            soil_nitrogen=60.0,
            soil_phosphorus=28.0,
            soil_potassium=200.0,
        ),
    ]
    session.add_all(farms)
    session.commit()
    print(f"[OK] Created {len(farms)} farms")
    return farms

def seed_advisories(session, farms):
    """Create test advisories"""
    advisories_data = [
        # Wheat farm advisories
        {
            "farm_id": farms[0].id,
            "type": AdvisoryType.IRRIGATION,
            "severity": ConfidenceLevel.HIGH,
            "confidence": 0.95,
            "title": "Irrigation Needed Soon",
            "message": "Current soil moisture is declining. Irrigation recommended within 2-3 days.",
            "generated_by": "Rule Engine v1.0",
            "days_ago": 2,
        },
        {
            "farm_id": farms[0].id,
            "type": AdvisoryType.FERTILIZATION,
            "severity": ConfidenceLevel.MEDIUM,
            "confidence": 0.82,
            "title": "Nitrogen Fertilizer Application",
            "message": "Based on soil analysis and crop stage, nitrogen fertilizer recommended.",
            "generated_by": "ML Model v2.1",
            "days_ago": 5,
        },
        {
            "farm_id": farms[0].id,
            "type": AdvisoryType.PEST_ALERT,
            "severity": ConfidenceLevel.HIGH,
            "confidence": 0.88,
            "title": "Armyworm Pest Alert",
            "message": "High risk of armyworm infestation detected in your region. Monitor crop daily.",
            "generated_by": "ML Model v2.1",
            "days_ago": 1,
        },
        # Cotton farm advisories
        {
            "farm_id": farms[1].id,
            "type": AdvisoryType.DISEASE_ALERT,
            "severity": ConfidenceLevel.MEDIUM,
            "confidence": 0.76,
            "title": "Leaf Spot Disease Risk",
            "message": "High humidity detected. Risk of leaf spot disease. Apply fungicide preventatively.",
            "generated_by": "Rule Engine v1.0",
            "days_ago": 3,
        },
        {
            "farm_id": farms[1].id,
            "type": AdvisoryType.HEAT_STRESS,
            "severity": ConfidenceLevel.LOW,
            "confidence": 0.65,
            "title": "Heat Stress Management",
            "message": "Temperature expected to reach 42°C. Increase irrigation frequency.",
            "generated_by": "Rule Engine v1.0",
            "days_ago": 4,
        },
        # Rice farm advisories
        {
            "farm_id": farms[2].id,
            "type": AdvisoryType.IRRIGATION,
            "severity": ConfidenceLevel.HIGH,
            "confidence": 0.92,
            "title": "Maintain Flood Depth",
            "message": "Current growth stage requires 5-7cm flood depth. Adjust water supply.",
            "generated_by": "Rule Engine v1.0",
            "days_ago": 1,
        },
        {
            "farm_id": farms[2].id,
            "type": AdvisoryType.FERTILIZATION,
            "severity": ConfidenceLevel.HIGH,
            "confidence": 0.89,
            "title": "Urea Top Dressing Recommended",
            "message": "Rice has entered active tillering stage. Urea top dressing needed.",
            "generated_by": "ML Model v2.1",
            "days_ago": 2,
        },
        {
            "farm_id": farms[2].id,
            "type": AdvisoryType.PEST_ALERT,
            "severity": ConfidenceLevel.MEDIUM,
            "confidence": 0.78,
            "title": "Yellow Stem Borer Risk",
            "message": "Monitor for yellow stem borer. Set up light traps if count exceeds threshold.",
            "generated_by": "Rule Engine v1.0",
            "days_ago": 6,
        },
        # Sugarcane farm advisories
        {
            "farm_id": farms[3].id,
            "type": AdvisoryType.IRRIGATION,
            "severity": ConfidenceLevel.MEDIUM,
            "confidence": 0.80,
            "title": "Irrigation Scheduling",
            "message": "Sugarcane requires regular irrigation. Provide 25mm water this week.",
            "generated_by": "Rule Engine v1.0",
            "days_ago": 0,
        },
        {
            "farm_id": farms[3].id,
            "type": AdvisoryType.FERTILIZATION,
            "severity": ConfidenceLevel.HIGH,
            "confidence": 0.85,
            "title": "Potassium Deficiency Risk",
            "message": "Soil K level is adequate but monitor. Luxury consumption may occur.",
            "generated_by": "ML Model v2.1",
            "days_ago": 7,
        },
    ]

    advisories = []
    for data in advisories_data:
        days_ago = data.pop("days_ago")
        advisory = Advisory(
            farm_id=data["farm_id"],
            advisory_type=data["type"],
            severity=data["severity"],
            confidence=data["confidence"],
            title=data["title"],
            message=data["message"],
            reasoning="Based on weather, soil, and historical patterns",
            generated_by=data["generated_by"],
            model_version="v1.0",
            generated_at=datetime.utcnow() - timedelta(days=days_ago),
        )
        advisories.append(advisory)

    session.add_all(advisories)
    session.commit()
    print(f"[OK] Created {len(advisories)} advisories")
    return advisories

def seed_weather(session, farms):
    """Create test weather forecast data"""
    weather_data = []

    for farm in farms:
        # Create 7-day forecast for each farm
        for day_offset in range(7):
            forecast_date = datetime.utcnow() + timedelta(days=day_offset)
            weather = WeatherForecast(
                farm_id=farm.id,
                forecast_date=forecast_date,
                temperature_min=20 + (day_offset % 3),
                temperature_max=34 + (day_offset % 3),
                temperature_mean=28 + (day_offset % 2),
                humidity=65 + (day_offset * 5 % 20),
                rainfall=0 if day_offset != 4 else 15,  # Add rain on day 4
                wind_speed=5 + (day_offset % 4),
                source="OpenWeatherMap",
                lead_time_hours=24 * day_offset,
                is_bias_corrected=False,
            )
            weather_data.append(weather)

    session.add_all(weather_data)
    session.commit()
    print(f"[OK] Created {len(weather_data)} weather forecasts")

def main():
    """Run seed script"""
    print("\n[SEEDING] Smart Agriculture Demo Database\n")
    print("=" * 50)

    # Initialize database tables
    init_db()
    print("[OK] Database tables initialized")

    session = SessionLocal()

    try:
        clear_data(session)
        farmers = seed_farmers(session)
        farms = seed_farms(session, farmers)
        seed_advisories(session, farms)
        seed_weather(session, farms)

        print("=" * 50)
        print("\n[SUCCESS] Demo data seeded successfully!\n")
        print("Farmers created:")
        for farmer in farmers:
            print(f"  • {farmer.name} ({farmer.phone}) - {len(farmer.farms)} farms")
        print()
        print("Sample advisories created:")
        for advisory in session.query(Advisory).limit(5).all():
            print(f"  • {advisory.title} ({advisory.severity.value})")
        print()

    except Exception as e:
        print(f"\n[ERROR] Error seeding data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
