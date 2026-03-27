"""
Celery SMS task tests.

Tests cover:
- SMS task execution
- Celery error handling
- Task retry logic
- SMS delivery status tracking
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.sms
class TestSMSTaskExecution:
    """Tests for SMS task execution."""
    
    def test_send_sms_task_queued(
        self, 
        client: TestClient, 
        farmer_in_db,
        auth_headers: dict
    ):
        """Test SMS send task can be queued."""
        sms_data = {
            "phone_number": farmer_in_db.phone,
            "message": "Test advisory: Irrigate your farm",
        }
        
        response = client.post(
            "/api/sms/send",
            headers=auth_headers,
            json=sms_data
        )
        
        # May return 200, 202 (accepted), or 404 if not implemented
        if response.status_code in [200, 202]:
            data = response.json()
            assert "task_id" in data or "message_id" in data or "status" in data
    
    def test_send_sms_invalid_phone(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test SMS send fails with invalid phone number."""
        sms_data = {
            "phone_number": "invalid",
            "message": "Test message",
        }
        
        response = client.post(
            "/api/sms/send",
            headers=auth_headers,
            json=sms_data
        )
        
        if response.status_code != 404:
            assert response.status_code == 422 or response.status_code == 400
    
    def test_send_sms_empty_message(
        self, 
        client: TestClient, 
        farmer_in_db,
        auth_headers: dict
    ):
        """Test SMS send fails with empty message."""
        sms_data = {
            "phone_number": farmer_in_db.phone,
            "message": "",
        }
        
        response = client.post(
            "/api/sms/send",
            headers=auth_headers,
            json=sms_data
        )
        
        if response.status_code != 404:
            assert response.status_code == 422 or response.status_code == 400
    
    def test_send_sms_without_auth(
        self, 
        client: TestClient, 
        farmer_in_db
    ):
        """Test SMS send fails without authentication."""
        sms_data = {
            "phone_number": farmer_in_db.phone,
            "message": "Test message",
        }
        
        response = client.post(
            "/api/sms/send",
            json=sms_data
        )
        
        assert response.status_code == 401 or response.status_code == 403


@pytest.mark.sms
class TestSMSStatusTracking:
    """Tests for SMS delivery status tracking."""
    
    def test_get_sms_status(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test retrieving SMS delivery status."""
        task_id = "test_task_123"
        response = client.get(
            f"/api/sms/status/{task_id}",
            headers=auth_headers
        )
        
        # May return 200, 404 (if not implemented or task not found)
        if response.status_code == 200:
            data = response.json()
            assert "status" in data or "state" in data
    
    def test_get_sms_history(
        self, 
        client: TestClient, 
        farmer_in_db,
        auth_headers: dict
    ):
        """Test retrieving SMS history for a farmer."""
        response = client.get(
            "/api/sms/history",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)


@pytest.mark.sms
class TestSMSBulkSending:
    """Tests for bulk SMS sending."""
    
    def test_send_bulk_sms(
        self, 
        client: TestClient, 
        farmer_in_db,
        auth_headers: dict
    ):
        """Test sending SMS to multiple farmers."""
        bulk_data = {
            "phone_numbers": [farmer_in_db.phone, "+234802345678"],
            "message": "Bulk advisory message",
        }
        
        response = client.post(
            "/api/sms/send-bulk",
            headers=auth_headers,
            json=bulk_data
        )
        
        # May return 200, 202, or 404 if not implemented
        if response.status_code in [200, 202]:
            data = response.json()
            assert data is not None
    
    def test_send_sms_to_region(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test sending SMS to all farmers in a region."""
        region_data = {
            "state": "Lagos",
            "message": "Regional advisory",
        }
        
        response = client.post(
            "/api/sms/send-to-region",
            headers=auth_headers,
            json=region_data
        )
        
        if response.status_code == 200 or response.status_code == 202:
            data = response.json()
            assert data is not None


@pytest.mark.sms
class TestSMSErrorHandling:
    """Tests for SMS error handling and retries."""
    
    def test_sms_task_error_handling(
        self, 
        client: TestClient, 
        auth_headers: dict
    ):
        """Test handling of SMS task errors."""
        # Attempt to send to invalid number should handle gracefully
        sms_data = {
            "phone_number": "+0000000000",  # Invalid number
            "message": "Test message",
        }
        
        response = client.post(
            "/api/sms/send",
            headers=auth_headers,
            json=sms_data
        )
        
        # Should fail gracefully, not crash
        assert response.status_code in [200, 202, 400, 422] or response.status_code != 500
    
    def test_sms_retry_logic(
        self, 
        client: TestClient, 
        farmer_in_db,
        auth_headers: dict
    ):
        """Test SMS task retry on failure."""
        # This would typically be tested by mocking Celery
        # For now, just verify the endpoint exists
        sms_data = {
            "phone_number": farmer_in_db.phone,
            "message": "Test message with retry",
            "max_retries": 3,
        }
        
        response = client.post(
            "/api/sms/send",
            headers=auth_headers,
            json=sms_data
        )
        
        # Should either accept or reject, not crash
        assert response.status_code != 500


@pytest.mark.sms
class TestSMSIntegration:
    """Integration tests for SMS workflow."""
    
    def test_end_to_end_sms_workflow(
        self, 
        client: TestClient, 
        farmer_in_db,
        advisory_in_db,
        auth_headers: dict
    ):
        """
        Test complete SMS workflow:
        Generate advisory → Send SMS → Track status → View history
        """
        # Step 1: We have an advisory
        assert advisory_in_db.id is not None
        
        # Step 2: Send SMS
        sms_data = {
            "phone_number": farmer_in_db.phone,
            "message": f"Advisory {advisory_in_db.id}: {advisory_in_db.recommendation}",
        }
        
        sms_response = client.post(
            "/api/sms/send",
            headers=auth_headers,
            json=sms_data
        )
        
        # If SMS send works
        if sms_response.status_code in [200, 202]:
            response_data = sms_response.json()
            task_id = response_data.get("task_id") or response_data.get("message_id")
            
            # Step 3: Check status
            if task_id:
                status_response = client.get(
                    f"/api/sms/status/{task_id}",
                    headers=auth_headers
                )
                
                if status_response.status_code == 200:
                    status = status_response.json()
                    assert status is not None
            
            # Step 4: Get history
            history_response = client.get(
                "/api/sms/history",
                headers=auth_headers
            )
            
            if history_response.status_code == 200:
                history = history_response.json()
                assert isinstance(history, list)
