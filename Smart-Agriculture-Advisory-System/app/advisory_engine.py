"""Rule-based advisory engine for crop recommendations.
Covers Rice, Wheat, Cotton, Maize, Groundnut with per-crop rule sets.
Also integrates ML model when ENABLE_ML_ADVISORY=True.
"""

import os
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel


class AdvisoryRule(BaseModel):
    """Base rule structure."""
    rule_id: str
    crop: str
    condition_description: str
    advisory_type: str
    message: str
    reasoning: str
    severity: str  # low, medium, high
    confidence: float


# ---------------------------------------------------------------------------
# RICE RULES
# ---------------------------------------------------------------------------
RICE_RULES = [
    {
        "rule_id": "rice_sowing_window",
        "crop": "Rice",
        "condition": lambda w, s: (
            s == "pre_sowing" and w.get("rainfall_7d", 0) > 50 and w.get("temp_mean", 0) > 20
        ),
        "advisory_type": "sowing",
        "message": "Optimal sowing window: Heavy rain expected. Prepare seedbed and start transplanting.",
        "reasoning": "High precipitation (>50mm) and warm temp (>20°C) ideal for rice germination.",
        "severity": "high",
        "confidence": 0.80,
    },
    {
        "rule_id": "rice_irrigation_needed",
        "crop": "Rice",
        "condition": lambda w, s: (
            s == "vegetative" and w.get("rainfall_7d", 0) < 20 and w.get("humidity", 0) < 60
        ),
        "advisory_type": "irrigation",
        "message": "Schedule irrigation: Low rainfall and humidity detected. Maintain 3-5cm water level.",
        "reasoning": "Low rain forecast + dry conditions require supplemental irrigation for vegetative growth.",
        "severity": "medium",
        "confidence": 0.70,
    },
    {
        "rule_id": "rice_pest_bph",
        "crop": "Rice",
        "condition": lambda w, s: (
            s in ("vegetative", "flowering") and w.get("humidity", 0) > 80 and w.get("temp_mean", 0) > 25
        ),
        "advisory_type": "pest_alert",
        "message": "Brown Plant Hopper risk elevated. Monitor closely and apply neem-based pesticide if needed.",
        "reasoning": "Humidity >80% + temp >25°C creates ideal BPH breeding conditions.",
        "severity": "high",
        "confidence": 0.75,
    },
    {
        "rule_id": "rice_frost_warning",
        "crop": "Rice",
        "condition": lambda w, s: s == "vegetative" and w.get("temp_min", 30) < 10,
        "advisory_type": "frost_warning",
        "message": "Frost alert: Temperature dropping below 10°C. Protect seedlings with mulch or water.",
        "reasoning": "Rice seedlings are frost-sensitive; temp <10°C causes damage.",
        "severity": "high",
        "confidence": 0.90,
    },
    {
        "rule_id": "rice_delay_fertilizer",
        "crop": "Rice",
        "condition": lambda w, s: s == "vegetative" and w.get("rainfall_72h", 0) > 50,
        "advisory_type": "fertilization",
        "message": "Delay basal fertilizer: Heavy rain in next 72h will leach nitrogen. Apply after rainfall subsides.",
        "reasoning": "Heavy rain will leach nitrogen; wait for conditions to stabilize.",
        "severity": "medium",
        "confidence": 0.70,
    },
    {
        "rule_id": "rice_disease_blast",
        "crop": "Rice",
        "condition": lambda w, s: (
            s in ("vegetative", "flowering") and w.get("humidity", 0) > 85 and w.get("temp_mean", 0) < 26
        ),
        "advisory_type": "disease_alert",
        "message": "Rice blast disease risk high. Apply tricyclazole or propiconazole preventively.",
        "reasoning": "High humidity (>85%) with moderate temperatures favor Magnaporthe oryzae infection.",
        "severity": "high",
        "confidence": 0.72,
    },
    {
        "rule_id": "rice_heat_stress",
        "crop": "Rice",
        "condition": lambda w, s: s == "flowering" and w.get("temp_max", 0) > 38,
        "advisory_type": "heat_stress",
        "message": "Heat stress during flowering: Temperature >38°C causes spikelet sterility. Irrigate in afternoon.",
        "reasoning": "Temperatures >35°C during anthesis cause sterility and yield loss.",
        "severity": "high",
        "confidence": 0.80,
    },
]

