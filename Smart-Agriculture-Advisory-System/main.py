from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import datetime
import os
from dotenv import load_dotenv

from app.routers import auth, weather, advisories, dashboard, feedback
from app.routers import predict

load_dotenv()

app = FastAPI(
    title="Smart Agriculture Advisory System",
    description="AI-driven agrometeorological advisory for smallholder farmers. "
                "Combines rule-based engine, Random Forest ML model, SHAP explainability, "
                "and multilingual SMS delivery via Twilio.",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,       prefix="/api/auth",       tags=["Authentication"])
app.include_router(weather.router,    prefix="/api/weather",    tags=["Weather"])
app.include_router(advisories.router, prefix="/api/advisories", tags=["Advisories"])
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"])
app.include_router(feedback.router,   prefix="/api/feedback",   tags=["Feedback"])
app.include_router(predict.router,    prefix="/api/predict",    tags=["ML Prediction"])

# Serve static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    from app.ml_model import is_model_available
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "agriculture-advisory-api",
        "version": "2.0.0",
        "ml_model_ready": is_model_available(),
        "sms_enabled": os.getenv("SMS_ENABLED", "False").lower() == "true",
        "weather_api": bool(os.getenv("OPENWEATHERMAP_API_KEY", "")),
    }


@app.get("/", include_in_schema=False)
async def root():
    """Serve the dashboard HTML."""
    if os.path.exists("index.html"):
        return FileResponse("index.html")
    return {
        "name": "Smart Agriculture Advisory System",
        "version": "2.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV") == "development"
    )
