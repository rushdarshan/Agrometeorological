# Smart Agriculture Advisory System — MVP Setup & Deployment

**Version**: 1.0  
**Last Updated**: February 2026  
**Target**: 90-day pilot deployment for rice advisories in Gujarat

---

## Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose (recommended)
- OR: Python 3.10+, PostgreSQL 15+, Node.js 18+, Redis 7+
- Git

### Option 1: Docker Compose (Recommended)

```bash
# Clone and enter repo
git clone <repo-url>
cd Smart-Agriculture-Advisory-System

# Copy environment template
cp .env.example .env

# Customize .env (database password, SMS keys, etc.)
nano .env

# Start full stack (PostgreSQL, Redis, FastAPI, React)
docker-compose up --build

# In another terminal, initialize database
docker-compose exec backend python app/init_db.py

# Access services
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend Dashboard: http://localhost:3000
- Database: postgresql://localhost:5432/agriculture_db
```

### Option 2: Local Setup

```bash
# Backend setup
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Initialize database
python app/init_db.py

# Start backend (from root directory)
uvicorn main:app --reload --port 8000

# Frontend setup (in new terminal)
cd frontend
npm install
npm start

# Redis (optional, for message queue; requires Redis installation)
redis-server
```

---

## Project Structure

```
Smart-Agriculture-Advisory-System/
├── main.py                          # FastAPI entry point
├── requirements.txt                 # Python dependencies
├── docker-compose.yml               # Full stack orchestration
├── Dockerfile.backend               # Backend container image
├── .env.example                     # Environment template

├── app/
│   ├── __init__.py
│   ├── database.py                  # SQLAlchemy setup + PostGIS
│   ├── models.py                    # ORM models (Farmer, Farm, Advisory, etc.)
│   ├── schemas.py                   # Pydantic request/response schemas
│   ├── init_db.py                   # Database initialization script
│   ├── advisory_engine.py           # Rule-based advisory generation
│   │
│   └── routers/
│       ├── auth.py                  # Farmer registration & auth
│       ├── weather.py               # Weather ingestion & forecasts
│       ├── advisories.py            # Advisory CRUD & retrieval
│       ├── feedback.py              # Farmer feedback collection
│       └── dashboard.py             # Extension officer dashboard

├── frontend/
│   ├── package.json
│   ├── Dockerfile
│   ├── public/
│   │   └── index.html               # Root HTML template
│   └── src/
│       ├── index.js                 # React entry
│       └── Dashboard.jsx            # Main dashboard component

├── README.md                        # This file
├── MASTERPLAN.md                    # Strategic overview
└── DEVELOPMENT_BACKLOG.md           # Sprint tickets & timeline
```

---

## API Endpoints Overview

### Authentication (Farmer Registration)
- **POST** `/api/auth/register` — Register new farmer with GPS and crop
- **GET** `/api/auth/farmer/{farmer_id}` — Retrieve farmer profile
- **PUT** `/api/auth/farmer/{farmer_id}` — Update preferences

### Advisories
- **POST** `/api/advisories/advisory` — Create advisory (rule engine output)
- **GET** `/api/advisories/farm/{farm_id}` — Get farm's recent advisories
- **GET** `/api/advisories/advisory/{advisory_id}` — Advisory with explanations

### Weather
- **POST** `/api/weather/forecast` — Ingest forecast data (internal)
- **GET** `/api/weather/farm/{farm_id}` — Latest forecast for farm

### Messaging & Feedback
- **POST** `/api/feedback/message` — Queue message (SMS/push)
- **PUT** `/api/feedback/message/{message_id}` — Update delivery status
- **POST** `/api/feedback/feedback` — Submit farmer feedback
- **GET** `/api/feedback/delivery-stats` — Delivery metrics

### Dashboard (Extension Officer)
- **GET** `/api/dashboard/farms` — List farms (with optional filters)
- **GET** `/api/dashboard/regional-stats` — Aggregated region stats
- **GET** `/api/dashboard/farm/{farm_id}/timeline` — 30-day advisory timeline
- **POST** `/api/dashboard/broadcast` — Send regional advisory broadcast

---

## Configuration & Environment

### Required Environment Variables

```bash
# Core
ENV=development              # or production
HOST=0.0.0.0
PORT=8000

# Database (PostgreSQL + PostGIS)
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/agriculture_db

# SMS Gateway (Twilio or Karix)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Weather APIs
OPENWEATHERMAP_API_KEY=your_key

# Redis (for message queue)
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
```

See `.env.example` for complete template.

---

## Database Schema

### Key Tables

1. **farmers** — Farmer profiles (phone, name, village, location, consent)
2. **farms** — Farm details linked to farmer (crop, area, sowing date)
3. **weather_forecasts** — Aggregated forecasts per farm (temp, humidity, rain)
4. **advisories** — Generated advisories with reasoning and confidence
5. **messages** — Sent SMS/push messages with delivery tracking
6. **advisory_feedbacks** — Farmer feedback on advisory helpfulness
7. **broadcast_messages** — Regional messages from extension officers

### Geospatial Queries

All farms and farmers have PostGIS POINT/POLYGON geometries, enabling:

```sql
-- Farms within 10km of a point
SELECT * FROM farms 
WHERE ST_DWithin(location, ST_Point(72.3694, 22.2707)::geography, 10000);

-- Farmers in a village polygon
SELECT * FROM farmers 
WHERE ST_Contains(village_polygon, location);
```

---

## Testing the System

