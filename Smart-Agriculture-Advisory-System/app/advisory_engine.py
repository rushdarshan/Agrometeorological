"""Rule-based advisory engine for crop recommendations."""

from datetime import datetime, timedelta
from enum import Enum
from typing import List, Optional, Tuple
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

# Rice (example crop) - Rule Set
RICE_RULES = [
    {
        "rule_id": "rice_sowing_window",
        "crop": "Rice",
        "condition": lambda weather, crop_stage: (
            crop_stage == "pre_sowing" and 
            weather.get("rainfall_7d", 0) > 50 and 
            weather.get("temp_mean", 0) > 20
        ),
        "advisory_type": "sowing",
        "message": "Optimal sowing window: Heavy rain expected in next 7 days. Prepare seedbed and transplanting.",
        "reasoning": "High precipitation (>50mm) and warm temp (>20°C) ideal for rice germination.",
        "severity": "high",
        "confidence": 0.8
    },
    {
        "rule_id": "rice_irrigation_needed",
        "crop": "Rice",
        "condition": lambda weather, crop_stage: (
            crop_stage == "vegetative" and 
            weather.get("rainfall_7d", 0) < 20 and 
            weather.get("humidity", 0) < 60
        ),
        "advisory_type": "irrigation",
        "message": "Schedule irrigation: Low rainfall and humidity detected. Maintain 3-5cm water level.",
        "reasoning": "Low rain forecast and dry conditions require supplemental irrigation for vegetative growth.",
        "severity": "medium",
        "confidence": 0.7
    },
    {
        "rule_id": "rice_pest_risk_high_humidity",
        "crop": "Rice",
        "condition": lambda weather, crop_stage: (
            crop_stage in ["vegetative", "flowering"] and 
            weather.get("humidity", 0) > 80 and 
            weather.get("temp_mean", 0) > 25
        ),
        "advisory_type": "pest_alert",
        "message": "Elevated pest risk: Brown plant hopper risk high due to warm, humid conditions. Monitor plants closely.",
        "reasoning": "Humidity >80% + temp >25°C creates favorable conditions for BPH reproduction.",
        "severity": "high",
        "confidence": 0.75
    },
    {
        "rule_id": "rice_frost_warning",
        "crop": "Rice",
        "condition": lambda weather, crop_stage: (
            crop_stage == "vegetative" and 
            weather.get("temp_min", 30) < 10
        ),
        "advisory_type": "frost_warning",
        "message": "Frost alert: Temperature dropping below 10°C. Protect seedlings with mulch or water.",
        "reasoning": "Rice seedlings are frost-sensitive; temp <10°C causes damage.",
        "severity": "high",
        "confidence": 0.9
    },
    {
        "rule_id": "rice_delay_basal_fertilizer",
        "crop": "Rice",
        "condition": lambda weather, crop_stage: (
            crop_stage == "vegetative" and 
            weather.get("rainfall_72h", 0) > 50
        ),
        "advisory_type": "fertilization",
        "message": "Delay basal fertilizer application: Heavy rain expected in next 72h. Apply after rainfall subsides.",
        "reasoning": "Heavy rain will leach nitrogen; wait for conditions to stabilize.",
        "severity": "medium",
        "confidence": 0.7
    }
]

def evaluate_farm_conditions(
    farm_data: dict,
    weather: dict,
    crop_stage: str
) -> List[dict]:
    """
    Evaluate a farm against rule set and generate advisories.
    
    Args:
        farm_data: Contains crop, location, soil data
        weather: Contains forecast features (rainfall_7d, temp_mean, humidity, etc.)
        crop_stage: Current stage (pre_sowing, sowing, vegetative, flowering, maturation)
    
    Returns:
        List of triggered advisory objects
    """
    advisories = []
    crop = farm_data.get("crop_name", "Rice")
    
    # Select rule set based on crop
    if crop == "Rice":
        rules = RICE_RULES
    else:
        # Placeholder for other crops
        rules = []
    
    # Evaluate each rule
    for rule in rules:
        try:
            if rule["condition"](weather, crop_stage):
                advisories.append({
                    "rule_id": rule["rule_id"],
                    "advisory_type": rule["advisory_type"],
                    "title": rule["message"][:50],
                    "message": rule["message"],
                    "reasoning": rule["reasoning"],
                    "severity": rule["severity"],
                    "confidence": rule["confidence"],
                    "generated_by": "rule_engine"
                })
        except Exception as e:
            # Log rule evaluation error but continue
            print(f"Error evaluating rule {rule['rule_id']}: {e}")
            continue
    
    return advisories

def calculate_crop_stage(crop: str, sowing_date: datetime) -> str:
    """
    Estimate crop stage based on days since sowing.
    
    Args:
        crop: Crop name
        sowing_date: Date of sowing
    
    Returns:
        Stage name (pre_sowing, sowing, vegetative, flowering, maturation)
    """
    days_since_sowing = (datetime.utcnow() - sowing_date).days
    
    # Rice typical stages (days from sowing)
    if crop == "Rice":
        if days_since_sowing < 0:
            return "pre_sowing"
        elif days_since_sowing < 10:
            return "sowing"
        elif days_since_sowing < 60:
            return "vegetative"
        elif days_since_sowing < 100:
            return "flowering"
        else:
            return "maturation"
    
    # Default fallback
    return "vegetative"

def prepare_advisories_for_delivery(
    advisories: List[dict],
    farmer_language: str = "en"
) -> List[dict]:
    """
    Prepare advisories for SMS/push delivery.
    
    Applies language translation, character limits, and formatting.
    """
    formatted = []
    
    for adv in advisories:
        # SMS limit: ~160 characters for international, ~70 for emoji-heavy
        sms_msg = f"🌾 {adv['message'][:130]}...\nReply 1: Helpful, 2: Not helpful"
        
        formatted.append({
            "advisory_id": None,  # Will be set after DB insert
            "message_sms": sms_msg,
            "message_push": adv["message"],
            "reasoning": adv["reasoning"],
            "confidence": adv["confidence"],
            "severity": adv["severity"],
            "advisory_type": adv["advisory_type"]
        })
    
    return formatted

# Example usage
if __name__ == "__main__":
    # Test farm data
    sample_farm = {
        "farm_id": 1,
        "crop_name": "Rice",
        "sowing_date": datetime.utcnow() - timedelta(days=25),  # 25 days old
        "area_hectares": 1.5
    }
    
    # Sample weather forecast (this would come from weather ingestion pipeline)
    sample_weather = {
        "rainfall_7d": 65,
        "rainfall_72h": 55,
        "temp_mean": 28,
        "temp_min": 20,
        "temp_max": 32,
        "humidity": 82,
        "wind_speed": 5
    }
    
    # Calculate stage
    stage = calculate_crop_stage(sample_farm["crop_name"], sample_farm["sowing_date"])
    print(f"Crop stage: {stage}\n")
    
    # Evaluate rules
    advisories = evaluate_farm_conditions(sample_farm, sample_weather, stage)
    print(f"Triggered {len(advisories)} advisories:\n")
    for adv in advisories:
        print(f"- [{adv['advisory_type']}] {adv['message']}")
        print(f"  Confidence: {adv['confidence']}, Reasoning: {adv['reasoning']}\n")
