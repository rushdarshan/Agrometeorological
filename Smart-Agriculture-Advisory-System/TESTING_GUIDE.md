# Testing Framework Guide

Comprehensive testing setup for Smart Agriculture Advisory System with 70%+ backend coverage and 50%+ frontend coverage targets.

## 📋 Table of Contents

- [Backend Testing (pytest)](#backend-testing-pytest)
- [Frontend Testing (Jest)](#frontend-testing-jest)
- [Running Tests](#running-tests)
- [Coverage Reports](#coverage-reports)
- [Mock Data & Fixtures](#mock-data--fixtures)
- [CI/CD Integration](#cicd-integration)

---

## Backend Testing (pytest)

### Overview

Backend tests use **pytest** with an in-memory SQLite database for fast, isolated testing.

### Structure

```
Smart-Agriculture-Advisory-System/
├── conftest.py                    # Shared fixtures and config
├── pytest.ini                     # pytest configuration
└── tests/
    ├── __init__.py
    ├── test_auth.py              # Authentication & registration
    ├── test_advisories.py        # Advisory generation & retrieval
    ├── test_weather.py           # Weather service integration
    ├── test_dashboard.py         # Dashboard & analytics
    ├── test_feedback.py          # Feedback collection
    ├── test_ml_model.py          # ML model & SHAP
    ├── test_sms_tasks.py         # Celery SMS tasks
    └── test_integration.py       # End-to-end workflows
```

### Available Fixtures

All fixtures are defined in `conftest.py`:

#### Database Fixtures

```python
# In-memory SQLite database for all tests
db_engine()

# Fresh session for each test (auto-rollback)
db_session()

# FastAPI TestClient with dependency override
client()
```

#### Sample Data Fixtures

```python
test_farmer_data          # Valid farmer registration payload
test_farm_data            # Valid farm creation payload
test_weather_data         # Sample weather forecast
test_advisory_data        # Sample advisory
test_feedback_data        # Sample feedback
```

#### Entity Fixtures

```python
farmer_in_db()            # Pre-registered farmer in DB
farm_in_db()              # Farm with farmer owner
crop_in_db()              # Crop associated with farm
advisory_in_db()          # Generated advisory
weather_data_in_db()      # Weather forecast in DB
```

#### Authentication Fixtures

```python
auth_headers()            # JWT token headers for authenticated requests
admin_headers()           # JWT token headers for admin user
```

### Example Test

```python
# tests/test_advisories.py
@pytest.mark.advisory
class TestAdvisoryGeneration:
    def test_generate_advisory_successful(
        self, 
        client: TestClient, 
        farm_in_db,
        auth_headers: dict
    ):
        """Test successful advisory generation for a farm."""
        response = client.post(
            "/api/advisories/generate",
            headers=auth_headers,
            json={"farm_id": farm_in_db.id}
        )
        
        assert response.status_code in [200, 201, 202]
        data = response.json()
        assert "advisory_id" in data
```

### Test Markers

Organize tests with pytest markers:

```bash
# Run only auth tests
pytest -m auth

# Run all advisory tests
pytest -m advisory

# Run integration tests
pytest -m integration

# Run all except slow tests
pytest -m "not slow"
```

### Available Markers

- `@pytest.mark.auth` - Authentication tests
- `@pytest.mark.advisory` - Advisory tests
- `@pytest.mark.weather` - Weather service tests
- `@pytest.mark.dashboard` - Dashboard tests
- `@pytest.mark.feedback` - Feedback tests
- `@pytest.mark.ml` - ML model tests
- `@pytest.mark.sms` - SMS task tests
- `@pytest.mark.integration` - End-to-end tests
- `@pytest.mark.slow` - Long-running tests

---

## Frontend Testing (Jest)

### Overview

Frontend tests use **Jest** + **React Testing Library** with **Mock Service Worker (MSW)** for API mocking.

### Structure

```
frontend/
├── jest.config.js                     # Jest configuration
├── jest.setup.js                      # Setup & MSW server
├── __tests__/
│   ├── setup.ts                       # Custom render function
│   ├── mocks/
│   │   ├── handlers.ts               # API mock handlers
│   │   └── server.ts                 # MSW server setup
│   ├── components/
│   │   ├── dashboard.test.tsx
│   │   └── auth.test.tsx
│   └── hooks/
│       └── api-client.test.ts
```

### Custom Render Function

Use the custom `render` function that provides React Query context:

```typescript
// __tests__/setup.ts
import { render } from '../__tests__/setup'

describe('Dashboard', () => {
  it('displays stats', async () => {
    const { screen } = render(<Dashboard />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
```

### Mock Service Worker (MSW)

All API calls are intercepted and mocked in tests.

#### Mock Handlers

```typescript
// __tests__/mocks/handlers.ts
export const handlers = [
  http.get('/api/advisories', () => {
    return HttpResponse.json([{ id: 1, title: 'Advisory' }])
  }),
  http.post('/api/advisories/generate', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 1, farm_id: body.farm_id }, { status: 201 })
  }),
  // ... more handlers
]
```

#### Override Handlers in Tests

```typescript
it('shows error fallback', () => {
  server.use(
    http.get('/api/advisories', () => {
      return HttpResponse.error()
    })
  )
  render(<Dashboard />)
  expect(screen.getByText(/error/i)).toBeInTheDocument()
})
```

### Testing Patterns

#### Testing API Calls

```typescript
it('fetches and displays advisories', async () => {
  const { screen, waitFor } = render(<AdvisoriesList />)
  
  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('Irrigation Advisory')).toBeInTheDocument()
  })
})
```

#### Testing User Interactions

```typescript
it('generates advisory on button click', async () => {
  const { screen, fireEvent } = render(<GenerateAdvisoryButton />)
  
  const button = screen.getByRole('button', { name: /generate/i })
  fireEvent.click(button)
  
  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument()
  })
})
```

#### Testing Form Validation

```typescript
it('validates email field', async () => {
  const { screen, fireEvent } = render(<RegistrationForm />)
  
  const emailInput = screen.getByLabelText(/email/i)
  fireEvent.change(emailInput, { target: { value: 'invalid' } })
  
  // Check validation error appears
  expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
})
```

---

## Running Tests

### Backend Tests

```bash
cd Smart-Agriculture-Advisory-System

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_auth.py

# Run specific test class
pytest tests/test_auth.py::TestFarmerRegistration

# Run specific test
pytest tests/test_auth.py::TestFarmerRegistration::test_successful_registration

# Run with custom markers
pytest -m auth              # Auth tests only
pytest -m "not slow"        # Exclude slow tests
```

### Frontend Tests

```bash
cd Smart-Agriculture-Advisory-System/frontend

# Run all tests
npm test

# Run in watch mode (re-run on file change)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test dashboard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="displays stats"
```

---

## Coverage Reports

### Backend Coverage

```bash
cd Smart-Agriculture-Advisory-System

# Generate HTML coverage report
pytest --cov=app --cov-report=html

# View in browser
open htmlcov/index.html
```

**Target:** 70%+ coverage on critical paths
- `app/auth_utils.py` - 90%+
- `app/models.py` - 85%+
- `app/advisory_engine.py` - 70%+
- `app/weather_service.py` - 75%+

### Frontend Coverage

```bash
cd Smart-Agriculture-Advisory-System/frontend

# Generate coverage report
npm run test:coverage

# View in browser
open coverage/index.html
```

**Target:** 50%+ coverage on all components and hooks
- `components/` - 50%+
- `hooks/` - 50%+
- `lib/` - 50%+

---

## Mock Data & Fixtures

### Sample Farmer Data

```python
{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+234801234567",
    "password": "SecurePass123!",
    "location": "6.5244,3.3792",
    "state": "Lagos",
    "lga": "Alimosho"
}
```

### Sample Farm Data

```python
{
    "name": "Green Valley Farm",
    "location": "6.5244,3.3792",
    "size_hectares": 5.5,
    "crops": ["maize", "cassava"],
    "soil_type": "loam",
    "notes": "Testing farm with mixed crops"
}
```

### Sample Weather Data

```python
{
    "location": "6.5244,3.3792",
    "forecast": [
        {
            "date": "2024-01-15",
            "temp_min": 22,
            "temp_max": 28,
            "humidity": 75,
            "rainfall": 5.2,
            "wind_speed": 12,
            "cloud_cover": 60,
            "pressure": 1013,
        }
    ]
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Workflow File

`.github/workflows/tests.yml` includes:

1. **Backend Tests** - pytest on Python 3.9, 3.10, 3.11
2. **Frontend Tests** - Jest on Node 18, 20
3. **Coverage Upload** - to Codecov
4. **Test Artifacts** - uploaded for review

### Running Tests Locally (Pre-Commit)

```bash
# Backend
cd Smart-Agriculture-Advisory-System
pytest tests/ --cov=app

# Frontend
cd frontend
npm run test:coverage
```

---

## Best Practices

### Testing Principles

✅ **DO:**
- Use realistic sample data matching API contracts
- Test both happy paths and error scenarios
- Keep tests focused and independent
- Use descriptive test names
- Mark tests with appropriate markers
- Clean up database state between tests (auto-rollback handles this)

❌ **DON'T:**
- Test implementation details, test behavior
- Create hard dependencies between tests
- Use real API endpoints in tests (use mocks)
- Test external services directly
- Ignore test failures

### Writing Good Tests

```python
# ✅ Good - Clear, focused, descriptive
def test_registration_with_duplicate_email_fails(client, farmer_in_db):
    """Registration should fail when email already exists."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": farmer_in_db.email,  # Duplicate
            "password": "SecurePass123!",
            "name": "Another User",
            "phone": "+234802345678"
        }
    )
    assert response.status_code == 400

# ❌ Avoid - Vague, untestable, testing implementation
def test_duplicate(client):
    """Test."""
    response = client.post("/api/auth/register", json={})
    assert response.status_code != 200
```

### Database Cleanup

Database cleanup is automatic via transaction rollback:

```python
@pytest.fixture
def db_session(db_engine):
    """Fresh session for each test with automatic rollback."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    
    yield session
    
    session.close()
    transaction.rollback()  # Automatically cleans up
```

---

## Troubleshooting

### Backend Tests

**Error:** `ModuleNotFoundError: No module named 'app'`
```bash
# Make sure you're in the backend directory
cd Smart-Agriculture-Advisory-System
```

**Error:** `Database locked` in SQLite
```python
# The in-memory database should handle this automatically
# If issues persist, check for blocking queries
```

### Frontend Tests

**Error:** `Cannot find module '@tanstack/react-query'`
```bash
npm install
```

**Error:** MSW mock not intercepting requests
```typescript
// Verify handlers export and server setup
// Check mock path matches actual request URL
```

---

## Next Steps

Once component implementation is complete:

1. **Uncomment placeholder tests** in the test files
2. **Implement real assertions** for your components
3. **Run tests locally** to verify they pass
4. **Push to GitHub** to trigger CI/CD pipeline
5. **Monitor coverage** to maintain 70%+ (backend) and 50%+ (frontend)

See individual test files for detailed testing examples and patterns.

---

## References

- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/advanced/testing-databases/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Mock Service Worker](https://mswjs.io/)
- [React Query Testing](https://tanstack.com/query/latest/docs/react/testing)
