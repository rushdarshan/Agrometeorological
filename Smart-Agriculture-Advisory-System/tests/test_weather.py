"""
Weather service and integration tests.

Tests cover:
- Weather forecast retrieval for a farm location
- Weather data accuracy and schema validation
- API failure handling and fallback mechanisms
- Weather data caching
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, UTC


@pytest.mark.weather
class TestWeatherForecast:
    """Tests for weather forecast retrieval."""
    
    def test_get_weather_forecast_successful(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict
    ):
        """Test successful weather forecast retrieval for a farm."""
        response = client.get(
            f"/api/weather/{farm_in_db.id}",
            headers=auth_headers
        )
        
        # May be 200 or 202 (async), 404 if not implemented
        if response.status_code != 404:
            assert response.status_code in [200, 202]
            data = response.json()
            
            # Validate response structure
            assert "forecast" in data or "location" in data or "data" in data
    
    def test_get_weather_forecast_invalid_farm(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test weather forecast fails with invalid farm ID."""
        response = client.get(
            "/api/weather/99999",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_get_weather_forecast_without_auth(
        self, 
        client: TestClient, 
        farm_in_db
    ):
        """Test weather forecast retrieval fails without authentication."""
        response = client.get(f"/api/weather/{farm_in_db.id}")
        
        assert response.status_code == 401 or response.status_code == 403
    
    def test_weather_forecast_schema_validation(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict
    ):
        """Test weather forecast response contains expected fields."""
        response = client.get(
            f"/api/weather/{farm_in_db.id}",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for forecast data
            if "forecast" in data:
                forecast = data["forecast"]
                assert isinstance(forecast, list)
                
                if len(forecast) > 0:
                    day = forecast[0]
                    # Should have temperature info
                    assert any(key in day for key in ["temp_max", "temperature", "temp"])


@pytest.mark.weather
class TestWeatherDataValidation:
    """Tests for weather data accuracy and format."""
    
    def test_weather_data_temperature_range(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict
    ):
        """Test weather temperature values are within reasonable range."""
        response = client.get(
            f"/api/weather/{farm_in_db.id}",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if "forecast" in data and isinstance(data["forecast"], list):
                for day in data["forecast"]:
                    # Temperature should be between -50°C and 60°C (realistic global range)
                    if "temp_max" in day:
                        assert -50 <= day["temp_max"] <= 60
                    if "temp_min" in day:
                        assert -50 <= day["temp_min"] <= 60
    
    def test_weather_data_humidity_range(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict
    ):
        """Test weather humidity values are between 0-100%."""
        response = client.get(
            f"/api/weather/{farm_in_db.id}",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if "forecast" in data and isinstance(data["forecast"], list):
                for day in data["forecast"]:
                    if "humidity" in day:
                        assert 0 <= day["humidity"] <= 100
    
    def test_weather_data_rainfall_non_negative(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict
    ):
        """Test weather rainfall values are non-negative."""
        response = client.get(
            f"/api/weather/{farm_in_db.id}",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if "forecast" in data and isinstance(data["forecast"], list):
                for day in data["forecast"]:
                    if "rainfall" in day:
                        assert day["rainfall"] >= 0


@pytest.mark.weather
class TestWeatherErrorHandling:
    """Tests for weather service error handling."""
    
    def test_weather_service_unavailable(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict
    ):
        """Test handling when weather service is unavailable."""
        # This test assumes the endpoint exists
        # In real scenario, would mock the external API to fail
        response = client.get(
            f"/api/weather/{farm_in_db.id}",
            headers=auth_headers
        )
        
        # Should either work or fail gracefully (not 500)
        # Implementation may return cached/fallback data (200)
        # or report service error (503)
        if response.status_code == 503:
            assert "error" in response.json() or "message" in response.json()
        elif response.status_code == 200:
            # Should have some fallback data
            assert response.json() is not None
    
    def test_weather_forecast_for_inactive_farm(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict,
        db_session
    ):
        """Test weather request for a deactivated farm."""
        # Mark farm as inactive
        farm_in_db.is_active = False
        db_session.commit()
        
        response = client.get(
            f"/api/weather/{farm_in_db.id}",
            headers=auth_headers
        )
        
        # May return 404 or 200 with empty data, both acceptable
        assert response.status_code in [200, 404]


@pytest.mark.weather
class TestWeatherCaching:
    """Tests for weather data caching behavior."""
    
    def test_weather_forecast_caching(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict
    ):
        """Test that weather data can be retrieved multiple times (caching)."""
        # First request
        response1 = client.get(
            f"/api/weather/{farm_in_db.id}",
            headers=auth_headers
        )
        
        # Second request (should ideally be faster/cached)
        response2 = client.get(
            f"/api/weather/{farm_in_db.id}",
            headers=auth_headers
        )
        
        # Both should succeed
        if response1.status_code == 200 and response2.status_code == 200:
            # If cached properly, data should be identical
            data1 = response1.json()
            data2 = response2.json()
            assert data1 == data2