# ---------------------------------------------------------------------------
# WHEAT RULES
# ---------------------------------------------------------------------------
WHEAT_RULES = [
    {
        "rule_id": "wheat_sowing_temp",
        "crop": "Wheat",
        "condition": lambda w, s: (
            s == "pre_sowing" and 10 <= w.get("temp_mean", 0) <= 22
        ),
        "advisory_type": "sowing",
        "message": "Optimal sowing conditions: Cool temperatures ideal for wheat germination. Sow at 4-5cm depth.",
        "reasoning": "Wheat germinates best between 10-22°C; avoid sowing in extreme heat.",
        "severity": "high",
        "confidence": 0.85,
    },
    {
        "rule_id": "wheat_irrigation_critical",
        "crop": "Wheat",
        "condition": lambda w, s: (
            s in ("vegetative", "flowering") and w.get("rainfall_7d", 0) < 10
        ),
        "advisory_type": "irrigation",
        "message": "Critical irrigation needed: Wheat requires consistent moisture. Apply 5-6cm flood irrigation.",
        "reasoning": "Wheat is sensitive to moisture stress at crown root initiation and grain fill stages.",
        "severity": "high",
        "confidence": 0.78,
    },
    {
        "rule_id": "wheat_rust_alert",
        "crop": "Wheat",
        "condition": lambda w, s: (
            s in ("vegetative", "flowering") and w.get("humidity", 0) > 75 and 15 <= w.get("temp_mean", 0) <= 25
        ),
        "advisory_type": "disease_alert",
        "message": "Wheat rust risk elevated. Inspect leaves for orange/yellow pustules. Apply propiconazole if detected.",
        "reasoning": "High humidity (>75%) with temperatures 15-25°C favor wheat rust development.",
        "severity": "high",
        "confidence": 0.76,
    },
    {
        "rule_id": "wheat_aphid_alert",
        "crop": "Wheat",
        "condition": lambda w, s: (
            s == "vegetative" and w.get("temp_mean", 0) > 20 and w.get("humidity", 0) < 60
        ),
        "advisory_type": "pest_alert",
        "message": "Aphid risk in dry warm conditions. Check flag leaves; spray imidacloprid if infestation found.",
        "reasoning": "Warm dry weather promotes aphid population build-up in wheat canopy.",
        "severity": "medium",
        "confidence": 0.65,
    },
    {
        "rule_id": "wheat_frost_heading",
        "crop": "Wheat",
        "condition": lambda w, s: s == "flowering" and w.get("temp_min", 30) < 2,
        "advisory_type": "frost_warning",
        "message": "Late frost during heading: Cover with straw mulch or smoke to prevent sterility.",
        "reasoning": "Sub-2°C during anthesis causes pollen damage and reduced grain set.",
        "severity": "high",
        "confidence": 0.88,
    },
    {
        "rule_id": "wheat_heat_grain_fill",
        "crop": "Wheat",
        "condition": lambda w, s: s == "maturation" and w.get("temp_max", 0) > 35,
        "advisory_type": "heat_stress",
        "message": "Terminal heat stress: Temperatures >35°C shorten grain fill. Harvest as soon as grain matures.",
        "reasoning": "High temperatures at grain fill accelerate ripening and reduce grain weight.",
        "severity": "high",
        "confidence": 0.82,
    },
]

