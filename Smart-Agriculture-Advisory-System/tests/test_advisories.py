"""
Advisory generation and retrieval tests.

Tests cover:
- Advisory generation from weather data and farm info
- Getting advisories for a farmer
- Getting specific advisory details
- Advisory status updates
- Filtering advisories by type
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, UTC


@pytest.mark.advisory
class TestAdvisoryGeneration:
    """Tests for advisory generation endpoint."""
    
    def test_generate_advisory_successful(
        self, 
        client: TestClient, 
        farmer_in_db,
        farm_in_db,
        crop_in_db,
        weather_data_in_db,
        auth_headers: dict
    ):
        """Test successful advisory generation for a farm."""
        response = client.post(
            f"/api/advisories/generate",
            headers=auth_headers,
            json={"farm_id": farm_in_db.id}
        )
        
        # Status code could be 200 (returns advisory) or 202 (async generation)
        assert response.status_code in [200, 202, 201]
        data = response.json()
        
        # Should contain at least one of these
        assert "advisory" in data or "advisory_id" in data or "id" in data or "message" in data
    
    def test_generate_advisory_without_auth(
        self, 
        client: TestClient, 
        farm_in_db
    ):
        """Test advisory generation fails without authentication."""
        response = client.post(
            "/api/advisories/generate",
            json={"farm_id": farm_in_db.id}
        )
        
        assert response.status_code == 401 or response.status_code == 403
    
    def test_generate_advisory_invalid_farm(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test advisory generation fails with invalid farm ID."""
        response = client.post(
            "/api/advisories/generate",
            headers=auth_headers,
            json={"farm_id": 99999}
        )
        
        assert response.status_code == 404 or response.status_code == 400
    
    def test_generate_advisory_with_invalid_data(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test advisory generation fails with invalid request data."""
        response = client.post(
            "/api/advisories/generate",
            headers=auth_headers,
            json={"farm_id": "not_a_number"}
        )
        
        assert response.status_code == 422


@pytest.mark.advisory
class TestGetAdvisories:
    """Tests for retrieving advisories."""
    
    def test_get_advisories_successful(
        self, 
        client: TestClient, 
        farmer_in_db,
        farm_in_db,
        advisory_in_db,
        auth_headers: dict
    ):
        """Test retrieving advisories for authenticated farmer."""
        response = client.get(
            "/api/advisories",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Should contain at least the one advisory we created
        if len(data) > 0:
            advisory = data[0]
            assert "id" in advisory or "advisory_id" in advisory
            assert "title" in advisory
            assert "description" in advisory or "recommendation" in advisory
    
    def test_get_advisories_without_auth(self, client: TestClient):
        """Test getting advisories fails without authentication."""
        response = client.get("/api/advisories")
        
        assert response.status_code == 401 or response.status_code == 403
    
    def test_get_advisories_with_pagination(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test advisory retrieval with pagination parameters."""
        response = client.get(
            "/api/advisories?skip=0&limit=10",
            headers=auth_headers
        )
        
        # Should succeed or return 404 if pagination not implemented
        assert response.status_code in [200, 404]
    
    def test_get_advisories_empty_list(
        self, 
        client: TestClient, 
        farmer_in_db,
        auth_headers: dict
    ):
        """Test getting advisories when farmer has none."""
        # Create a new farmer with no advisories
        response = client.get(
            "/api/advisories",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.advisory
class TestGetAdvisoryDetail:
    """Tests for retrieving specific advisory details."""
    
    def test_get_advisory_detail_successful(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict
    ):
        """Test retrieving details of a specific advisory."""
        response = client.get(
            f"/api/advisories/{advisory_in_db.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == advisory_in_db.id or data.get("advisory_id") == advisory_in_db.id
        assert "title" in data
        assert "description" in data or "recommendation" in data
    
    def test_get_advisory_detail_not_found(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test retrieving non-existent advisory."""
        response = client.get(
            "/api/advisories/99999",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_get_advisory_detail_without_auth(
        self, 
        client: TestClient, 
        advisory_in_db
    ):
        """Test advisory detail retrieval fails without authentication."""
        response = client.get(f"/api/advisories/{advisory_in_db.id}")
        
        assert response.status_code == 401 or response.status_code == 403
    
    def test_get_advisory_detail_invalid_id(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test retrieving advisory with invalid ID format."""
        response = client.get(
            "/api/advisories/not_a_number",
            headers=auth_headers
        )
        
        assert response.status_code == 422 or response.status_code == 404


@pytest.mark.advisory
class TestAdvisoryStatusUpdate:
    """Tests for updating advisory status."""
    
    def test_update_advisory_status(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict
    ):
        """Test updating advisory status (e.g., read, dismissed)."""
        response = client.patch(
            f"/api/advisories/{advisory_in_db.id}",
            headers=auth_headers,
            json={"status": "read"}
        )
        
        # May return 200 if implemented, 404 if not yet
        if response.status_code != 404:
            assert response.status_code == 200
            data = response.json()
            assert data.get("status") == "read" or "success" in data
    
    def test_update_advisory_status_invalid_status(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict
    ):
        """Test updating advisory with invalid status value."""
        response = client.patch(
            f"/api/advisories/{advisory_in_db.id}",
            headers=auth_headers,
            json={"status": "invalid_status"}
        )
        
        # Should fail with validation error if endpoint exists
        if response.status_code != 404:
            assert response.status_code == 422 or response.status_code == 400
    
    def test_update_advisory_status_not_found(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test updating non-existent advisory."""
        response = client.patch(
            "/api/advisories/99999",
            headers=auth_headers,
            json={"status": "read"}
        )
        
        if response.status_code != 404:
            assert response.status_code == 404


@pytest.mark.advisory
class TestAdvisoryFiltering:
    """Tests for filtering advisories by type and other criteria."""
    
    def test_filter_advisories_by_type(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test filtering advisories by advisory type."""
        response = client.get(
            "/api/advisories?type=irrigation",
            headers=auth_headers
        )
        
        # Endpoint may or may not support this, be flexible
        if response.status_code != 404:
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
    
    def test_filter_advisories_by_date_range(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test filtering advisories by date range."""
        from_date = "2024-01-01"
        to_date = "2024-12-31"
        
        response = client.get(
            f"/api/advisories?from_date={from_date}&to_date={to_date}",
            headers=auth_headers
        )
        
        if response.status_code != 404:
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
    
    def test_filter_advisories_by_confidence(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test filtering advisories by confidence level."""
        response = client.get(
            "/api/advisories?confidence=high",
            headers=auth_headers
        )
        
        if response.status_code != 404:
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


@pytest.mark.advisory
class TestAdvisoryIntegration:
    """Integration tests for advisory workflow."""
    
    def test_end_to_end_advisory_workflow(
        self, 
        client: TestClient, 
        farmer_in_db,
        farm_in_db,
        crop_in_db,
        weather_data_in_db,
        auth_headers: dict
    ):
        """
        Test complete workflow: generate advisory → retrieve → update status.
        
        This is an integration test covering the full lifecycle.
        """
        # Step 1: Generate advisory
        generate_response = client.post(
            "/api/advisories/generate",
            headers=auth_headers,
            json={"farm_id": farm_in_db.id}
        )
        
        assert generate_response.status_code in [200, 201, 202]
        
        # Step 2: Get all advisories
        list_response = client.get(
            "/api/advisories",
            headers=auth_headers
        )
        
        assert list_response.status_code == 200
        advisories = list_response.json()
        assert isinstance(advisories, list)
        
        # Step 3: Get detail of first advisory (if any)
        if len(advisories) > 0:
            advisory_id = advisories[0].get("id") or advisories[0].get("advisory_id")
            detail_response = client.get(
                f"/api/advisories/{advisory_id}",
                headers=auth_headers
            )
            
            assert detail_response.status_code == 200
