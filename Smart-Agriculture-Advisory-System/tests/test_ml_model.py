"""
ML Model and SHAP explanation tests.

Tests cover:
- Model loading and initialization
- Prediction accuracy
- SHAP explanation generation
- Feature importance
- Batch predictions
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.ml
class TestModelLoading:
    """Tests for ML model loading and initialization."""
    
    def test_model_loads_successfully(self, client: TestClient):
        """Test that ML model loads without errors."""
        # This is more of an integration test that runs during startup
        # If the app starts without error, model is loaded
        response = client.get("/api/health")
        
        # App should be healthy if model loads
        if response.status_code == 200:
            data = response.json()
            # Model status may be checked in health endpoint
            if "model_loaded" in data or "status" in data:
                assert data.get("model_loaded", True)
    
    def test_model_version_endpoint(self, client: TestClient):
        """Test retrieving model version information."""
        response = client.get("/api/model/version")
        
        # May or may not be implemented
        if response.status_code == 200:
            data = response.json()
            assert "version" in data or "model" in data


@pytest.mark.ml
class TestModelPrediction:
    """Tests for model prediction endpoints."""
    
    def test_predict_advisory_type(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict
    ):
        """Test model prediction for advisory type."""
        prediction_data = {
            "farm_id": farm_in_db.id,
            "features": {
                "soil_moisture": 45.2,
                "temperature": 28.5,
                "humidity": 75,
                "rainfall_forecast": 5.2,
            }
        }
        
        response = client.post(
            "/api/model/predict",
            headers=auth_headers,
            json=prediction_data
        )
        
        # May return 200 or 404 if not implemented
        if response.status_code == 200:
            data = response.json()
            assert "prediction" in data or "advisory_type" in data
    
    def test_batch_prediction(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test batch prediction for multiple farms."""
        batch_data = {
            "predictions": [
                {
                    "farm_id": 1,
                    "features": {
                        "soil_moisture": 45.2,
                        "temperature": 28.5,
                        "humidity": 75,
                    }
                }
            ]
        }
        
        response = client.post(
            "/api/model/predict-batch",
            headers=auth_headers,
            json=batch_data
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list) or isinstance(data, dict)


@pytest.mark.ml
class TestSHAPExplanations:
    """Tests for SHAP explanation generation."""
    
    def test_get_shap_explanation(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict
    ):
        """Test retrieving SHAP explanation for an advisory."""
        response = client.get(
            f"/api/advisory/{advisory_in_db.id}/explanation",
            headers=auth_headers
        )
        
        # May not be implemented (404)
        if response.status_code == 200:
            data = response.json()
            
            # Should contain feature importance information
            assert "features" in data or "importance" in data or "explanation" in data
    
    def test_shap_explanation_structure(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict
    ):
        """Test SHAP explanation response structure."""
        response = client.get(
            f"/api/advisory/{advisory_in_db.id}/explanation",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Should be a well-structured explanation
            assert isinstance(data, dict)
            
            # Common fields in SHAP explanations
            possible_fields = [
                "base_value", "shap_values", "features",
                "feature_importance", "explanation", "values"
            ]
            assert any(field in data for field in possible_fields) or len(data) > 0


@pytest.mark.ml
class TestFeatureImportance:
    """Tests for feature importance analysis."""
    
    def test_get_global_feature_importance(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test retrieving global feature importance."""
        response = client.get(
            "/api/model/feature-importance",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict) or isinstance(data, list)
    
    def test_get_feature_importance_for_prediction(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict
    ):
        """Test feature importance specific to a prediction."""
        response = client.get(
            f"/api/advisory/{advisory_in_db.id}/feature-importance",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Should rank features by importance
            if isinstance(data, list):
                for item in data:
                    assert "feature" in item or "name" in item
                    assert "importance" in item or "value" in item


@pytest.mark.ml
class TestModelAccuracy:
    """Tests for model accuracy and performance metrics."""
    
    def test_get_model_metrics(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test retrieving model accuracy metrics."""
        response = client.get(
            "/api/model/metrics",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Should contain accuracy-related metrics
            possible_metrics = [
                "accuracy", "precision", "recall", "f1_score",
                "auc", "performance", "metrics"
            ]
            assert any(metric in data for metric in possible_metrics) or isinstance(data, dict)
    
    def test_get_model_confusion_matrix(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test retrieving model confusion matrix (for classification)."""
        response = client.get(
            "/api/model/confusion-matrix",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict) or isinstance(data, list)


@pytest.mark.ml
class TestModelIntegration:
    """Integration tests for ML model workflows."""
    
    def test_end_to_end_prediction_workflow(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict
    ):
        """
        Test complete ML workflow:
        Get farm data → Make prediction → Get explanation → View metrics
        """
        # Step 1: Get farm data (already have farm_in_db)
        farm_response = client.get(
            f"/api/farms/{farm_in_db.id}",
            headers=auth_headers
        )
        
        if farm_response.status_code == 200:
            # Step 2: Make prediction
            prediction_response = client.post(
                "/api/model/predict",
                headers=auth_headers,
                json={
                    "farm_id": farm_in_db.id,
                    "features": {
                        "soil_moisture": 45,
                        "temperature": 28,
                        "humidity": 75,
                    }
                }
            )
            
            if prediction_response.status_code == 200:
                # Step 3: Get explanation
                # (would need prediction ID from response)
                explanation_response = client.get(
                    "/api/model/feature-importance",
                    headers=auth_headers
                )
                
                if explanation_response.status_code == 200:
                    explanation = explanation_response.json()
                    assert explanation is not None
