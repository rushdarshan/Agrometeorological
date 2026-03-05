# Development Backlog: Smart Agriculture Advisory System MVP

**Target**: 90-day sprint to production-ready pilot in one district, one crop (e.g., rice).

---

## Sprint 0: Setup & Foundations (Days 1–7)

### Story 1: Project Infrastructure
- [ ] Initialize FastAPI backend project structure with Docker
- [ ] Set up GitHub Actions CI/CD pipeline
- [ ] Configure development environment (`.env`, secrets management)
- [ ] Document local setup steps in README
- **Acceptance**: `docker-compose up` runs full stack locally; tests pass; secrets not in repo

### Story 2: Database Schema & PostGIS
- [ ] Design and migrate Postgres + PostGIS schema (farms, advisories, messages, users)
- [ ] Create migration scripts (Alembic)
- [ ] Set up connection pooling (SQLAlchemy)
- [ ] Document schema design decisions
- **Acceptance**: Schema created locally; spatial queries (e.g., farms within 10 km) work; migration reversible

### Story 3: Farmer Registration API
- [ ] POST `/auth/register` — accept name, phone, village, GPS (lat/lng), crop, sowing date, area
- [ ] Validate phone format and location using PostGIS
- [ ] Send confirmation SMS (test gateway)
- [ ] Store consent flag for advisory + data use
- **Acceptance**: Registration creates farmer record; confirmation SMS sent; can retrieve farmer by ID

---

## Sprint 1: Core Pipeline (Days 8–30)

### Story 4: Weather Ingestion
- [ ] Implement fetcher for OpenWeatherMap / ECMWF test data (daily)
- [ ] Parse forecast grids and aggregate to farm polygon using PostGIS
- [ ] Store raw and processed forecasts in DB with timestamps
- [ ] Add basic quality checks (missing values, sensor outages)
- **Acceptance**: Fetcher runs daily without errors; historical 30-day data ingested; queries return forecast for test farm

### Story 5: Rule-Based Advisory Engine
- [ ] Define agronomic rules for rice (sowing, irrigation, pest risk) as decision trees / if-else logic
- [ ] Implement advisory mapper: `(weather_forecast, crop_stage) → advisory(type, severity, confidence)`
- [ ] Store advisories with reasoning (plain English explanation)
- [ ] Add caching to avoid recomputation
- **Acceptance**: Generate 10 test advisories; cover ≥3 advisory types (sow, irrigate, pest alert)

### Story 6: SMS Delivery Gateway
- [ ] Integrate Twilio / Karix SMS API
- [ ] Implement message queue (Redis/RabbitMQ) for async sending
- [ ] Add retry logic and delivery tracking
- [ ] Track delivery status (sent, delivered, failed) in DB
- **Acceptance**: Send 50 test SMS successfully; track delivery; <2% failure rate

### Story 7: Extension Officer Dashboard (MVP)
- [ ] Basic React / Next.js dashboard with login (JWT)
- [ ] Map view of registered farms (PostGIS + Mapbox)
- [ ] List of recent advisories per farm with timestamps
- [ ] Broadcast messaging form (send advisory template to region)
- [ ] Responsive design for tablet
- **Acceptance**: Load dashboard; view 10+ farms; send broadcast message via SMS

---

## Sprint 2: Intelligence & UX (Days 31–60)

### Story 8: Bias Correction / Local Calibration
- [ ] Fetch 5+ years of historical local weather (IMD / satellite)
- [ ] Implement quantile mapping or model-based bias correction for forecasts
- [ ] Compare corrected vs. raw forecasts on holdout period
- [ ] Document calibration process
- **Acceptance**: Corrected forecasts show ≥10% improvement in RMSE on test data; reproducible script

### Story 9: ML Advisory Model (XGBoost)
- [ ] Feature engineering: weather features (rolling means, derivatives, indices), crop stage, soil properties
- [ ] Train XGBoost classifier on historical labeled events (sowing windows, pest outbreaks)
- [ ] Evaluate with space-time cross-validation; target F1 > 0.65 for event detection
- [ ] Implement model serving (FastAPI endpoint)
- **Acceptance**: Model notebook reproducible; inference latency <500ms; feature importance logged

### Story 10: Android App / PWA Registration
- [ ] Build PWA with React Native / React (offline-first registration)
- [ ] Implement local caching (IndexedDB) and sync
- [ ] QR code or village-based registration flow
- [ ] Display incoming advisories with push notifications
- **Acceptance**: Register 5 test users; receive advisory notification; app works offline

### Story 11: Farmer Feedback Collection
- [ ] SMS reply parsing: "Did this advisory help? 1=Yes, 2=No"
- [ ] Store feedback linked to advisory in DB
- [ ] Aggregate feedback metrics (% helpful) on dashboard
- **Acceptance**: Collect 20+ feedback responses; display on dashboard

