"""
Crop recommendation prediction endpoint.
POST /api/predict/crop — returns top-3 crop predictions + SHAP feature importance.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from app.ml_model import predict_crop, is_model_available, get_model_metadata

router = APIRouter()


class CropPredictRequest(BaseModel):
    N: float = Field(..., ge=0, le=200, description="Nitrogen content (kg/ha)")
    P: float = Field(..., ge=0, le=200, description="Phosphorus content (kg/ha)")
    K: float = Field(..., ge=0, le=250, description="Potassium content (kg/ha)")
    temperature: float = Field(..., ge=0, le=55, description="Temperature (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity (%)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH")
    rainfall: float = Field(..., ge=0, le=500, description="Annual rainfall (mm)")
    top_n: int = Field(3, ge=1, le=5, description="Number of top crops to return")


class CropPrediction(BaseModel):
    crop: str
    confidence: float


class CropPredictResponse(BaseModel):
    recommended_crop: Optional[str]
    top_predictions: List[CropPrediction]
    shap_explanation: Optional[dict]
    model_version: Optional[str]
    model_available: bool


@router.post("/crop", response_model=CropPredictResponse)
async def predict_crop_endpoint(data: CropPredictRequest):
    """
    Predict the best crop for given soil and climate conditions.

    Returns top-N crop recommendations with confidence scores and
    SHAP feature importance values explaining the prediction.
    """
    if not is_model_available():
        raise HTTPException(
            status_code=503,
            detail="ML model not trained yet. Run: python -m app.model_trainer to train the model."
        )

    result = predict_crop(
        N=data.N,
        P=data.P,
        K=data.K,
        temperature=data.temperature,
        humidity=data.humidity,
        ph=data.ph,
        rainfall=data.rainfall,
        top_n=data.top_n
    )

    if "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])

    return CropPredictResponse(
        recommended_crop=result["recommended_crop"],
        top_predictions=[CropPrediction(**p) for p in result["top_predictions"]],
        shap_explanation=result.get("shap_explanation"),
        model_version=result.get("model_version"),
        model_available=True
    )


@router.get("/model-status")
async def model_status():
    """Check if ML model is trained and available."""
    available = is_model_available()
    metadata = get_model_metadata() if available else {}
    return {
        "model_available": available,
        "model_type": metadata.get("model_type"),
        "accuracy": metadata.get("accuracy"),
        "n_classes": metadata.get("n_classes"),
        "version": metadata.get("version"),
        "features": metadata.get("features"),
        "classes": metadata.get("classes")
    }