### 1. Farmer Registration

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "name": "Parasnath Kumar",
    "village": "Kheda",
    "district": "Kaira",
    "state": "Gujarat",
    "latitude": 22.3707,
    "longitude": 72.3694,
    "crop_name": "Rice",
    "sowing_date": "2024-01-15T00:00:00",
    "area_hectares": 1.5,
    "consented_advisory": true,
    "consented_data_use": true
  }'
```

### 2. Generate Advisory (via Rule Engine)

```bash
# First, check available advisories for a farm
curl http://localhost:8000/api/advisories/farm/1

# Or test the rule engine locally
python -c "from app.advisory_engine import *; \
farm = {'crop_name': 'Rice', 'sowing_date': __import__('datetime').datetime.utcnow() - __import__('datetime').timedelta(days=25)}; \
weather = {'rainfall_7d': 65, 'temp_mean': 28, 'humidity': 82}; \
stage = calculate_crop_stage('Rice', farm['sowing_date']); \
advs = evaluate_farm_conditions(farm, weather, stage); \
print(advs)"
```

### 3. Dashboard Access

- **Extension Officer**: http://localhost:3000/ → view farms, send broadcasts
- **Metrics**: http://localhost:8000/api/dashboard/regional-stats?district=Kaira

---

## Deployment to Production

### GCP Cloud Run (Recommended for MVP)

```bash
# Build backend image
gcloud builds submit --config=cloudbuild.yaml

# Deploy
gcloud run deploy agriculture-api --image=gcr.io/YOUR_PROJECT/agriculture-api
gcloud run deploy agriculture-dashboard --image=gcr.io/YOUR_PROJECT/agriculture-dashboard
```

### AWS ECS

```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker build -t agriculture-api .
docker tag agriculture-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/agriculture-api:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/agriculture-api:latest

# Create ECS task & service (use AWS console or terraform)
```

### Self-Hosted (Ubuntu VPS)

```bash
# SSH into server
ssh user@your-server-ip

# Install Docker, Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repo and start
git clone <repo-url> && cd Smart-Agriculture-Advisory-System
cp .env.example .env && nano .env  # Configure
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Set up SSL with Let's Encrypt + Nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
# Configure nginx reverse proxy (see nginx.conf.prod)
```

---

## Monitoring & Operations

### Health Checks

```bash
# API health
curl http://localhost:8000/health

# Database connectivity
docker-compose exec backend python -c "from app.database import SessionLocal; SessionLocal()"

# Delivery stats
curl http://localhost:8000/api/feedback/delivery-stats
```

### Logging & Alerts

```bash
# View backend logs
docker-compose logs backend -f  # or `docker-compose logs -f` for all

# Set up monitoring (Prometheus + Grafana)
# See monitoring/prometheus.yml and monitoring/grafana.yml
```

### Backup & Recovery

```bash
# Backup Postgres database
docker-compose exec -T postgres pg_dump -U postgres agriculture_db > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres agriculture_db < backup_20240101.sql

# Auto-backup (add to crontab)
0 2 * * * cd /path/to/project && docker-compose exec -T postgres pg_dump -U postgres agriculture_db > backups/backup_$(date +\%Y\%m\%d).sql
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 5432 already in use | `lsof -i :5432` and kill process, or change PORT in .env |
| PostGIS not recognized | Ensure `postgres` service uses `postgis/postgis` image, run init_db.py |
| SMS not sending | Check TWILIO credentials, ensure SMS_ENABLED=True |
| Frontend can't reach API | Verify REACT_APP_API_URL and CORS_ORIGINS; check nginx config |
| High database latency | Add connection pooling, scale read replicas, optimize indexes |

### Debug Mode

```bash
ENV=development
SQL_ECHO=True       # Log all SQL queries
LOG_LEVEL=DEBUG     # Verbose logging
DEBUG=True          # Flask/Uvicorn debug mode
```

---

## Performance & Scalability

### Bottlenecks & Solutions

| Component | Bottleneck | Solution |
|-----------|-----------|----------|
| Weather ingestion | API rate limits | Batch requests, cache, schedule off-peak |
| Advisory generation | Sequential rule evaluation | Parallelize via Celery, cache stage calculations |
| SMS delivery | Gateway throughput | Use multiple providers, queue batching |
| Dashboard load | N+1 queries | Implement eager loading, aggregate views |
| Geospatial queries | Index on location | `CREATE INDEX ON farms USING GIST(location)` |

### Optimization Checklist

- [ ] Enable query caching (Redis)
- [ ] Add database indexes on frequently filtered columns (crop_name, district, etc.)
- [ ] Paginate large result sets
- [ ] Use read replicas for dashboard queries
- [ ] Monitor slow queries with `EXPLAIN ANALYZE`

---

## Next Steps

1. **Immediate (Day 1–7)**: Initialize database, test APIs, configure SMS gateway
2. **Short-term (Week 2–4)**: Pilot farmer recruitment, weather ingestion, batch advisory generation
3. **Medium-term (Month 2)**: Bias correction, ML model training, feedback collection
4. **Long-term (Month 3)**: Evaluation, SIH preparation, scaling to next region

---

## Support & Contributing

- **Issues**: Submit via GitHub issues with error logs
- **Discussions**: GitHub discussions for feature requests
- **Pull Requests**: Follow DEVELOPMENT_BACKLOG.md convention
- **Contact**: admin@agricultureadvisory.com

---

## License & Attribution

Project developed as part of [SIH 2026] / Smart India Hackathon.  
Built with: FastAPI, PostgreSQL, PostGIS, React, Docker.

**Acknowledgments**: 
- IMD (Indian Meteorological Department) for weather data
- ICAR for agronomic guidelines
- Extension officers for domain expertise and pilot coordination