### Story 12: Pilot Launch (100–500 farmers)
- [ ] Recruit farmers in one village / district with extension officer
- [ ] Hold onboarding session + collect baseline knowledge
- [ ] Send daily advisories for 2–4 weeks
- [ ] Conduct weekly check-in calls / SMS surveys
- **Acceptance**: ≥60% activation; ≥25% engagement; ≥70% SUS score from focus group

---

## Sprint 3: Scale & Evaluation (Days 61–90)

### Story 13: Explainability & Confidence Scoring
- [ ] Integrate SHAP for advisory model explanation
- [ ] Convert SHAP outputs to human-readable rules (e.g., "High rain forecast (+40%) → delay irrigation")
- [ ] Add confidence bands (high/medium/low) to all advisories
- [ ] Display explanation on dashboard for extension officer
- **Acceptance**: Every advisory has 1–2 line explanation + confidence; can explain any prediction

### Story 14: Monitoring & Analytics
- [ ] Set up Prometheus + Grafana for infra metrics (uptime, latency)
- [ ] Application metrics: advisory count per day, delivery success rate, farmer engagement
- [ ] Implement structured logging (JSON) with ELK or hosted logger
- [ ] Create ops runbook for common issues
- **Acceptance**: Uptime ≥99% (pilot window); dashboard shows live metrics

### Story 15: Data Export & Anonymisation
- [ ] Implement farmer data export API (JSON/CSV with PII redacted)
- [ ] Create anonymisation script for analytics (coarsen location, remove names)
- [ ] Document data retention policy and deletion flows
- **Acceptance**: Export advisories for 10 farmers; contains no PII; reversible anonymisation

### Story 16: Evaluation & SIH Submission Pack
- [ ] Compile pilot results: farmer feedback, behavior change evidence, advisory accuracy metrics
- [ ] Write evaluation report (5–10 pages) with findings and recommendations
- [ ] Record demo video (5–10 min): registration → advisory → feedback loop
- [ ] Prepare reproducible setup guide (GitHub README + docker-compose)
- [ ] Create sample cleaned dataset and data dictionary
- [ ] Write final masterplan update with lessons learned
- **Acceptance**: All submission artifacts on GitHub; demo runs in <10 min; README clear enough for external replication

---

## Post-MVP Backlog (Future phases)

- [ ] IoT sensor integration (soil moisture, canopy temperature)
- [ ] Computer vision pest detection (mobile image upload)
- [ ] Voice messages and IVR (Asterisk / Plivo)
- [ ] Multilingual RAG chatbot (Weaviate + LLM)
- [ ] TimescaleDB for heavy telemetry
- [ ] Expand to 5+ districts and crops
- [ ] Premium advisory tiers / marketplace
- [ ] Offline on-device inference (TFLite)

---

## Definition of Done (per story)

✅ Code committed to `main`  
✅ Tests pass (unit + integration)  
✅ Documentation updated (API docs, schema, design decisions)  
✅ Acceptance criteria met  
✅ Code review approved  
✅ No regressions (manual smoke test on staging)  

---

## Key Metrics (MVP Pilot)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Farmer activation (week 1) | 60% | % registered farmers receiving ≥1 advisory |
| Advisory engagement | 25% | % advisories with SMS click/reply |
| Model F1 (event detection) | >0.65 | Precision/recall for alerts (held-out data) |
| Usability (SUS) | >70 | Average from focus group (10–20 farmers) |
| SMS delivery success | >98% | % delivered / sent |
| System uptime | >99% | Measured over 30-day pilot |
| Forecast improvement | ≥10% | RMSE reduction vs. raw forecast |

---

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| Forecast skill poor at local scale | Ensemble + ensemble bias correction + confidence bands |
| Low digital literacy | SMS-first, voice fallback, extension officer mediation |
| Regulatory SMS hurdles | Partner with local agri-department or government SMS aggregator |
| IoT hardware cost | Satellite-first strategy for MVP; sensors optional |
| Model drift over time | Monthly retraining, farmer feedback loop, continuous monitoring |

---

## Team & Roles (4-person MVP team)

- **Backend/ML Lead**: FastAPI, models, weather ingestion, orchestration
- **Frontend Lead**: React/Next.js dashboard, PWA, UX/accessibility
- **Mobile/DevOps**: Android/PWA testing, Docker, CI/CD, SMS gateway ops
- **Agronomist/PM**: Requirements, domain knowledge, pilot coordination, evaluation

---

## Timeline Summary

| Phase | Days | Key Deliverable |
|-------|------|-----------------|
| Foundations | 1–7 | Infra + schema + registration API working |
| Core Pipeline | 8–30 | End-to-end forecast → SMS working for test farm |
| Intelligence & UX | 31–60 | Pilot launched with 100–500 farmers; feedback collection active |
| Scale & Evaluation | 61–90 | Evaluation report + SIH submission ready |