# ---------------------------------------------------------------------------
# COTTON RULES
# ---------------------------------------------------------------------------
COTTON_RULES = [
    {
        "rule_id": "cotton_sowing_temp",
        "crop": "Cotton",
        "condition": lambda w, s: (
            s == "pre_sowing" and w.get("temp_mean", 0) > 20 and w.get("rainfall_7d", 0) < 30
        ),
        "advisory_type": "sowing",
        "message": "Good sowing conditions: Warm dry weather ideal for cotton planting. Ensure soil moisture.",
        "reasoning": "Cotton needs soil temp >20°C for good germination and initial dry conditions to prevent damping-off.",
        "severity": "medium",
        "confidence": 0.78,
    },
    {
        "rule_id": "cotton_bollworm_alert",
        "crop": "Cotton",
        "condition": lambda w, s: (
            s in ("vegetative", "flowering") and w.get("temp_mean", 0) > 27 and w.get("humidity", 0) > 70
        ),
        "advisory_type": "pest_alert",
        "message": "American/Pink bollworm risk high. Install pheromone traps and monitor squares and bolls.",
        "reasoning": "Warm humid conditions accelerate bollworm egg laying and larvae development.",
        "severity": "high",
        "confidence": 0.80,
    },
    {
        "rule_id": "cotton_whitefly_alert",
        "crop": "Cotton",
        "condition": lambda w, s: (
            s == "vegetative" and w.get("temp_mean", 0) > 28 and w.get("humidity", 0) < 55
        ),
        "advisory_type": "pest_alert",
        "message": "Whitefly risk elevated in hot dry weather. Apply spiromesifen or flonicamid. Avoid pyrethroids.",
        "reasoning": "Hot dry weather favors rapid whitefly multiplication; they vector CLCuD virus.",
        "severity": "high",
        "confidence": 0.75,
    },
    {
        "rule_id": "cotton_excess_rain",
        "crop": "Cotton",
        "condition": lambda w, s: (
            s in ("vegetative", "flowering") and w.get("rainfall_72h", 0) > 80
        ),
        "advisory_type": "irrigation",
        "message": "Waterlogging risk: Ensure drainage channels clear. Cotton roots sensitive to standing water.",
        "reasoning": "Heavy rains can waterlog cotton fields causing nutrient stress and root rot.",
        "severity": "medium",
        "confidence": 0.72,
    },
    {
        "rule_id": "cotton_nitrogen_vegetative",
        "crop": "Cotton",
        "condition": lambda w, s: (
            s == "vegetative" and w.get("rainfall_7d", 0) < 15 and w.get("humidity", 0) < 60
        ),
        "advisory_type": "fertilization",
        "message": "Apply top-dressing nitrogen: Dry conditions limit nutrient uptake. Use urea at 25kg/acre.",
        "reasoning": "Adequate N during square formation is critical for yield; dry conditions need band application.",
        "severity": "medium",
        "confidence": 0.68,
    },
]

# ---------------------------------------------------------------------------
# MAIZE RULES
# ---------------------------------------------------------------------------
MAIZE_RULES = [
    {
        "rule_id": "maize_sowing_rain",
        "crop": "Maize",
        "condition": lambda w, s: (
            s == "pre_sowing" and w.get("rainfall_7d", 0) > 30 and w.get("temp_mean", 0) > 18
        ),
        "advisory_type": "sowing",
        "message": "Ideal maize sowing time: Sufficient soil moisture and warm temperatures. Sow at 5cm depth.",
        "reasoning": "Maize needs soil temperature >18°C and adequate moisture for uniform germination.",
        "severity": "high",
        "confidence": 0.83,
    },
    {
        "rule_id": "maize_irrigation_tasseling",
        "crop": "Maize",
        "condition": lambda w, s: (
            s == "flowering" and w.get("rainfall_7d", 0) < 15
        ),
        "advisory_type": "irrigation",
        "message": "Critical irrigation at tasseling/silking: Water stress at this stage causes severe yield loss.",
        "reasoning": "The 10-day window around silking is the most water-critical period in maize.",
        "severity": "high",
        "confidence": 0.88,
    },
    {
        "rule_id": "maize_fall_armyworm",
        "crop": "Maize",
        "condition": lambda w, s: (
            s in ("vegetative", "flowering") and w.get("temp_mean", 0) > 25 and w.get("humidity", 0) > 60
        ),
        "advisory_type": "pest_alert",
        "message": "Fall Armyworm risk: Check whorls for frass and damage. Apply emamectin benzoate or spinetoram.",
        "reasoning": "FAW thrives in warm humid conditions; early detection critical to prevent complete crop loss.",
        "severity": "high",
        "confidence": 0.80,
    },
    {
        "rule_id": "maize_downy_mildew",
        "crop": "Maize",
        "condition": lambda w, s: (
            s == "vegetative" and w.get("humidity", 0) > 80 and w.get("temp_mean", 0) < 28
        ),
        "advisory_type": "disease_alert",
        "message": "Downy mildew risk: Spray metalaxyl + mancozeb on emerging plants. Remove infected seedlings.",
        "reasoning": "Peronosclerospora downy mildew spreads in high humidity with mild temperatures.",
        "severity": "high",
        "confidence": 0.73,
    },
    {
        "rule_id": "maize_heat_silking",
        "crop": "Maize",
        "condition": lambda w, s: s == "flowering" and w.get("temp_max", 0) > 36,
        "advisory_type": "heat_stress",
        "message": "High temperatures at silking: Irrigate early morning to cool field and aid pollination.",
        "reasoning": "Temperatures >35°C during pollination cause pollen sterility and silk desiccation.",
        "severity": "high",
        "confidence": 0.82,
    },
]

