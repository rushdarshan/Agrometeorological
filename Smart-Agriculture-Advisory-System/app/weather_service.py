"""
Weather data service for fetching forecasts from OpenWeatherMap.
Falls back to realistic mock data when API key is not configured.
"""

import os
import math
import logging
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional

import requests

logger = logging.getLogger(__name__)

OWM_BASE_URL = "https://api.openweathermap.org/data/2.5"
OWM_ONECALL_URL = "https://api.openweathermap.org/data/3.0/onecall"


def _is_api_enabled() -> bool:
    key = os.getenv("OPENWEATHERMAP_API_KEY", "")
    return bool(key) and key not in ("your_api_key", "")


def fetch_weather_forecast(lat: float, lon: float) -> List[Dict]:
    """
    Fetch 7-day weather forecast for a location.

    Returns list of daily forecast dicts with:
      forecast_date, temperature_min, temperature_max, temperature_mean,
      humidity, rainfall, wind_speed, source, lead_time_hours

    Falls back to mock data if API key is not configured.
    """
    if _is_api_enabled():
        return _fetch_from_api(lat, lon)
    else:
        logger.info("OpenWeatherMap key not configured. Using mock weather data.")
        return _generate_mock_forecast(lat, lon)


def _fetch_from_api(lat: float, lon: float) -> List[Dict]:
    """Live fetch from OpenWeatherMap One Call API 3.0."""
    api_key = os.getenv("OPENWEATHERMAP_API_KEY")
    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
        "exclude": "current,minutely,hourly,alerts"
    }
    try:
        resp = requests.get(OWM_ONECALL_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        forecasts = []
        for i, day in enumerate(data.get("daily", [])[:7]):
            dt = datetime.utcfromtimestamp(day["dt"])
            forecasts.append({
                "forecast_date": dt,
                "temperature_min": day["temp"]["min"],
                "temperature_max": day["temp"]["max"],
                "temperature_mean": (day["temp"]["min"] + day["temp"]["max"]) / 2,
                "humidity": day["humidity"],
                "rainfall": day.get("rain", 0.0),
                "wind_speed": day.get("wind_speed"),
                "source": "openweathermap",
                "lead_time_hours": i * 24,
                "raw_data": day
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
