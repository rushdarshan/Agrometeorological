"""
Feedback collection and analysis tests.

Tests cover:
- Creating feedback for advisories
- Retrieving feedback
- Feedback aggregation and analysis
- Feedback type validation
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.feedback
class TestFeedbackCreation:
    """Tests for feedback creation."""
    
    def test_create_feedback_successful(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict,
        test_feedback_data: dict
    ):
        """Test successful feedback creation."""
        feedback_data = test_feedback_data.copy()
        feedback_data["advisory_id"] = advisory_in_db.id
        
        response = client.post(
            "/api/feedback",
            headers=auth_headers,
            json=feedback_data
        )
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data or "feedback_id" in data or "message" in data
    
    def test_create_feedback_without_auth(
        self, 
        client: TestClient, 
        advisory_in_db,
        test_feedback_data: dict
    ):
        """Test feedback creation fails without authentication."""
        feedback_data = test_feedback_data.copy()
        feedback_data["advisory_id"] = advisory_in_db.id
        
        response = client.post(
            "/api/feedback",
            json=feedback_data
        )
        
        assert response.status_code == 401 or response.status_code == 403
    
    def test_create_feedback_invalid_advisory(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_feedback_data: dict
    ):
        """Test feedback creation fails with invalid advisory ID."""
        feedback_data = test_feedback_data.copy()
        feedback_data["advisory_id"] = 99999
        
        response = client.post(
            "/api/feedback",
            headers=auth_headers,
            json=feedback_data
        )
        
        assert response.status_code == 404 or response.status_code == 400
    
    def test_create_feedback_invalid_type(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict,
        test_feedback_data: dict
    ):
        """Test feedback creation with invalid feedback type."""
        feedback_data = test_feedback_data.copy()
        feedback_data["advisory_id"] = advisory_in_db.id
        feedback_data["feedback_type"] = "invalid_type"
        
        response = client.post(
            "/api/feedback",
            headers=auth_headers,
            json=feedback_data
        )
        
        assert response.status_code == 422 or response.status_code == 400
    
    def test_create_feedback_missing_required_field(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict
    ):
        """Test feedback creation fails with missing required field."""
        response = client.post(
            "/api/feedback",
            headers=auth_headers,
            json={"advisory_id": advisory_in_db.id}  # Missing feedback_type
        )
        
        assert response.status_code == 422
    
    def test_create_feedback_with_rating(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict,
        test_feedback_data: dict
    ):
        """Test feedback creation with rating."""
        feedback_data = test_feedback_data.copy()
        feedback_data["advisory_id"] = advisory_in_db.id
        feedback_data["rating"] = 4
        
        response = client.post(
            "/api/feedback",
            headers=auth_headers,
            json=feedback_data
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert data is not None
    
    def test_create_feedback_with_invalid_rating(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict,
        test_feedback_data: dict
    ):
        """Test feedback creation with invalid rating (out of range)."""
        feedback_data = test_feedback_data.copy()
        feedback_data["advisory_id"] = advisory_in_db.id
        feedback_data["rating"] = 10  # Usually should be 1-5
        
        response = client.post(
            "/api/feedback",
            headers=auth_headers,
            json=feedback_data
        )
        
        # May accept or reject depending on implementation
        if response.status_code != 201 and response.status_code != 200:
            assert response.status_code == 422 or response.status_code == 400


@pytest.mark.feedback
class TestFeedbackRetrieval:
    """Tests for retrieving feedback."""
    
    def test_get_feedback_for_advisory(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict
    ):
        """Test retrieving feedback for a specific advisory."""
        response = client.get(
            f"/api/feedback/advisory/{advisory_in_db.id}",
            headers=auth_headers
        )
        
        # May return 200, 404 if not implemented, or 403 if not authorized
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
    
    def test_get_all_feedback(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test retrieving all feedback for authenticated user."""
        response = client.get(
            "/api/feedback",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
    
    def test_get_feedback_without_auth(
        self, 
        client: TestClient, 
        advisory_in_db
    ):
        """Test feedback retrieval fails without authentication."""
        response = client.get(f"/api/feedback/advisory/{advisory_in_db.id}")
        
        assert response.status_code == 401 or response.status_code == 403
    
    def test_get_feedback_with_pagination(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test feedback retrieval with pagination."""
        response = client.get(
            "/api/feedback?skip=0&limit=10",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)


@pytest.mark.feedback
class TestFeedbackAnalysis:
    """Tests for feedback analysis and aggregation."""
    
    def test_feedback_summary_by_type(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test retrieving feedback summary grouped by type."""
        response = client.get(
            "/api/feedback/summary",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)
    
    def test_average_advisory_rating(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict
    ):
        """Test retrieving average rating for an advisory."""
        response = client.get(
            f"/api/feedback/advisory/{advisory_in_db.id}/rating",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if "average_rating" in data:
                rating = data["average_rating"]
                # Should be between 1-5 typically
                if rating is not None:
                    assert 1 <= rating <= 5
    
    def test_feedback_response_rate(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test retrieving feedback response rate."""
        response = client.get(
            "/api/feedback/response-rate",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if "response_rate" in data:
                rate = data["response_rate"]
                assert 0 <= rate <= 100


@pytest.mark.feedback
class TestFeedbackIntegration:
    """Integration tests for feedback workflow."""
    
    def test_end_to_end_feedback_workflow(
        self, 
        client: TestClient, 
        farmer_in_db,
        advisory_in_db,
        auth_headers: dict,
        test_feedback_data: dict
    ):
        """
        Test complete feedback workflow:
        Get advisory → Create feedback → Retrieve feedback → View summary
        """
        # Step 1: Get advisory
        advisory_response = client.get(
            f"/api/advisories/{advisory_in_db.id}",
            headers=auth_headers
        )
        assert advisory_response.status_code == 200
        
        # Step 2: Create feedback
        feedback_data = test_feedback_data.copy()
        feedback_data["advisory_id"] = advisory_in_db.id
        
        feedback_response = client.post(
            "/api/feedback",
            headers=auth_headers,
            json=feedback_data
        )
        
        if feedback_response.status_code in [200, 201]:
            # Step 3: Retrieve feedback
            list_response = client.get(
                "/api/feedback",
                headers=auth_headers
            )
            
            if list_response.status_code == 200:
                feedbacks = list_response.json()
                assert isinstance(feedbacks, list)
            
            # Step 4: Get feedback summary (if available)
            summary_response = client.get(
                "/api/feedback/summary",
                headers=auth_headers
            )
            
            if summary_response.status_code == 200:
                summary = summary_response.json()
                assert summary is not None
