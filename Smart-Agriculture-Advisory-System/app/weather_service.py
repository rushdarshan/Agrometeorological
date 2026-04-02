"""
Weather data service for fetching forecasts from OpenWeatherMap.
Falls back to realistic mock data when API key is not configured.
"""

import os
import math
import logging
import random
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional

import requests
import redis

logger = logging.getLogger(__name__)

OWM_BASE_URL = "https://api.openweathermap.org/data/2.5"
OWM_FORECAST_URL = f"{OWM_BASE_URL}/forecast"

# Initialize Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
except Exception as e:
    logger.warning(f"Could not connect to Redis: {e}. Weather caching disabled.")
    redis_client = None

def _is_api_enabled() -> bool:
    key = os.getenv("OPENWEATHERMAP_API_KEY", "")
    return bool(key) and key not in ("your_api_key", "", "demo_key")


def fetch_weather_forecast(lat: float, lon: float) -> List[Dict]:
    """
    Fetch 7-day weather forecast for a location.

    Returns list of daily forecast dicts with:
      forecast_date, temperature_min, temperature_max, temperature_mean,
      humidity, rainfall, wind_speed, source, lead_time_hours

    Falls back to mock data if API key is not configured.
    """
    # Round coordinates to 2 decimal places (approx 1.1km grid) to share cache among nearby farms
    cache_lat = round(lat, 2)
    cache_lon = round(lon, 2)
    cache_key = f"weather:{cache_lat}:{cache_lon}"
    
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                logger.debug(f"Weather cache hit for {cache_lat},{cache_lon}")
                forecasts = json.loads(cached_data)
                # Convert date strings back to datetime
                for f in forecasts:
                    f["forecast_date"] = datetime.fromisoformat(f["forecast_date"])
                return forecasts
        except Exception as e:
            logger.error(f"Redis cache read error: {e}")

    # Cache miss
    if _is_api_enabled():
        forecasts = _fetch_from_api(lat, lon)
    else:
        logger.info("OpenWeatherMap key not configured. Using mock weather data.")
        forecasts = _generate_mock_forecast(lat, lon)
        
    if redis_client and forecasts:
        try:
            # Serialize datetimes to isoformat for JSON caching
            cache_payload = []
            for f in forecasts:
                item = dict(f)
                item["forecast_date"] = item["forecast_date"].isoformat()
                cache_payload.append(item)
            # TTL: 3 hours (10800 seconds)
            redis_client.setex(cache_key, 10800, json.dumps(cache_payload))
            logger.debug(f"Weather saved to cache for {cache_key}")
        except Exception as e:
            logger.error(f"Redis cache write error: {e}")
            
    return forecasts


