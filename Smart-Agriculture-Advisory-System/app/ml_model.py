"""
ML model loader with SHAP explainability.
Loads the trained Random Forest from models/ and provides crop prediction + SHAP values.
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional, Tuple

import numpy as np
import joblib

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "crop_recommendation_rf.joblib"
ENCODER_PATH = MODELS_DIR / "label_encoder.joblib"
METADATA_PATH = MODELS_DIR / "model_metadata.json"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

# Module-level lazy-loaded singletons
_model = None
_encoder = None
_metadata = None
_shap_explainer = None
_last_loaded_mtime = 0.0

def _load_artifacts():
    global _model, _encoder, _metadata, _last_loaded_mtime
    
    current_mtime = 0.0
    if METADATA_PATH.exists():
        current_mtime = os.path.getmtime(METADATA_PATH)
        
    if _model is not None and current_mtime == _last_loaded_mtime:
        return True

    if not MODEL_PATH.exists() or not ENCODER_PATH.exists():
        logger.warning(
            "Model artifacts not found. Run: python -m app.model_trainer\n"
            f"  Expected: {MODEL_PATH}"
        )
        return False

    try:
        _model = joblib.load(MODEL_PATH)
        _encoder = joblib.load(ENCODER_PATH)
        if METADATA_PATH.exists():
            with open(METADATA_PATH) as f:
                _metadata = json.load(f)
        _last_loaded_mtime = current_mtime
        global _shap_explainer
        _shap_explainer = None  # Reset SHAP explainer so it rebuilds on newly loaded model
        
        logger.info(f"ML model loaded. Version: {(_metadata or {}).get('version', 'unknown')}")
        return True
    except Exception as e:
        logger.error(f"Failed to load ML model: {e}")
        return False


def _get_shap_explainer():
    global _shap_explainer
    if _shap_explainer is not None:
        return _shap_explainer

    if _model is None:
        return None

    try:
        import shap
        _shap_explainer = shap.TreeExplainer(_model)
        return _shap_explainer
    except Exception as e:
        logger.warning(f"SHAP explainer unavailable: {e}")
        return None


def is_model_available() -> bool:
    return MODEL_PATH.exists() and ENCODER_PATH.exists()


def predict_crop(
    N: float,
    P: float,
    K: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float,
    top_n: int = 3
) -> Dict:
    """
    Predict best crop(s) given soil and climate features.

    Returns:
        {
            "top_predictions": [{"crop": "rice", "confidence": 0.92}, ...],
            "recommended_crop": "rice",
            "shap_explanation": {"N": 0.12, "P": -0.05, ...} or None,
            "model_version": "1.0.0"
        }
    """
    if not _load_artifacts():
        return {
            "top_predictions": [],
            "recommended_crop": None,
            "shap_explanation": None,
            "model_version": None,
            "error": "Model not trained yet. Run: python -m app.model_trainer"
        }

    features = np.array([[N, P, K, temperature, humidity, ph, rainfall]])

    # Get class probabilities
    proba = _model.predict_proba(features)[0]
    top_indices = np.argsort(proba)[::-1][:top_n]

    top_predictions = [
        {
            "crop": _encoder.classes_[idx],
            "confidence": round(float(proba[idx]), 4)
        }
        for idx in top_indices
    ]

    recommended_crop = top_predictions[0]["crop"] if top_predictions else None

    # SHAP values
    shap_explanation = None
    explainer = _get_shap_explainer()
    if explainer is not None:
        try:
            shap_values = explainer.shap_values(features)
            best_class_idx = top_indices[0]
            # shap 0.4x: list of arrays [n_classes][n_samples, n_features]
            # shap 0.5x: ndarray (n_samples, n_features, n_classes)
            if isinstance(shap_values, list):
                sv = shap_values[best_class_idx][0]
            elif hasattr(shap_values, "ndim") and shap_values.ndim == 3:
                sv = shap_values[0, :, best_class_idx]
            else:
                sv = shap_values[0]

            shap_explanation = {
                feat: round(float(val), 4)
                for feat, val in zip(FEATURES, sv)
            }
        except Exception as e:
            logger.warning(f"SHAP computation failed: {e}")

    return {
        "top_predictions": top_predictions,
        "recommended_crop": recommended_crop,
        "shap_explanation": shap_explanation,
        "model_version": (_metadata or {}).get("version", "1.0.0")
    }


def get_model_metadata() -> Dict:
    _load_artifacts()
    return _metadata or {}
