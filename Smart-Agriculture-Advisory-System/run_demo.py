#!/usr/bin/env python
"""Quick startup script for demo mode (SQLite + local dev)"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

def main():
    print("=" * 60)
    print("🌾 Smart Agriculture Advisory System - DEMO STARTUP")
    print("=" * 60)
    print()
    
    # Check Python
    print("✓ Python:", sys.version.split()[0])
    
    # Install dependencies if needed
    print("\n📦 Checking dependencies...")
    try:
        import fastapi
        import sqlalchemy
        import react_app
    except ImportError:
        print("Installing requirements...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-r", "requirements.txt"], 
                      capture_output=True)
    
    # Initialize database
    print("\n🗄️  Initializing SQLite database...")
    try:
        from app.init_db import init_database, seed_sample_data, seed_extension_officer
        init_database()
        seed_sample_data()
        seed_extension_officer()
        print("✓ Database initialized with sample data")
    except Exception as e:
        print(f"✗ Database error: {e}")
        return

    # Train ML model if artifacts not present
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "crop_recommendation_rf.joblib")
    if not os.path.exists(model_path):
        print("\n🤖 ML model not found — training from Crop_recommendation.csv ...")
        try:
            from app.model_trainer import train_and_save
            train_and_save()
            print("✓ ML model trained and saved to models/")
        except Exception as e:
            print(f"⚠ ML model training skipped: {e}")
    else:
        print("✓ ML model artifacts found")

    # Start backend
    print("\n🚀 Starting FastAPI backend...")
    print("   → http://localhost:8000")
    print("   → API docs: http://localhost:8000/docs")
    print()
    
    try:
        subprocess.run(
            [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
            cwd=os.getcwd()
        )
    except KeyboardInterrupt:
        print("\n✓ Backend stopped")

if __name__ == "__main__":
    main()