def _fetch_from_api(lat: float, lon: float) -> List[Dict]:
    """Live fetch from OpenWeatherMap 5-Day/3-Hour Forecast API."""
    api_key = os.getenv("OPENWEATHERMAP_API_KEY")
    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
    }
    try:
        resp = requests.get(OWM_FORECAST_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        # Aggregate 3-hour slices into daily max/min/mean, humidity, and rainfall
        daily_aggregation = {}
        for item in data.get("list", []):
            dt = datetime.utcfromtimestamp(item["dt"])
            day_str = dt.strftime("%Y-%m-%d")
            
            if day_str not in daily_aggregation:
                daily_aggregation[day_str] = {
                    "forecast_date": dt.replace(hour=0, minute=0, second=0, microsecond=0),
                    "temps": [],
                    "humidities": [],
                    "wind_speeds": [],
                    "rainfall": 0.0,
                    "raw_data": []
                }
            
            agg = daily_aggregation[day_str]
            agg["temps"].append(item["main"]["temp"])
            if "humidity" in item["main"]:
                agg["humidities"].append(item["main"]["humidity"])
            if "speed" in item.get("wind", {}):
                agg["wind_speeds"].append(item["wind"]["speed"])
            # The 'rain' object usually contains '3h'
            if "rain" in item and "3h" in item["rain"]:
                agg["rainfall"] += item["rain"]["3h"]
                
            agg["raw_data"].append(item)

        forecasts = []
        for i, (day_str, agg) in enumerate(sorted(daily_aggregation.items())[:5]):
            forecasts.append({
                "forecast_date": agg["forecast_date"],
                "temperature_min": round(min(agg["temps"]), 2),
                "temperature_max": round(max(agg["temps"]), 2),
                "temperature_mean": round(sum(agg["temps"]) / len(agg["temps"]), 2),
                "humidity": round(sum(agg["humidities"]) / len(agg["humidities"]), 2) if agg["humidities"] else 0.0,
                "rainfall": round(agg["rainfall"], 2),
                "wind_speed": round(sum(agg["wind_speeds"]) / len(agg["wind_speeds"]), 2) if agg["wind_speeds"] else 0.0,
                "source": "openweathermap_forecast",
                "lead_time_hours": i * 24,
                "raw_data": agg["raw_data"]
            })
            
        return forecasts

    except requests.RequestException as e:
        logger.error(f"OpenWeatherMap API error: {e}. Falling back to mock.")
        return _generate_mock_forecast(lat, lon)


def _generate_mock_forecast(lat: float, lon: float) -> List[Dict]:
    """
    Generate realistic mock weather data.
    Uses latitude to simulate tropical/subtropical Indian climate.
    """
    base_temp = 28.0 - abs(lat - 20) * 0.3  # cooler at higher latitudes
    base_humidity = 70.0
    base_rain = 5.0

    # Seasonal factor based on current month
    month = datetime.utcnow().month
    if 6 <= month <= 9:  # Kharif / monsoon
        base_rain = 15.0
        base_humidity = 82.0
    elif month in (10, 11):  # Post-monsoon
        base_rain = 3.0
        base_humidity = 70.0
    elif month in (12, 1, 2):  # Winter / Rabi
        base_temp -= 8
        base_rain = 1.0
        base_humidity = 60.0
    else:  # Summer
        base_temp += 4
        base_rain = 0.5
        base_humidity = 55.0

    forecasts = []
    random.seed(int(lat * 100 + lon))  # deterministic seed per location

    for i in range(7):
        day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=i)
        temp_variation = random.uniform(-3, 3)
        t_mean = base_temp + temp_variation
        forecasts.append({
            "forecast_date": day,
            "temperature_min": round(t_mean - random.uniform(3, 6), 1),
            "temperature_max": round(t_mean + random.uniform(3, 6), 1),
            "temperature_mean": round(t_mean, 1),
            "humidity": round(min(100, max(20, base_humidity + random.uniform(-10, 10))), 1),
            "rainfall": round(max(0, base_rain + random.uniform(-base_rain * 0.5, base_rain * 1.5)), 1),
            "wind_speed": round(random.uniform(2, 15), 1),
            "source": "mock",
            "lead_time_hours": i * 24,
            "raw_data": None
        })

    return forecasts


def build_weather_summary(forecasts: List[Dict]) -> Dict:
    """
    Aggregate 7-day forecast into summary metrics used by the advisory engine.

    Returns dict with keys: rainfall_7d, rainfall_72h, temp_mean, temp_min, temp_max, humidity.
    """
    if not forecasts:
        return {
            "rainfall_7d": 0,
            "rainfall_72h": 0,
            "temp_mean": 25,
            "temp_min": 18,
            "temp_max": 34,
            "humidity": 65,
            "wind_speed": 5
        }

    rainfall_7d = sum(f.get("rainfall", 0) for f in forecasts)
    rainfall_72h = sum(f.get("rainfall", 0) for f in forecasts[:3])
    temp_mean = sum(f.get("temperature_mean", 0) for f in forecasts) / len(forecasts)
    temp_min = min(f.get("temperature_min", 99) for f in forecasts)
    temp_max = max(f.get("temperature_max", 0) for f in forecasts)
    humidity = sum(f.get("humidity", 0) for f in forecasts) / len(forecasts)
    wind_speed = sum(f.get("wind_speed", 0) or 0 for f in forecasts) / len(forecasts)

    return {
        "rainfall_7d": round(rainfall_7d, 1),
        "rainfall_72h": round(rainfall_72h, 1),
        "temp_mean": round(temp_mean, 1),
        "temp_min": round(temp_min, 1),
        "temp_max": round(temp_max, 1),
        "humidity": round(humidity, 1),
        "wind_speed": round(wind_speed, 1)
    }


def parse_location(location_string: str) -> Optional[tuple]:
    """
    Parse location string stored in DB ("lat,lon") into (lat, lon) tuple.
    Returns None if parsing fails.
    """
    try:
        parts = location_string.split(",")
        return float(parts[0].strip()), float(parts[1].strip())
    except Exception:
        return None