# ---------------------------------------------------------------------------
# GROUNDNUT RULES
# ---------------------------------------------------------------------------
GROUNDNUT_RULES = [
    {
        "rule_id": "groundnut_sowing",
        "crop": "Groundnut",
        "condition": lambda w, s: (
            s == "pre_sowing" and w.get("temp_mean", 0) > 22 and w.get("rainfall_7d", 0) > 20
        ),
        "advisory_type": "sowing",
        "message": "Good groundnut sowing conditions. Apply Rhizobium seed treatment before planting.",
        "reasoning": "Groundnut needs soil temp >22°C and 20mm+ rainfall for good emergence.",
        "severity": "medium",
        "confidence": 0.75,
    },
    {
        "rule_id": "groundnut_tikka_disease",
        "crop": "Groundnut",
        "condition": lambda w, s: (
            s in ("vegetative", "flowering") and w.get("humidity", 0) > 80
        ),
        "advisory_type": "disease_alert",
        "message": "Late leaf spot (tikka) risk: Spray chlorothalonil or mancozeb. Ensure good canopy air circulation.",
        "reasoning": "Cercospora leaf spots spread rapidly in high humidity; causes 50-70% yield loss if unchecked.",
        "severity": "high",
        "confidence": 0.77,
    },
    {
        "rule_id": "groundnut_irrigation_pegging",
        "crop": "Groundnut",
        "condition": lambda w, s: (
            s == "flowering" and w.get("rainfall_7d", 0) < 15
        ),
        "advisory_type": "irrigation",
        "message": "Irrigation critical at pegging stage: Dry soil prevents pod development. Apply 5cm irrigation.",
        "reasoning": "Moisture stress at pegging/pod filling reduces yield significantly.",
        "severity": "high",
        "confidence": 0.80,
    },
]

# ---------------------------------------------------------------------------
# CROP RULE REGISTRY
# ---------------------------------------------------------------------------
CROP_RULES = {
    "rice": RICE_RULES, "Rice": RICE_RULES,
    "wheat": WHEAT_RULES, "Wheat": WHEAT_RULES,
    "cotton": COTTON_RULES, "Cotton": COTTON_RULES,
    "maize": MAIZE_RULES, "Maize": MAIZE_RULES,
    "groundnut": GROUNDNUT_RULES, "Groundnut": GROUNDNUT_RULES,
}

# Crop stage timelines (days from sowing): pre_sowing, sowing, vegetative, flowering, maturation
CROP_STAGES = {
    "rice":      (0, 10, 60, 100, 130),
    "wheat":     (0, 10, 45,  90, 120),
    "cotton":    (0, 15, 60, 100, 150),
    "maize":     (0,  7, 35,  65,  95),
    "groundnut": (0, 10, 45,  80, 120),
}


def get_rules_for_crop(crop_name: str) -> list:
    """Return the rule set for a given crop name."""
    return CROP_RULES.get(crop_name, CROP_RULES.get(crop_name.lower(), []))


def evaluate_farm_conditions(
    farm_data: dict,
    weather: dict,
    crop_stage: str
) -> List[dict]:
    """
    Evaluate a farm against crop rule set and (optionally) ML model.
    Returns list of triggered advisory dicts.
    """
    advisories = []
    crop = farm_data.get("crop_name", "Rice")
    rules = get_rules_for_crop(crop)

    for rule in rules:
        try:
            if rule["condition"](weather, crop_stage):
                advisories.append({
                    "rule_id": rule["rule_id"],
                    "advisory_type": rule["advisory_type"],
                    "title": rule["message"][:80],
                    "message": rule["message"],
                    "reasoning": rule["reasoning"],
                    "severity": rule["severity"],
                    "confidence": rule["confidence"],
                    "generated_by": "rule_engine",
                    "model_version": None,
                    "shap_explanation": None,
                })
        except Exception as e:
            print(f"Rule eval error [{rule['rule_id']}]: {e}")

    # Integrate ML model if enabled
    ml_enabled = os.getenv("ENABLE_ML_ADVISORY", "False").lower() == "true"
    if ml_enabled:
        ml_advisory = _run_ml_advisory(farm_data, weather)
        if ml_advisory:
            advisories.append(ml_advisory)

    return advisories


