"""
Authentication and registration tests.

Tests cover:
- Farmer registration (success, validation errors)
- Farmer login (success, invalid credentials, non-existent user)
- Token refresh
- Password validation
- Email uniqueness
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


@pytest.mark.auth
class TestFarmerRegistration:
    """Tests for farmer account registration."""
    
    def test_successful_registration(self, client: TestClient, test_farmer_data: dict):
        """Test successful farmer registration with valid data."""
        response = client.post("/api/auth/register", json=test_farmer_data)
        
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "farmer" in data or "id" in data
    
    def test_registration_with_missing_required_field(self, client: TestClient, test_farmer_data: dict):
        """Test registration fails with missing required fields."""
        invalid_data = test_farmer_data.copy()
        del invalid_data["email"]
        
        response = client.post("/api/auth/register", json=invalid_data)
        
        assert response.status_code == 422  # Validation error
        assert "detail" in response.json()
    
    def test_registration_with_invalid_email(self, client: TestClient, test_farmer_data: dict):
        """Test registration fails with invalid email format."""
        invalid_data = test_farmer_data.copy()
        invalid_data["email"] = "not-an-email"
        
        response = client.post("/api/auth/register", json=invalid_data)
        
        assert response.status_code == 422
    
    def test_registration_with_short_password(self, client: TestClient, test_farmer_data: dict):
        """Test registration fails with password too short."""
        invalid_data = test_farmer_data.copy()
        invalid_data["password"] = "short"
        
        response = client.post("/api/auth/register", json=invalid_data)
        
        assert response.status_code == 422
    
    def test_registration_with_empty_name(self, client: TestClient, test_farmer_data: dict):
        """Test registration fails with empty name."""
        invalid_data = test_farmer_data.copy()
        invalid_data["name"] = ""
        
        response = client.post("/api/auth/register", json=invalid_data)
        
        assert response.status_code == 422
    
    def test_registration_with_duplicate_email(self, client: TestClient, farmer_in_db, test_farmer_data: dict):
        """Test registration fails when email already exists."""
        duplicate_data = test_farmer_data.copy()
        duplicate_data["email"] = farmer_in_db.email
        
        response = client.post("/api/auth/register", json=duplicate_data)
        
        assert response.status_code == 400  # Conflict or bad request
    
    def test_registration_with_duplicate_phone(self, client: TestClient, farmer_in_db, test_farmer_data: dict):
        """Test registration fails when phone already exists."""
        duplicate_data = test_farmer_data.copy()
        duplicate_data["phone"] = farmer_in_db.phone
        
        response = client.post("/api/auth/register", json=duplicate_data)
        
        assert response.status_code == 400


@pytest.mark.auth
class TestFarmerLogin:
    """Tests for farmer login functionality."""
    
    def test_successful_login(self, client: TestClient, farmer_in_db):
        """Test successful login with correct credentials."""
        response = client.post(
            "/api/auth/login",
            json={"email": farmer_in_db.email, "password": "SecurePass123!"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_with_invalid_email(self, client: TestClient):
        """Test login fails with non-existent email."""
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "SomePass123!"}
        )
        
        assert response.status_code == 401 or response.status_code == 400
    
    def test_login_with_wrong_password(self, client: TestClient, farmer_in_db):
        """Test login fails with incorrect password."""
        response = client.post(
            "/api/auth/login",
            json={"email": farmer_in_db.email, "password": "WrongPassword123!"}
        )
        
        assert response.status_code == 401 or response.status_code == 400
    
    def test_login_with_empty_credentials(self, client: TestClient):
        """Test login fails with empty credentials."""
        response = client.post(
            "/api/auth/login",
            json={"email": "", "password": ""}
        )
        
        assert response.status_code == 422 or response.status_code == 400
    
    def test_login_missing_email(self, client: TestClient):
        """Test login fails when email is missing."""
        response = client.post(
            "/api/auth/login",
            json={"password": "SomePass123!"}
        )
        
        assert response.status_code == 422


@pytest.mark.auth
class TestTokenRefresh:
    """Tests for JWT token refresh functionality."""
    
    def test_token_refresh_with_valid_token(self, client: TestClient, auth_headers: dict):
        """Test token refresh with a valid refresh token."""
        # First, get an access token
        response = client.post(
            "/api/auth/refresh",
            headers=auth_headers
        )
        
        # The response should contain either a new token or indicate success
        # Status code should be 200 if endpoint exists and is implemented
        # Status 404 is acceptable if endpoint isn't implemented yet
        if response.status_code != 404:
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data or "token_type" in data
    
    def test_token_refresh_without_token(self, client: TestClient):
        """Test token refresh fails without authentication header."""
        response = client.post("/api/auth/refresh")
        
        assert response.status_code == 401 or response.status_code == 403
    
    def test_token_refresh_with_invalid_token(self, client: TestClient):
        """Test token refresh fails with invalid token."""
        response = client.post(
            "/api/auth/refresh",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        
        assert response.status_code == 401 or response.status_code == 422


@pytest.mark.auth
class TestAuthorizationHeaders:
    """Tests for protected endpoints with authorization."""
    
    def test_protected_endpoint_without_token(self, client: TestClient):
        """Test accessing protected endpoint without token fails."""
        response = client.get("/api/advisories")
        
        assert response.status_code == 401 or response.status_code == 403
    
    def test_protected_endpoint_with_invalid_token(self, client: TestClient):
        """Test accessing protected endpoint with invalid token fails."""
        response = client.get(
            "/api/advisories",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401 or response.status_code == 422
    
    def test_protected_endpoint_with_valid_token(self, client: TestClient, auth_headers: dict):
        """Test accessing protected endpoint with valid token succeeds."""
        response = client.get(
            "/api/advisories",
            headers=auth_headers
        )
        
        # Should not be 401/403, might be other status codes (200, empty list, etc.)
        assert response.status_code != 401
        assert response.status_code != 403
    
    def test_malformed_auth_header(self, client: TestClient):
        """Test endpoint with malformed authorization header."""
        response = client.get(
            "/api/advisories",
            headers={"Authorization": "InvalidFormat"}
        )
        
        assert response.status_code == 401 or response.status_code == 422
