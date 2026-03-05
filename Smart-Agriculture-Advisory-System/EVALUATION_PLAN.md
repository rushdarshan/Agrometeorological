# Pilot Evaluation Plan — Smart Agriculture Advisory System

**Version**: 1.0  
**Pilot Period**: 30–90 days  
**Pilot Location**: One district (e.g., Kaira, Gujarat)  
**Pilot Crop**: Rice (primary focus)  
**Pilot Farmers**: 100–500 registered users  

---

## Evaluation Objectives

1. **Functional Validation**: Verify end-to-end pipeline (registration → advisory → delivery → feedback)
2. **Impact Assessment**: Measure farmer behavior change and decision improvements
3. **System Reliability**: Confirm uptime, delivery success, and response times
4. **User Satisfaction**: Validate UX, language clarity, and trust
5. **Model Performance**: Assess advisory accuracy and farmer engagement

---

## Success Metrics

### Primary Metrics (MVP-Critical)

| Metric | Target | Measurement | Acceptance |
|--------|--------|-------------|-----------|
| **Activation Rate** | 60% | % farmers receiving ≥1 advisory in week 1 | Pass if ≥60% activaion in first cohort |
| **SMS Delivery Success** | >98% | % delivered/sent messages | Twilio webhooks + manual audit of 50 messages |
| **Advisory Engagement** | 25% | % advisories opened or replied to | SMS click-through + "helpful?" feedback count |
| **System Uptime** | ≥99% | Pilot window downtime | Prometheus + manual checks (5 min interval) |
| **Forecast Improvement** | ≥10% | RMSE reduction vs. raw forecast | Holdout test data comparison |
| **Farmer SUS Score** | >70 | Average System Usability Score from focus group | Standardized 10-question survey (10–20 farmers) |

