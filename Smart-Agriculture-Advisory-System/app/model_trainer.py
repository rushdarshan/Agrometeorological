"""
ML model training script for crop recommendation.
Trains a Random Forest classifier on Crop_recommendation.csv.
Run: python -m app.model_trainer
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_PATH = BASE_DIR / "Crop_recommendation.csv"
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "crop_recommendation_rf.joblib"
ENCODER_PATH = MODELS_DIR / "label_encoder.joblib"
METADATA_PATH = MODELS_DIR / "model_metadata.json"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET = "label"


def train_and_save():
    """Train Random Forest model and save artifacts to models/ directory."""

    print("=== Crop Recommendation Model Training ===\n")

    # Create models directory
    MODELS_DIR.mkdir(exist_ok=True)

    # Load data
    print(f"Loading data from: {DATA_PATH}")
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"  Dataset shape: {df.shape}")
    print(f"  Crops: {sorted(df[TARGET].unique())}")
    print(f"  Samples per crop: {df[TARGET].value_counts().to_dict()}\n")

    # Prepare features and labels
    X = df[FEATURES].values
    y_raw = df[TARGET].values

    # Encode labels
    le = LabelEncoder()
    y = le.fit_transform(y_raw)

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}\n")

    # Train Random Forest
    print("Training Random Forest classifier...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"  Test Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # Save model and encoder
    joblib.dump(model, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    print(f"\n✓ Model saved: {MODEL_PATH}")
    print(f"✓ Label encoder saved: {ENCODER_PATH}")

    # Save metadata
    metadata = {
        "model_type": "RandomForestClassifier",
        "accuracy": round(accuracy, 4),
        "n_estimators": 200,
        "features": FEATURES,
        "classes": le.classes_.tolist(),
        "n_classes": len(le.classes_),
        "training_samples": len(X_train),
        "version": "1.0.0"
    }
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Metadata saved: {METADATA_PATH}")

    print(f"\n=== Training complete. Accuracy: {accuracy * 100:.2f}% ===")
    return model, le, metadata


if __name__ == "__main__":
    train_and_save()
