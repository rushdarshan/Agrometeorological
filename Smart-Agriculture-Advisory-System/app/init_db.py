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
    """Insert sample data for local testing."""
    session = SessionLocal()
    
    try:
        # Check if already seeded
        if session.query(models.Farmer).count() > 0:
            print("Sample data already exists, skipping seed.")
            return
        
        from datetime import datetime, timedelta
        
        # Seed sample farmers
        print("Seeding sample data...")
        
        farmers_data = [
            {
                "phone": "+919876543210",
                "name": "Parasnath Kumar",
                "village": "Kheda",
                "district": "Kaira",
                "state": "Gujarat",
                "location": "22.3707,72.3694",  # lat,lng for SQLite
                "crop": "Rice"
            },
            {
                "phone": "+919876543211",
                "name": "Meera Patel",
                "village": "Nadiad",
                "district": "Kaira",
                "state": "Gujarat",
                "location": "22.3889,72.8552",
                "crop": "Wheat"
            },
            {
                "phone": "+919876543212",
                "name": "Rajesh Sharma",
                "village": "Kapadwanj",
                "district": "Kaira",
                "state": "Gujarat",
                "location": "22.2595,72.5342",
                "crop": "Rice"
            }
        ]
        
        for f_data in farmers_data:
            farmer = models.Farmer(
                phone=f_data["phone"],
                name=f_data["name"],
                village=f_data["village"],
                district=f_data["district"],
                state=f_data["state"],
                location=f_data["location"],
                consented_advisory=True,
                consented_data_use=True
            )
            session.add(farmer)
            session.flush()
            
            # Add farm
            farm = models.Farm(
                farmer_id=farmer.id,
                farm_name=f"{farmer.name}'s Farm",
                location=f_data["location"],
                area_hectares=1.5,
                crop_name=f_data["crop"],
                sowing_date=datetime.utcnow() - timedelta(days=15),
                is_active=True
            )
            session.add(farm)
        
        session.commit()
        print(f"✓ Sample data seeded: {len(farmers_data)} farmers")
    
    except Exception as e:
        print(f"✗ Error seeding data: {e}")
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

