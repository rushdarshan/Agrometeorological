# GitHub Copilot Instructions for Agrometeorological

This file is the workspace bootstrap for AI coding agents working in this repository.

## Project Scope

- Primary app: `Smart-Agriculture-Advisory-System/`
- Stack: FastAPI + SQLAlchemy + Celery + Redis + PostgreSQL/PostGIS + Next.js (App Router) + TypeScript
- Domain: agrometeorological advisories, crop recommendation ML, multilingual farmer messaging

## Where to Start

- Read product and setup context first:
  - `Smart-Agriculture-Advisory-System/README.md`
  - `Smart-Agriculture-Advisory-System/SETUP_GUIDE.md`
- Read automation and instruction resources (if task-relevant):
  - `.github/README.md`
  - `.github/instructions/*.md`

## Canonical Development Commands

Run commands from `Smart-Agriculture-Advisory-System/` unless noted.

### Backend (local)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python app\init_db.py
uvicorn main:app --reload --port 8000
```

### Frontend (local)

```powershell
cd frontend
npm install
npm run dev
```

### Full stack (docker)

```powershell
docker-compose up --build
```

### Health and smoke checks

```powershell
curl http://localhost:8000/health
curl http://localhost:8000/docs
```

## Architecture Boundaries

### Backend API

- Entrypoint and router wiring: `Smart-Agriculture-Advisory-System/main.py`
- API routers: `Smart-Agriculture-Advisory-System/app/routers/`
- Data layer: `Smart-Agriculture-Advisory-System/app/database.py`, `Smart-Agriculture-Advisory-System/app/models.py`, `Smart-Agriculture-Advisory-System/app/schemas.py`

### Advisory + ML

- Rule-based engine: `Smart-Agriculture-Advisory-System/app/advisory_engine.py`
- Model loading/prediction and SHAP: `Smart-Agriculture-Advisory-System/app/ml_model.py`
- Training entrypoint: `Smart-Agriculture-Advisory-System/app/model_trainer.py`
- Model artifacts: `Smart-Agriculture-Advisory-System/models/`

### Async and messaging

- Celery tasks: `Smart-Agriculture-Advisory-System/app/tasks.py`
- Worker entrypoint: `Smart-Agriculture-Advisory-System/celery_worker.py`
- SMS integration: `Smart-Agriculture-Advisory-System/app/sms_gateway.py`

### Frontend

- Next.js app shell: `Smart-Agriculture-Advisory-System/frontend/app/`
- Feature components: `Smart-Agriculture-Advisory-System/frontend/components/`
- Shared API client/helpers: `Smart-Agriculture-Advisory-System/frontend/lib/`

## Conventions to Follow

- Keep backend routes thin; move business logic into service modules.
- Reuse existing schema patterns in `app/schemas.py` for request/response modeling.
- Keep feature toggles and secrets in `.env`; do not hardcode credentials.
- Preserve router prefixes and response contracts unless task explicitly requires API versioning changes.
- On frontend, follow existing TypeScript + component composition patterns in `frontend/components/`.

## Common Pitfalls

- `ENABLE_ML_ADVISORY` must stay `False` until model artifacts exist in `models/`.
- API health includes ML readiness; `ml_model_ready: false` usually means artifacts are missing.
- `docker-compose.yml` references `frontend/Dockerfile`; verify file presence before relying on full Docker frontend startup.
- Local dev and docs may differ on runtime details (Jupyter-first legacy docs vs FastAPI/Next.js app); prefer current source code behavior in `main.py` and `frontend/package.json`.

## Task Routing Guidance

- Use `@GitHub Actions Expert` for workflow hardening under `.github/workflows/`.
- Use `@Lingo.dev Localization (i18n) Agent` for translation/localization workflows.
- Use `@Context Architect` before large multi-file refactors.

## Validation Expectations

For backend changes:

```powershell
python -m compileall app
```

For frontend changes:

```powershell
cd frontend
npm run lint
npm run build
```

For API changes, verify:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`

## Link, Do Not Duplicate

- If deeper setup or deployment details are needed, link to:
  - `Smart-Agriculture-Advisory-System/SETUP_GUIDE.md`
  - `Smart-Agriculture-Advisory-System/README.md`
- Avoid copying long setup sections into new docs unless the user explicitly asks for standalone documentation.

## Suggested Next Customizations

- Create scoped instruction files with `applyTo` for:
  - Backend Python files (`Smart-Agriculture-Advisory-System/app/**/*.py`)
  - Frontend Next.js files (`Smart-Agriculture-Advisory-System/frontend/**/*.{ts,tsx}`)
  - CI workflows (`.github/workflows/*.{yml,yaml}`)

These should capture area-specific coding standards without overloading this top-level bootstrap file.