def _run_ml_advisory(farm_data: dict, weather: dict) -> Optional[dict]:
    """Call ML model and return a crop recommendation advisory if soil data available."""
    try:
        from app.ml_model import predict_crop, is_model_available
        if not is_model_available():
            return None

        N = farm_data.get("soil_nitrogen") or 50
        P = farm_data.get("soil_phosphorus") or 40
        K = farm_data.get("soil_potassium") or 50
        ph = farm_data.get("soil_ph") or 6.5
        temperature = weather.get("temp_mean", 25)
        humidity = weather.get("humidity", 70)
        rainfall = weather.get("rainfall_7d", 100)

        result = predict_crop(N=N, P=P, K=K, temperature=temperature,
                              humidity=humidity, ph=ph, rainfall=rainfall)

        if not result.get("recommended_crop"):
            return None

        top_crop = result["top_predictions"][0]
        current_crop = (farm_data.get("crop_name") or "").lower()
        recommended = top_crop["crop"].lower()

        if recommended != current_crop and top_crop["confidence"] > 0.70:
            return {
                "rule_id": "ml_crop_recommendation",
                "advisory_type": "sowing",
                "title": f"ML Crop Recommendation: {top_crop['crop']} ({top_crop['confidence']*100:.0f}%)",
                "message": (
                    f"Based on your soil and local climate, {top_crop['crop']} is highly recommended "
                    f"(confidence: {top_crop['confidence']*100:.0f}%). "
                    f"Current crop: {farm_data.get('crop_name', 'unknown')}."
                ),
                "reasoning": f"Random Forest model trained on 2,200 samples recommends {top_crop['crop']}.",
                "severity": "medium",
                "confidence": top_crop["confidence"],
                "generated_by": "ml_model",
                "model_version": result.get("model_version"),
                "shap_explanation": result.get("shap_explanation"),
            }
    except Exception as e:
        print(f"ML advisory error: {e}")
    return None


def calculate_crop_stage(crop: str, sowing_date: datetime) -> str:
    """Estimate crop stage based on days since sowing."""
    days = (datetime.utcnow() - sowing_date).days
    crop_key = crop.lower()
    stages = CROP_STAGES.get(crop_key, CROP_STAGES["rice"])
    pre, sow, veg, flow, mat = stages

    if days < pre:
        return "pre_sowing"
    elif days < sow:
        return "sowing"
    elif days < veg:
        return "vegetative"
    elif days < flow:
        return "flowering"
    elif days < mat:
        return "maturation"
    else:
        return "harvested"


def prepare_advisories_for_delivery(
    advisories: List[dict],
    farmer_language: str = "en"
) -> List[dict]:
    """Format advisories for SMS/push delivery with language support."""
    try:
        from app.translations import format_sms
        formatted = []
        for adv in advisories:
            crop = adv.get("crop_name", "")
            sms_msg = format_sms(
                advisory_type=adv["advisory_type"],
                message=adv["message"],
                severity=adv["severity"],
                crop_name=crop,
                language=farmer_language
            )
            formatted.append({
                "advisory_id": None,
                "message_sms": sms_msg,
                "message_push": adv["message"],
                "reasoning": adv["reasoning"],
                "confidence": adv["confidence"],
                "severity": adv["severity"],
                "advisory_type": adv["advisory_type"]
            })
        return formatted
    except Exception:
        # fallback
        return [{"message_sms": a["message"][:160], **a} for a in advisories]


if __name__ == "__main__":
    sample_farm = {
        "farm_id": 1, "crop_name": "Wheat",
        "sowing_date": datetime.utcnow() - timedelta(days=25),
        "area_hectares": 2.0,
        "soil_nitrogen": 40, "soil_phosphorus": 35,
        "soil_potassium": 45, "soil_ph": 6.8,
    }
    sample_weather = {
        "rainfall_7d": 8, "rainfall_72h": 2,
        "temp_mean": 22, "temp_min": 12, "temp_max": 30,
        "humidity": 78, "wind_speed": 7,
    }
    stage = calculate_crop_stage(sample_farm["crop_name"], sample_farm["sowing_date"])
    print(f"Crop stage: {stage}\n")
    advisories = evaluate_farm_conditions(sample_farm, sample_weather, stage)
    print(f"Triggered {len(advisories)} advisories:")
    for adv in advisories:
        print(f"  [{adv['advisory_type']}] {adv['message'][:60]}...")
