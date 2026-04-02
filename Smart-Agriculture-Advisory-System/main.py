from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from datetime import datetime
import os
from dotenv import load_dotenv
import uuid

from app.routers import auth, weather, advisories, dashboard, feedback
from app.routers import predict, ml
from app.logging_config import get_logger

load_dotenv()

logger = get_logger(__name__)

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


# Global error handling middleware
@app.middleware("http")
async def error_middleware(request: Request, call_next):
    """
    Global error handling middleware that catches unhandled exceptions.
    Logs errors with correlation IDs for debugging.
    """
    # Generate unique request ID for tracing
    request_id = str(uuid.uuid4())
    request.scope["request_id"] = request_id
    
    try:
        logger.debug(
            f"Incoming request: {request.method} {request.url.path} [request_id={request_id}]"
        )
        response = await call_next(request)
        
        # Log successful responses
        logger.debug(
            f"Response: {request.method} {request.url.path} - status={response.status_code} [request_id={request_id}]"
        )
        return response
    except Exception as e:
        logger.error(
            f"Unhandled error in request: {request.method} {request.url.path} - {str(e)} [request_id={request_id}]",
            exc_info=True
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "error_id": request_id,
                "path": request.url.path
            }
        )


# Request/Response logging middleware
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log request/response details including timing and body size."""
    import time
    
    request_id = request.scope.get("request_id", "unknown")
    
    # Measure request processing time
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Log response with timing
    logger.info(
        f"Request completed: {request.method} {request.url.path} "
        f"status={response.status_code} duration={process_time:.3f}s [request_id={request_id}]"
    )
    
    # Add response headers for tracing
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# Routers
app.include_router(auth.router,       prefix="/api/auth",       tags=["Authentication"])
app.include_router(weather.router,    prefix="/api/weather",    tags=["Weather"])
app.include_router(advisories.router, prefix="/api/advisories", tags=["Advisories"])
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"])
app.include_router(feedback.router,   prefix="/api/feedback",   tags=["Feedback"])
app.include_router(predict.router,    prefix="/api/predict",    tags=["ML Prediction"])
app.include_router(ml.router)

# Serve static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    from app.ml_model import is_model_available
    logger.debug("Health check requested")
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
    logger.info("Starting Smart Agriculture Advisory System API")
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV") == "development"
    )
