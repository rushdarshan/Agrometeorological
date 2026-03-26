# Agro Demo Flow Skill

## Purpose
Guide Copilot to execute a complete, demo-ready workflow for the Smart Agriculture Advisory System. Provides exact commands and troubleshooting steps for running the full stack locally or via Docker.

## Scope
This skill is designed for:
- **Local development demo**: Running backend (Python FastAPI) + frontend (React) natively
- **Docker demo**: Running full stack (FastAPI, PostgreSQL, Redis, Celery, React, Nginx)
- **Health verification**: Testing `/health` endpoint and core API routes
- **Failure diagnosis**: Identifying root causes (missing .env, missing ML models, database issues)

## Key Commands

### Prerequisites
- Python 3.10+
- Node.js 16+
- Docker & Docker Compose (for containerized setup)
- ML model artifacts: `knn_model.joblib`, `smart-agriculture.joblib`, `smart-agripkl.pkl` (should exist in repo root)

### Local Development Stack

#### Backend Setup
```powershell
# Windows PowerShell
cd Smart-Agriculture-Advisory-System
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env  # Configure with local settings
python main.py  # Runs on http://localhost:8000
```

#### Frontend Setup (separate terminal)
```powershell
cd Smart-Agriculture-Advisory-System/frontend
npm install
npm start  # Runs on http://localhost:3000
```

#### Verify Health Endpoints
```powershell
# Backend health
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-03-26T14:45:00.000Z",
#   "ml_model_ready": true|false,
#   "database_ready": true|false,
#   "redis_ready": true|false
# }

# Core API endpoints
curl http://localhost:8000/api/predict -X POST -H "Content-Type: application/json" -d '{"feature1": 0.5, "feature2": 0.8}'
curl http://localhost:8000/api/advisories
curl http://localhost:8000/api/dashboard
```

### Docker Compose Stack (Full Stack)

#### Development Stack
```powershell
# Start all services (PostgreSQL, Redis, FastAPI, Celery, React, Nginx)
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery_worker

# Health check
curl http://localhost:8000/health
curl http://localhost:3000  # React frontend

# Shutdown
docker-compose down
```

#### Production-like Stack (with Nginx)
```powershell
# Start with prod profile (includes Nginx reverse proxy on port 80)
docker-compose --profile prod up -d

# Access via Nginx
curl http://localhost/api/health
curl http://localhost  # Frontend through Nginx
```

## Failure Diagnosis Guide

### Failure: ML Model Not Ready (`ml_model_ready: false`)
**Cause**: ML model files missing or path not configured
**Solution**:
```powershell
# Check if model files exist in repo root
ls knn_model.joblib, smart-agriculture.joblib, smart-agripkl.pkl

# If missing, models will be created on first prediction
# Or download from training pipeline

# Check app/ml_model.py for path configuration
cat app/ml_model.py | grep -A 5 "MODEL_PATH"
```

### Failure: Database Connection Failed
**Cause**: PostgreSQL not running, credentials wrong, or DATABASE_URL env var not set
**Solution**:
```powershell
# Local development (SQLite fallback or fix .env)
cat .env  # Check DATABASE_URL
# For local: DATABASE_URL=sqlite:///agriculture_dev.db or use PostgreSQL

# Docker stack
docker-compose logs postgres  # Check database startup
docker-compose ps postgres    # Verify container is running

# Restart database
docker-compose restart postgres
```

### Failure: Redis Connection Failed
**Cause**: Redis not running (needed for Celery task queue)
**Solution**:
```powershell
# Local development: Install Redis locally or skip Celery
# https://github.com/microsoftarchive/redis/releases (Windows) or WSL

# Docker stack
docker-compose logs redis
docker-compose ps redis
docker-compose restart redis

# Test Redis connection
docker-compose exec redis redis-cli ping  # Should return PONG
```

### Failure: Frontend Build Error
**Cause**: Missing dependencies, Node version mismatch, or environment variables
**Solution**:
```powershell
cd frontend
rm -r node_modules package-lock.json
npm install
npm run build  # Test build
npm start      # Run dev server

# Check Node version requirement
cat package.json | grep "node"
node --version  # Should be 16+
```

