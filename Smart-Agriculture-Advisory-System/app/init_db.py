"""Database migration tool for schema setup."""

import os
import sys
from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from app import models

def init_database():
    """Create all tables and PostGIS extension (if using PostgreSQL)."""
    
    USE_POSTGIS = "postgresql" in os.getenv("DATABASE_URL", "sqlite")
    
    if USE_POSTGIS:
        # Get session for PostGIS setup
        session = SessionLocal()
        
        try:
            # Enable PostGIS extension
            print("Enabling PostGIS extension...")
            session.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            session.commit()
            print("✓ PostGIS enabled")
        except Exception as e:
            print(f"⚠ PostGIS setup: {e}")
        
        try:
            # Enable TimescaleDB extension (optional, for future use)
            print("Enabling TimescaleDB extension...")
            session.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))
            session.commit()
            print("✓ TimescaleDB enabled")
        except Exception as e:
            print(f"⚠ TimescaleDB setup: {e} (not critical)")
        
        finally:
            session.close()
    else:
        print("Using SQLite - PostGIS extensions not needed")
    
    # Create all tables via SQLAlchemy ORM
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")

def seed_sample_data():
    """Insert comprehensive sample data for local testing."""
    session = SessionLocal()
    
    try:
        # Check if already seeded
        if session.query(models.Farmer).count() > 0:
            print("Sample data already exists, skipping seed.")
            return
        
        from datetime import datetime, timedelta
        import random
        random.seed(42)
        
        # Seed sample farmers
        print("Seeding sample data...")
        
        farmers_data = [
            {
                "phone": "+919876543210",
                "name": "Murugan Selvam",
                "village": "Uthiramerur",
                "district": "Kanchipuram",
                "state": "Tamil Nadu",
                "location": "12.7839,79.7540",
                "crop": "Rice",
                "area": 3.5,
                "farm_name": "Murugan's Rice Paddy",
            },
            {
                "phone": "+919876543211",
                "name": "Lakshmi Devi",
                "village": "Walajabad",
                "district": "Kanchipuram",
                "state": "Tamil Nadu",
                "location": "12.8520,79.7135",
                "crop": "Sugarcane",
                "area": 5.0,
                "farm_name": "Lakshmi's Sugarcane Field",
            },
            {
                "phone": "+919876543212",
                "name": "Karthik Rajan",
                "village": "Sriperumbudur",
                "district": "Kanchipuram",
                "state": "Tamil Nadu",
                "location": "12.9611,79.9416",
                "crop": "Rice",
                "area": 2.0,
                "farm_name": "Karthik's Farm",
            },
            {
                "phone": "+919876543213",
                "name": "Priya Natarajan",
                "village": "Kanchipuram Town",
                "district": "Kanchipuram",
                "state": "Tamil Nadu",
                "location": "12.8342,79.7036",
                "crop": "Cotton",
                "area": 4.0,
                "farm_name": "Priya's Cotton Farm",
            },
            {
                "phone": "+919876543214",
                "name": "Senthil Kumar",
                "village": "Mamallapuram",
                "district": "Kanchipuram",
                "state": "Tamil Nadu",
                "location": "12.6269,80.1927",
                "crop": "Groundnut",
                "area": 2.5,
                "farm_name": "Senthil's Groundnut Plot",
            },
        ]
        
        farm_ids = []
        farmer_ids = []
        
        for f_data in farmers_data:
            farmer = models.Farmer(
                phone=f_data["phone"],
                name=f_data["name"],
                village=f_data["village"],
                district=f_data["district"],
                state=f_data["state"],
                location=f_data["location"],
                preferred_language="ta",
                consented_advisory=True,
                consented_data_use=True,
            )
            session.add(farmer)
            session.flush()
            farmer_ids.append(farmer.id)
            
            farm = models.Farm(
                farmer_id=farmer.id,
                farm_name=f_data["farm_name"],
                location=f_data["location"],
                area_hectares=f_data["area"],
                crop_name=f_data["crop"],
                sowing_date=datetime.utcnow() - timedelta(days=random.randint(10, 30)),
                soil_ph=round(random.uniform(5.5, 7.5), 1),
                soil_nitrogen=round(random.uniform(40, 120), 0),
                soil_phosphorus=round(random.uniform(20, 60), 0),
                soil_potassium=round(random.uniform(30, 80), 0),
                is_active=True,
            )
            session.add(farm)
            session.flush()
            farm_ids.append(farm.id)
        
        print(f"  ✓ {len(farmers_data)} farmers + farms created")

        # ── Weather Forecasts (7 days per farm) ─────────────────────────
        now = datetime.utcnow()
        for farm_id in farm_ids:
            for day_offset in range(7):
                date = now - timedelta(days=6 - day_offset)
                w = models.WeatherForecast(
                    farm_id=farm_id,
                    forecast_date=date,
                    temperature_min=round(random.uniform(22, 26), 1),
                    temperature_max=round(random.uniform(32, 38), 1),
                    temperature_mean=round(random.uniform(28, 33), 1),
                    humidity=round(random.uniform(55, 85), 1),
                    rainfall=round(random.choice([0, 0, 0.2, 0.5, 1.2, 3.5, 8.0, 15.0]), 1),
                    wind_speed=round(random.uniform(2, 12), 1),
                    source="OpenWeatherMap",
                    lead_time_hours=24 * (7 - day_offset),
                    ingested_at=date,
                )
                session.add(w)
        
        session.flush()
        print(f"  ✓ {len(farm_ids) * 7} weather forecasts created")

        # ── Advisories ──────────────────────────────────────────────────
        advisories_data = [
            # Farm 1 – Murugan's Rice Paddy
            {"farm_idx": 0, "type": "irrigation", "severity": "high", "confidence": 0.92,
             "title": "Irrigation Alert", "days_ago": 1,
             "message": "Current soil moisture is declining. Irrigation recommended within 2-3 days.",
             "generated_by": "Rule Engine v1.0"},
            {"farm_idx": 0, "type": "fertilization", "severity": "medium", "confidence": 0.85,
             "title": "Fertilization Needed", "days_ago": 4,
             "message": "Based on soil analysis and crop stage, nitrogen fertilizer recommended.",
             "generated_by": "Rule Engine v1.0"},
            {"farm_idx": 0, "type": "pest_alert", "severity": "high", "confidence": 0.88,
             "title": "Pest Alert – Brown Planthopper", "days_ago": 2,
             "message": "Brown planthopper risk detected. Apply neem oil spray on rice paddies.",
             "generated_by": "Rule Engine v1.0"},
            # Farm 2 – Lakshmi's Sugarcane
            {"farm_idx": 1, "type": "irrigation", "severity": "medium", "confidence": 0.80,
             "title": "Irrigation Schedule", "days_ago": 0,
             "message": "Sugarcane requires regular irrigation. Provide 25mm water this week.",
             "generated_by": "Rule Engine v1.0"},
            {"farm_idx": 1, "type": "disease_alert", "severity": "high", "confidence": 0.91,
             "title": "Red Rot Warning", "days_ago": 3,
             "message": "Red rot disease risk high due to humidity. Apply fungicide treatment.",
             "generated_by": "Rule Engine v1.0"},
            {"farm_idx": 1, "type": "heat_stress", "severity": "medium", "confidence": 0.78,
             "title": "Heat Stress Advisory", "days_ago": 5,
             "message": "Temperature exceeding 35°C. Increase irrigation frequency for sugarcane.",
             "generated_by": "Rule Engine v1.0"},
            # Farm 3 – Karthik's Farm (Rice)
            {"farm_idx": 2, "type": "sowing", "severity": "low", "confidence": 0.90,
             "title": "Transplanting Window", "days_ago": 6,
             "message": "Optimal sowing window: Prepare seedbed and start transplanting rice.",
             "generated_by": "Rule Engine v1.0"},
            {"farm_idx": 2, "type": "fertilization", "severity": "medium", "confidence": 0.82,
             "title": "Urea Top Dressing", "days_ago": 2,
             "message": "Rice has reached tillering stage. Urea top dressing needed.",
             "generated_by": "Rule Engine v1.0"},
            # Farm 4 – Priya's Cotton Farm
            {"farm_idx": 3, "type": "pest_alert", "severity": "high", "confidence": 0.94,
             "title": "Bollworm Alert", "days_ago": 1,
             "message": "American bollworm infestation risk high. Apply BT spray immediately.",
             "generated_by": "Rule Engine v1.0"},
            {"farm_idx": 3, "type": "irrigation", "severity": "low", "confidence": 0.75,
             "title": "Drip Irrigation Check", "days_ago": 4,
             "message": "Cotton drip irrigation system check due. Verify emitter flow rates.",
             "generated_by": "Rule Engine v1.0"},
            # Farm 5 – Senthil's Groundnut
            {"farm_idx": 4, "type": "disease_alert", "severity": "medium", "confidence": 0.86,
             "title": "Tikka Disease Warning", "days_ago": 3,
             "message": "Leaf spot (tikka) disease risk increasing. Apply mancozeb fungicide.",
             "generated_by": "Rule Engine v1.0"},
            {"farm_idx": 4, "type": "sowing", "severity": "low", "confidence": 0.88,
             "title": "Harvest Readiness", "days_ago": 0,
             "message": "Groundnut pods maturing. Check for 75% pod maturity before harvest.",
             "generated_by": "Rule Engine v1.0"},
        ]
        
        advisory_ids = []
        type_map = {
            "irrigation": models.AdvisoryType.IRRIGATION,
            "fertilization": models.AdvisoryType.FERTILIZATION,
            "pest_alert": models.AdvisoryType.PEST_ALERT,
            "disease_alert": models.AdvisoryType.DISEASE_ALERT,
            "sowing": models.AdvisoryType.SOWING,
            "heat_stress": models.AdvisoryType.HEAT_STRESS,
            "frost_warning": models.AdvisoryType.FROST_WARNING,
        }
        severity_map = {
            "high": models.ConfidenceLevel.HIGH,
            "medium": models.ConfidenceLevel.MEDIUM,
            "low": models.ConfidenceLevel.LOW,
        }
        
        for a_data in advisories_data:
            gen_time = now - timedelta(days=a_data["days_ago"], hours=random.randint(1, 12))
            adv = models.Advisory(
                farm_id=farm_ids[a_data["farm_idx"]],
                advisory_type=type_map[a_data["type"]],
                severity=severity_map[a_data["severity"]],
                confidence=a_data["confidence"],
                title=a_data["title"],
                message=a_data["message"],
                reasoning=f"Triggered by weather + soil conditions for {farmers_data[a_data['farm_idx']]['crop']}.",
                generated_by=a_data["generated_by"],
                valid_from=gen_time,
                valid_to=gen_time + timedelta(days=7),
                generated_at=gen_time,
            )
            session.add(adv)
            session.flush()
            advisory_ids.append(adv.id)
        
        print(f"  ✓ {len(advisories_data)} advisories created")

        # ── Messages (SMS delivery tracking) ────────────────────────────
        statuses = ["sent", "delivered", "delivered", "delivered", "sent"]
        for i, adv_id in enumerate(advisory_ids):
            a_data = advisories_data[i]
            farmer_id = farmer_ids[a_data["farm_idx"]]
            sent_time = now - timedelta(days=a_data["days_ago"], hours=random.randint(0, 6))
            msg = models.Message(
                farmer_id=farmer_id,
                advisory_id=adv_id,
                channel="sms",
                content=a_data["message"][:160],
                status=random.choice(statuses),
                sent_at=sent_time,
                delivered_at=sent_time + timedelta(minutes=random.randint(1, 10)) if random.random() > 0.2 else None,
                created_at=sent_time,
            )
            session.add(msg)
        
        session.flush()
        print(f"  ✓ {len(advisory_ids)} SMS messages created")

        # ── Advisory Feedback ───────────────────────────────────────────
        feedback_types = [
            models.FeedbackType.HELPFUL,
            models.FeedbackType.HELPFUL,
            models.FeedbackType.HELPFUL,
            models.FeedbackType.NEUTRAL,
            models.FeedbackType.NOT_HELPFUL,
        ]
        feedback_texts = [
            "Very useful, applied the advice immediately.",
            "Good timing, helped me plan irrigation.",
            "The pest alert saved my crop!",
            "Information was okay but came a bit late.",
            "Not relevant to my situation.",
        ]
        
        for i, adv_id in enumerate(advisory_ids[:8]):
            a_data = advisories_data[i]
            fb = models.AdvisoryFeedback(
                advisory_id=adv_id,
                farmer_id=farmer_ids[a_data["farm_idx"]],
                feedback_type=random.choice(feedback_types),
                feedback_text=random.choice(feedback_texts),
                created_at=now - timedelta(days=a_data["days_ago"]) + timedelta(hours=random.randint(2, 24)),
            )
            session.add(fb)
        
        session.flush()
        print(f"  ✓ 8 farmer feedbacks created")
        
        session.commit()
        print(f"✓ Sample data seeded: {len(farmers_data)} farmers, {len(advisories_data)} advisories, weather + messages + feedback")
    
    except Exception as e:
        print(f"✗ Error seeding data: {e}")
        import traceback
        traceback.print_exc()
        session.rollback()
    
    finally:
        session.close()

def seed_extension_officer():
    """Seed a default extension officer so JWT login works on a fresh database."""
    session = SessionLocal()
    try:
        if session.query(models.User).filter(models.User.email == "admin@agro.local").first():
            print("Default officer already exists, skipping.")
            return

        from app.auth_utils import hash_password
        officer = models.User(
            email="admin@agro.local",
            full_name="System Admin",
            hashed_password=hash_password("admin123"),
            role="admin",
            is_active=True,
        )
        session.add(officer)
        session.commit()
        print("✓ Default extension officer created")
        print("  Email:    admin@agro.local")
        print("  Password: admin123")
        print("  ⚠ Change this password before deploying to production!")
    except Exception as e:
        print(f"✗ Error seeding officer: {e}")
        session.rollback()
    finally:
        session.close()


if __name__ == "__main__":
    print("=== Agriculture Advisory System: Database Init ===\n")
    init_database()
    seed_sample_data()
    seed_extension_officer()
    print("\n✓ Database ready!")

