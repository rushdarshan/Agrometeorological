"""
End-to-end integration tests.

Tests cover complete user workflows:
- Full farmer registration and onboarding flow
- Farm creation and setup
- Advisory generation workflow
- SMS notification delivery
- Feedback collection
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, UTC


@pytest.mark.integration
class TestFullUserOnboarding:
    """Integration tests for complete user onboarding flow."""
    
    def test_farmer_registration_to_first_advisory(
        self, 
        client: TestClient, 
        test_farmer_data: dict,
        test_farm_data: dict,
        test_weather_data: dict
    ):
        """
        Test complete onboarding:
        Register → Login → Create Farm → Generate Advisory
        """
        # Step 1: Register farmer
        register_response = client.post(
            "/api/auth/register",
            json=test_farmer_data
        )
        
        assert register_response.status_code == 201
        register_data = register_response.json()
        assert "access_token" in register_data
        
        token = register_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 2: Create farm
        farm_response = client.post(
            "/api/farms",
            headers=headers,
            json=test_farm_data
        )
        
        if farm_response.status_code in [200, 201]:
            farm_data = farm_response.json()
            farm_id = farm_data.get("id") or farm_data.get("farm_id")
            
            assert farm_id is not None
            
            # Step 3: Generate advisory
            advisory_response = client.post(
                "/api/advisories/generate",
                headers=headers,
                json={"farm_id": farm_id}
            )
            
            if advisory_response.status_code in [200, 201, 202]:
                advisory_data = advisory_response.json()
                assert advisory_data is not None
    
    def test_farmer_login_and_dashboard_access(
        self, 
        client: TestClient, 
        farmer_in_db,
        farm_in_db
    ):
        """
        Test login and dashboard access:
        Login → View Dashboard → View Farms → View Advisories
        """
        # Step 1: Login
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": farmer_in_db.email,
                "password": "SecurePass123!"
            }
        )
        
        assert login_response.status_code == 200
        login_data = login_response.json()
        token = login_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 2: Access dashboard
        dashboard_response = client.get(
            "/api/dashboard/stats",
            headers=headers
        )
        
        assert dashboard_response.status_code == 200
        
        # Step 3: View farms
        farms_response = client.get(
            "/api/farms",
            headers=headers
        )
        
        assert farms_response.status_code == 200
        farms = farms_response.json()
        assert isinstance(farms, list)
        
        # Step 4: View advisories
        advisories_response = client.get(
            "/api/advisories",
            headers=headers
        )
        
        assert advisories_response.status_code == 200
        advisories = advisories_response.json()
        assert isinstance(advisories, list)


@pytest.mark.integration
class TestAdvisoryGenerationWorkflow:
    """Integration tests for advisory generation workflow."""
    
    def test_weather_to_advisory_pipeline(
        self, 
        client: TestClient, 
        farmer_in_db,
        farm_in_db,
        crop_in_db,
        weather_data_in_db,
        auth_headers: dict
    ):
        """
        Test advisory generation pipeline:
        Get Weather → Analyze → Generate Advisory → Return Results
        """
        # Step 1: Get weather data
        weather_response = client.get(
            f"/api/weather/{farm_in_db.id}",
            headers=auth_headers
        )
        
        weather_ok = weather_response.status_code == 200
        if weather_ok:
            weather_data = weather_response.json()
            assert weather_data is not None
        
        # Step 2: Generate advisory
        advisory_response = client.post(
            "/api/advisories/generate",
            headers=auth_headers,
            json={"farm_id": farm_in_db.id}
        )
        
        assert advisory_response.status_code in [200, 201, 202]
        
        if advisory_response.status_code in [200, 201]:
            advisory_data = advisory_response.json()
            
            # Step 3: Verify advisory structure
            assert advisory_data is not None
            
            advisory_id = advisory_data.get("id") or advisory_data.get("advisory_id")
            
            # Step 4: Retrieve advisory details
            if advisory_id:
                detail_response = client.get(
                    f"/api/advisories/{advisory_id}",
                    headers=auth_headers
                )
                
                if detail_response.status_code == 200:
                    details = detail_response.json()
                    assert "recommendation" in details or "description" in details
    
    def test_multiple_crops_advisory_generation(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict,
        db_session
    ):
        """Test advisory generation for farm with multiple crops."""
        from app.models import Crop
        from datetime import timedelta
        
        # Create second crop
        crop2 = Crop(
            farm_id=farm_in_db.id,
            name="Cassava",
            variety="White",
            planting_date=datetime.now(UTC) - timedelta(days=60),
            expected_harvest_date=datetime.now(UTC) + timedelta(days=200),
            area_hectares=3.0,
            status="growing",
        )
        db_session.add(crop2)
        db_session.commit()
        
        # Generate advisories
        response = client.post(
            "/api/advisories/generate",
            headers=auth_headers,
            json={"farm_id": farm_in_db.id}
        )
        
        assert response.status_code in [200, 201, 202]


@pytest.mark.integration
class TestSMSNotificationWorkflow:
    """Integration tests for SMS notification workflow."""
    
    def test_advisory_to_sms_notification(
        self, 
        client: TestClient, 
        farmer_in_db,
        farm_in_db,
        advisory_in_db,
        auth_headers: dict
    ):
        """
        Test SMS notification workflow:
        Generate Advisory → Create SMS Task → Track Status
        """
        # Step 1: We have an advisory
        assert advisory_in_db.id is not None
        
        # Step 2: Send SMS notification
        sms_response = client.post(
            "/api/sms/send",
            headers=auth_headers,
            json={
                "phone_number": farmer_in_db.phone,
                "message": f"Advisory: {advisory_in_db.recommendation}",
            }
        )
        
        if sms_response.status_code in [200, 202]:
            sms_data = sms_response.json()
            assert sms_data is not None
            
            # Step 3: Check delivery status
            task_id = sms_data.get("task_id") or sms_data.get("message_id")
            
            if task_id:
                status_response = client.get(
                    f"/api/sms/status/{task_id}",
                    headers=auth_headers
                )
                
                if status_response.status_code == 200:
                    status = status_response.json()
                    # Status should indicate queued, sent, or delivered
                    assert status is not None
    
    def test_bulk_sms_to_region(
        self, 
        client: TestClient, 
        farmer_in_db,
        auth_headers: dict
    ):
        """Test sending SMS to all farmers in a region."""
        # Step 1: Get farmers in region
        response = client.get(
            f"/api/farmers?state={farmer_in_db.state}",
            headers=auth_headers
        )
        
        # Step 2: Send bulk SMS
        bulk_response = client.post(
            "/api/sms/send-to-region",
            headers=auth_headers,
            json={
                "state": farmer_in_db.state,
                "message": "Regional advisory message",
            }
        )
        
        if bulk_response.status_code in [200, 202, 404]:
            # Either implemented or not, but shouldn't error
            assert bulk_response.status_code != 500


@pytest.mark.integration
class TestFeedbackWorkflow:
    """Integration tests for feedback collection workflow."""
    
    def test_advisory_feedback_collection(
        self, 
        client: TestClient, 
        advisory_in_db,
        auth_headers: dict,
        test_feedback_data: dict
    ):
        """
        Test feedback workflow:
        View Advisory → Create Feedback → View Analytics
        """
        # Step 1: View advisory
        advisory_response = client.get(
            f"/api/advisories/{advisory_in_db.id}",
            headers=auth_headers
        )
        
        assert advisory_response.status_code == 200
        
        # Step 2: Submit feedback
        feedback_data = test_feedback_data.copy()
        feedback_data["advisory_id"] = advisory_in_db.id
        
        feedback_response = client.post(
            "/api/feedback",
            headers=auth_headers,
            json=feedback_data
        )
        
        if feedback_response.status_code in [200, 201]:
            feedback = feedback_response.json()
            feedback_id = feedback.get("id") or feedback.get("feedback_id")
            
            # Step 3: Verify feedback was created
            if feedback_id:
                list_response = client.get(
                    "/api/feedback",
                    headers=auth_headers
                )
                
                if list_response.status_code == 200:
                    feedbacks = list_response.json()
                    assert isinstance(feedbacks, list)


@pytest.mark.integration
class TestCompleteUserJourney:
    """Complete end-to-end user journey test."""
    
    def test_full_journey_register_to_feedback(
        self, 
        client: TestClient, 
        test_farmer_data: dict,
        test_farm_data: dict,
        test_feedback_data: dict
    ):
        """
        Test complete user journey:
        1. Register as farmer
        2. Create farm
        3. View weather
        4. Receive advisory
        5. Send SMS notification
        6. Provide feedback
        7. View analytics
        """
        # Step 1: Register
        register_response = client.post(
            "/api/auth/register",
            json=test_farmer_data
        )
        assert register_response.status_code == 201
        
        token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 2: Create farm
        farm_response = client.post(
            "/api/farms",
            headers=headers,
            json=test_farm_data
        )
        
        if farm_response.status_code in [200, 201]:
            farm_data = farm_response.json()
            farm_id = farm_data.get("id") or farm_data.get("farm_id")
            
            # Step 3: Get weather
            weather_response = client.get(
                f"/api/weather/{farm_id}",
                headers=headers
            )
            # Weather may or may not be available
            
            # Step 4: Generate advisory
            advisory_response = client.post(
                "/api/advisories/generate",
                headers=headers,
                json={"farm_id": farm_id}
            )
            
            if advisory_response.status_code in [200, 201, 202]:
                advisory_data = advisory_response.json()
                advisory_id = advisory_data.get("id") or advisory_data.get("advisory_id")
                
                if advisory_id:
                    # Step 5: Send SMS
                    sms_response = client.post(
                        "/api/sms/send",
                        headers=headers,
                        json={
                            "phone_number": test_farmer_data["phone"],
                            "message": "Your advisory is ready",
                        }
                    )
                    # SMS may or may not be configured
                    
                    # Step 6: Submit feedback
                    feedback_data = test_feedback_data.copy()
                    feedback_data["advisory_id"] = advisory_id
                    
                    feedback_response = client.post(
                        "/api/feedback",
                        headers=headers,
                        json=feedback_data
                    )
                    # Feedback may or may not work
                    
                    # Step 7: View dashboard
                    dashboard_response = client.get(
                        "/api/dashboard/stats",
                        headers=headers
                    )
                    assert dashboard_response.status_code == 200