### Failure: Celery Worker Not Processing Tasks
**Cause**: Redis not connected or broker URL misconfigured
**Solution**:
```powershell
# Check celery_worker.py configuration
cat celery_worker.py | grep -A 3 "broker="

# Local development: Start manually
python -m celery -A celery_worker worker --loglevel=info

# Docker stack
docker-compose logs celery_worker
docker-compose restart celery_worker

# Monitor tasks
docker-compose exec backend celery -A celery_worker inspect active
```

## Demo Workflow

### Complete Demo Run (Docker - Recommended)
```powershell
# Step 1: Start full stack
cd Smart-Agriculture-Advisory-System
docker-compose up -d

# Step 2: Wait for services to be healthy (30-60 seconds)
Start-Sleep -Seconds 30

# Step 3: Verify health
$health = curl http://localhost:8000/health | ConvertFrom-Json
Write-Host "Backend Status: $($health.status)"
Write-Host "ML Model Ready: $($health.ml_model_ready)"
Write-Host "Database Ready: $($health.database_ready)"
Write-Host "Redis Ready: $($health.redis_ready)"

# Step 4: Test core endpoints
Write-Host "`nTesting Advisories Endpoint..."
curl http://localhost:8000/api/advisories

Write-Host "`nTesting Prediction Endpoint..."
curl -X POST http://localhost:8000/api/predict `
  -H "Content-Type: application/json" `
  -d @"
{
  "soil_moisture": 45,
  "temperature": 28,
  "humidity": 65,
  "wind_speed": 12,
  "crop_type": "wheat",
  "soil_type": "loamy"
}
"@

# Step 5: Open frontend
Start-Process http://localhost:3000

# Step 6: Cleanup (when done)
docker-compose down
```

### Complete Demo Run (Local Development)
```powershell
# Terminal 1: Backend
cd Smart-Agriculture-Advisory-System
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python main.py

# Terminal 2: Frontend
cd Smart-Agriculture-Advisory-System\frontend
npm install
npm start

# Terminal 3: Test
Start-Sleep -Seconds 5
curl http://localhost:8000/health
curl http://localhost:3000

# Test prediction
curl -X POST http://localhost:8000/api/predict `
  -H "Content-Type: application/json" `
  -d '{"soil_moisture": 45, "temperature": 28}'
```

## Project Structure
```
Smart-Agriculture-Advisory-System/
├── main.py                      # FastAPI app entry point
├── app.py                       # Alternative entry point
├── celery_worker.py            # Async task worker
├── requirements.txt            # Python dependencies
├── .env.example               # Environment template
├── app/
│   ├── routers/              # API routes (auth, weather, advisories, etc.)
│   ├── ml_model.py          # ML model loading & prediction
│   ├── models.py            # Database models
│   └── schemas.py           # Pydantic validation
├── frontend/                 # React dashboard
│   ├── package.json
│   ├── src/
│   └── Dockerfile
├── models/                   # ML model artifacts
│   └── *.joblib, *.pkl
├── static/                   # Static assets
├── templates/               # HTML templates
└── docker-compose.yml       # Full stack orchestration
```

## Health Check Response Format
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "ISO 8601 datetime",
  "ml_model_ready": true | false,
  "database_ready": true | false,
  "redis_ready": true | false,
  "services": {
    "backend": "running",
    "frontend": "running",
    "database": "running",
    "redis": "running",
    "celery": "running"
  }
}
```

## When to Use This Skill

**Invoke this skill when**:
- Running a fresh demo for stakeholders
- Setting up local development environment
- Troubleshooting service startup issues
- Verifying all API endpoints before deployment
- Testing ML model availability and prediction accuracy
- Checking Celery task queue processing
- Validating full-stack integration (DB + cache + workers + APIs + UI)

**Use commands from this skill for**:
- Docker Compose orchestration
- Health endpoint testing
- API endpoint verification
- Service troubleshooting and debugging
- Exact PowerShell command syntax (Windows-native)

## Notes
- ML models must exist in repo root or be generated via training pipeline
- `.env` file required for backend — copy from `.env.example` and configure
- React frontend requires Node 16+ and `npm install` before `npm start`
- Full Docker stack takes 30-60 seconds to become healthy
- Health endpoint auto-detects service status — use it as smoke test
- Celery requires Redis; local development can work with background tasks disabled