### Secondary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Advisory Accuracy (F1)** | >0.65 | Event detection (e.g., "irrigation needed") vs. labeled ground truth |
| **Confidence Calibration** | <0.1 difference | Predicted confidence vs. actual accuracy |
| **Model Latency** | <500ms | End-to-end advisory generation time |
| **Farmer Retention** | >70% | % farmers active in week 4 (didn't opt-out) |
| **Language Clarity** | >80% comprehension | % farmers who understood advisory message in focus groups |
| **Extension Officer Usability** | >7/10 | Task completion rate on dashboard (e.g., send broadcast) |

---

## Evaluation Timeline

### Week 1–2: Setup & Baseline

**Activities**:
- Deploy to staging environment
- Recruit 50–100 farmers with extension officer help
- Conduct baseline survey (farmer knowledge, tech comfort, past decisions)
- Ingest 30 days of historical weather for bias correction training

**Data Collected**:
- Baseline surveys (paper or SMS)
- Historical farm data (crop stage, soil, yields from prior seasons)

**Outputs**:
- Farmer cohort roster with phone numbers, farm details
- Baseline knowledge survey results
- Historical calibration dataset

---

### Week 3–6: Active Pilot

**Activities**:
- Send daily advisories via SMS based on rule engine
- Collect feedback via SMS replies ("1=Helpful, 2=Not helpful")
- Weekly check-in calls with 10–20 farmers for open-ended feedback
- Monitor dashboard metrics in real-time

**Data Collected**:
- Advisory count & types per day
- SMS delivery logs (timestamps, status)
- Farmer feedback (quantitative + qualitative)
- Farmer actions (sowing dates, irrigation timing reported via call-in)
- Weather forecast accuracy (actual vs. forecast)

**Early Insights to Look For**:
- Are advisories too late (farmers already decided)?
- Language too technical? Farmers asking clarifications?
- SMS delivery issues in certain areas (network gaps)?
- High engagement on sowing alerts vs. low on irrigation?

---

### Week 7–8: Mid-Pilot Review & Iteration

**Activities**:
- Analyze engagement patterns and refine rule-based advisories
- Conduct 2–3 focus groups (15–20 farmers each) for UX testing
- Identify and fix high-failure SMS delivery routes
- Start training ML model on collected feedback labels

**Data Collected**:
- Focus group recordings & transcripts (with consent)
- Refined mapping of farmer language preferences
- Model training data (weather + farm stage + farmer feedback)

**Outputs**:
- Updated advisory rules (e.g., simplified language, earlier alerts)
- Preliminary ML model checkpoint
- Focus group summary report

---

### Week 9–12: Final Pilot & Evaluation

**Activities**:
- Scale to 300–500 farmers if first cohort successful
- Deploy initial ML model (XGBoost) for irrigation & pest alerts
- Conduct final farmer surveys (post-pilot decision quality)
- Measure any observable behavior changes (reported sowing delays, irrigation timing)
- Prepare SIH submission artifacts

**Data Collected**:
- Post-pilot surveys (farmer satisfaction, intent to continue)
- Video testimony from 5–10 farmers (with consent)
- Final delivery & engagement metrics
- Advisory accuracy labels (extension officer validation of alerts)

**Outputs**:
- Pilot evaluation report (5–10 pages)
- Dataset: 1,000+ labeled advisory + feedback pairs
- Video demo (3–5 min walkthrough)
- Reproducible model training notebook

---

## Data Collection Methods

### 1. SMS-Based Feedback

**Question**: "Did this advisory help your decision? Reply 1=Yes 2=No"

```python
# Parse SMS reply in backend
def parse_sms_feedback(message_text, advisory_id):
    if "1" in message_text:
        feedback_type = "helpful"
    elif "2" in message_text:
        feedback_type = "not_helpful"
    else:
        feedback_type = "neutral"
    
    # Store in DB
    store_feedback(advisory_id, feedback_type)
```

### 2. Weekly Call-In Survey

**Sample of 20 farmers per week**, 5-minute call asking:
1. "Did you receive the advisory this week?"
2. "Did you change sowing/irrigation/fertilizer plans based on it?"
3. "What was most helpful? What wasn't clear?"
4. "Would you recommend to a friend?"

**Log in spreadsheet / database**:
| Farmer | Week | Received | Acted | Feedback | NPS |
|--------|------|----------|-------|----------|-----|

### 3. Focus Groups

**2–3 sessions, 15–20 farmers each, 60–90 minutes**:
- Prepare 3 sample advisories (current format)
- Ask to explain in own words → measure comprehension
- Redesign language live → test new phrasing
- Ask about preferred channels (SMS, voice, app push?)
- Record with consent for video clips

**Output**: Revised message templates, language guidelines

### 4. Extension Officer Validation

**Monthly verification by agronomist/extension officer**:
- Review ≥10 high-confidence alerts
- Validate against on-ground conditions ("Was BPH risk actually high?")
- Rate accuracy (incorrect / partially correct / correct)

**Goal**: Estimate F1 score for event alerts

### 5. System Monitoring

**Automated collection (backend logs)**:

```python
# Log every advisory + delivery
{
  "advisory_id": 123,
  "farm_id": 45,
  "type": "irrigation",
  "confidence": 0.75,
  "message_sent_at": "2024-02-15T06:30:00Z",
  "sms_delivered_at": "2024-02-15T06:31:12Z",
  "farmer_feedback_at": "2024-02-15T07:15:00Z",
  "feedback_type": "helpful",
  "latency_ms": 72
}

# Aggregate daily
delivery_rate = (delivered_count / sent_count) * 100
engagement_rate = (feedback_count / sent_count) * 100
avg_latency = mean(latencies)
```

---

## Analysis & Reporting

### Quantitative Analysis

```python
import pandas as pd
import numpy as np
from sklearn.metrics import precision_recall_fscore_support, confusion_matrix

# Load advisory + feedback data
df = pd.read_csv("advisories_with_feedback.csv")

# Delivery metrics
print(f"SMS Success Rate: {df['sms_delivered'].mean() * 100:.1f}%")

# Engagement
print(f"Reply Rate: {df['farmer_replied'].mean() * 100:.1f}%")
print(f"Helpful %: {(df['feedback_type'] == 'helpful').mean() * 100:.1f}%")

# Advisory accuracy (vs. extension officer validation)
y_true = df['extension_officer_validation']
y_pred = df['advisory_triggered']
precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred)
print(f"Advisory F1: {f1:.2f}")

# Forecast improvement (RMSE reduction)
from sklearn.metrics import mean_squared_error
raw_rmse = mean_squared_error(df['actual_rainfall'], df['forecast_raw']) ** 0.5
corrected_rmse = mean_squared_error(df['actual_rainfall'], df['forecast_corrected']) ** 0.5
improvement = (raw_rmse - corrected_rmse) / raw_rmse * 100
print(f"Forecast Improvement: {improvement:.1f}%")
```

### Qualitative Analysis

**Focus group & survey transcripts**:
1. Code responses into themes (e.g., "language clarity", "timeliness", "trust")
2. Count frequency of themes
3. Extract representative quotes for report

**Example summary**:
> "Clarity (12 mentions): Farmers found 'irrigation' clear but 'pest pressure index' confusing. Recommendation: use simpler terms like 'Watch for insects'."

---

## SIH Submission Deliverables

### 1. Live Demo (Video, 5–10 min)

**Shot list**:
- Farmer SMS registration (show phone receiving advisory)
- Dashboard: extension officer viewing farms and sending broadcast
- Feedback loop: farmer replying, visible on dashboard
- Model explainability: SHAP visualization of an advisory

**Format**: Recorded & uploaded; include subtitles/narration

### 2. GitHub Repository

**Contents** ✅ (already prepared above):
- Well-organized code with README
- `SETUP_GUIDE.md` — reproducible local setup (<10 min)
- `DEVELOPMENT_BACKLOG.md` — sprint plan and acceptance criteria
- `MASTERPLAN.md` — strategic overview
- `.env.example` — all configuration documented
- `docker-compose.yml` — one-command deployment
- Sample cleaned dataset (1,000+ records)

**Quality checks**:
- [ ] No hardcoded secrets in repo
- [ ] All dependencies in requirements.txt
- [ ] Code follows style guide (black, flake8)
- [ ] README is clear for someone unfamiliar

### 3. Evaluation Report (5–10 pages)

**Sections**:
1. **Pilot Overview**: Region, crop, farmers, timeline
2. **Functional Results**: Activation, delivery success, engagement rates
3. **Impact Assessment**: Farmer behavior changes, decision improvements
4. **Technical Performance**: System uptime, latency, accuracy
5. **User Feedback**: SUS scores, key themes from focus groups
6. **Lessons Learned**: What worked, what didn't, why
7. **Recommendations**: Next steps (expand to more crops/regions, ML improvements, etc.)

**Sample structure** (outline):

```markdown
# Pilot Evaluation Report: Rice Advisory System
## Kaira District, Gujarat — Feb–Mar 2024

### Executive Summary
- 350 farmers participated
- 98.2% SMS delivery success
- 28% advisory engagement rate
- 72/100 average SUS score
- 3 farmers reported delayed sowing by 5 days, attributing to advisory

### Detailed Findings
...
```

### 4. Dataset Summary

**Upload to GitHub as CSV**:
- Sample of 100 advisories with farmer feedback
- Column dictionary (data types, units, example values)
- De-identified (farmer IDs only, no names)

**Example structure**:

| advisory_id | farm_id | crop | type | received | feedback | helpful | timestamp |
|-------------|---------|------|------|----------|----------|---------|-----------|
| 1001 | 45 | Rice | irrigation | Yes | "Good timing" | Yes | 2024-02-15 |
| ... | ... | ... | ... | ... | ... | ... | ... |

### 5. Model Training Notebook

**Jupyter Notebook** (reproducible):
1. Data loading & exploration
2. Feature engineering
3. Train-test split (spatial-temporal)
4. Model training (XGBoost)
5. Evaluation & SHAP explanations
6. Instructions to re-train on new feedback

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Low engagement if advisories felt late | Medium | High | Test lag times early; adjust alert leads |
| Language comprehension issues | Medium | Medium | Conduct focus groups early; refine wording |
| SMS delivery gaps in some areas | Low | Medium | Test outreach with test SMSes week 1; switch provider if needed |
| Farmer phone number churn | Medium | Low | Maintain backup contacts; ask for alternative numbers at registration |
| Model overfitting to 1 season | High | Medium | Use cross-validation; keep models simple (interpretable) for MVP |
| Regulatory obstacles (bulk SMS) | Low | Medium | Partner with government agriculture dept early; get approvals by week 1 |

---

## Sustainability Plan (Post-MVP)

**To keep pilot running beyond 90 days**:
1. **Funding**: Secure grant or government subsidy for SMS costs (~$0.01/message)
2. **Extension Officer Adoption**: Train local officers to manage advisories
3. **Feedback Loop**: Automate monthly retraining using farmer labels
4. **Expansion**: Gradually add 2–3 more crops (wheat, cotton) based on demand
5. **Partnerships**: Integrate with existing government programs (m-Kisan, etc.)

---

## Glossary

- **SUS (System Usability Scale)**: 10-question standardized survey (0–100 score)
- **F1 Score**: Harmonic mean of precision & recall; 0–1 scale (1 = perfect)
- **RMSE**: Root Mean Squared Error; how far forecast is from actual values
- **Bias Correction**: Adjusting raw forecast using local historical patterns
- **Engagement Rate**: % of sent advisories that received farmer interaction (SMS reply, click)

---

## Contacts & Escalation

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Pilot Lead | [Project Manager] | pm@example.com | +91 98765 43210 |
| Agronomist | [Domain Expert] | agronomist@example.com | +91 98765 43211 |
| Tech Lead | [Backend/ML] | tech@example.com | +91 98765 43212 |
| Operations | [DevOps] | ops@example.com | +91 98765 43213 |

---

## Appendix: Feedback Form Template (SMS)

```
[WEEKLY SMS TO FARMERS]

"Hi [Name], did this week's farm advice help your decision?
1: Yes, very helpful
2: Somewhat helpful
3: Not helpful
4: Too late (already decided)"

[MONTHLY USABILITY SURVEY]

"Quick survey: Rate our app for ease of use (1=hard, 5=very easy): _"
"Would you recommend to another farmer? (1=No, 5=Definitely): _"
```

---

**End of Evaluation Plan**

All metrics should be tracked in real-time dashboard + exported for SIH submission.
