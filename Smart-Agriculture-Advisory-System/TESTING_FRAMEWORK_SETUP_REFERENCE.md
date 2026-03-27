# Testing Framework - File Index & Reference

## Quick Reference Guide

This document provides a quick index of all testing framework files and their purposes.

---

## 📁 Backend Testing Files

### Configuration Files

| File | Location | Size | Purpose |
|------|----------|------|---------|
| `conftest.py` | `Smart-Agriculture-Advisory-System/` | 11.4 KB | Central fixture definitions and pytest configuration |
| `pytest.ini` | `Smart-Agriculture-Advisory-System/` | 1.1 KB | pytest discovery and execution settings |

### Test Modules

| File | Location | Tests | Purpose |
|------|----------|-------|---------|
| `tests/test_auth.py` | `Smart-Agriculture-Advisory-System/tests/` | 19 | Authentication and registration |
| `tests/test_advisories.py` | `Smart-Agriculture-Advisory-System/tests/` | 19 | Advisory generation and retrieval |
| `tests/test_weather.py` | `Smart-Agriculture-Advisory-System/tests/` | 10 | Weather service integration |
| `tests/test_dashboard.py` | `Smart-Agriculture-Advisory-System/tests/` | 17 | Dashboard and analytics |
| `tests/test_feedback.py` | `Smart-Agriculture-Advisory-System/tests/` | 15 | Feedback collection and analysis |
| `tests/test_ml_model.py` | `Smart-Agriculture-Advisory-System/tests/` | 11 | ML model and SHAP explanations |
| `tests/test_sms_tasks.py` | `Smart-Agriculture-Advisory-System/tests/` | 11 | Celery SMS task execution |
| `tests/test_integration.py` | `Smart-Agriculture-Advisory-System/tests/` | 8 | End-to-end integration tests |

### Supporting Files

| File | Location | Purpose |
|------|----------|---------|
| `tests/__init__.py` | `Smart-Agriculture-Advisory-System/tests/` | Package initialization |
| `requirements.txt` | `Smart-Agriculture-Advisory-System/` | Python dependencies (updated) |

---

## 📱 Frontend Testing Files

### Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| `jest.config.js` | `frontend/` | Jest configuration with Next.js preset |
| `jest.setup.js` | `frontend/` | Jest setup file with MSW and global mocks |

### Mock Setup

| File | Location | Size | Purpose |
|------|----------|------|---------|
| `__tests__/mocks/handlers.ts` | `frontend/__tests__/mocks/` | 10.6 KB | Mock API endpoints (25+) |
| `__tests__/mocks/server.ts` | `frontend/__tests__/mocks/` | 0.3 KB | MSW server initialization |

### Test Utilities

| File | Location | Size | Purpose |
|------|----------|------|---------|
| `__tests__/setup.ts` | `frontend/__tests__/` | 1.2 KB | Custom render function with React Query |

### Example Tests

| File | Location | Patterns | Purpose |
|------|----------|----------|---------|
| `__tests__/components/dashboard.test.tsx` | `frontend/__tests__/components/` | 11 | Dashboard component test patterns |
| `__tests__/components/auth.test.tsx` | `frontend/__tests__/components/` | 8 | Authentication component test patterns |
| `__tests__/hooks/api-client.test.ts` | `frontend/__tests__/hooks/` | 8 | API client hook test patterns |

### Supporting Files

| File | Location | Purpose |
|------|----------|---------|
| `package.json` | `frontend/` | Dependencies and test scripts (updated) |

---

## 🔄 CI/CD Files

| File | Location | Purpose |
|------|----------|---------|
| `.github/workflows/tests.yml` | `Smart-Agriculture-Advisory-System/.github/workflows/` | GitHub Actions test pipeline |

---

## 📚 Documentation Files

| File | Location | Size | Purpose |
|------|----------|------|---------|
| `TESTING_GUIDE.md` | `Smart-Agriculture-Advisory-System/` | 13.0 KB | Comprehensive testing guide |
| `IMPLEMENTATION_SUMMARY.md` | `Smart-Agriculture-Advisory-System/` | 11.9 KB | Detailed setup summary |
| `TESTING_CHECKLIST.md` | `Smart-Agriculture-Advisory-System/` | 8.4 KB | Implementation checklist |
| `TESTING_FRAMEWORK_SETUP_REFERENCE.md` | `Smart-Agriculture-Advisory-System/` | This file | File index and reference |

---

## 🎯 How to Use These Files

### Running Tests

**Backend:**
```bash
cd Smart-Agriculture-Advisory-System

# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with coverage
pytest --cov=app --cov-report=html
```

**Frontend:**
```bash
cd Smart-Agriculture-Advisory-System/frontend

# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Viewing Documentation

1. Start with **`TESTING_GUIDE.md`** - Complete overview and patterns
2. Reference **`IMPLEMENTATION_SUMMARY.md`** - What was created and statistics
3. Use **`TESTING_CHECKLIST.md`** - Track implementation progress
4. Check this file (**`TESTING_FRAMEWORK_SETUP_REFERENCE.md`**) - Quick index

### Understanding Test Structure

1. Look at **`conftest.py`** - Understand available fixtures
2. Review **`tests/test_auth.py`** - See backend test patterns
3. Review **`__tests__/mocks/handlers.ts`** - Understand API mocking
4. Review **`__tests__/components/dashboard.test.tsx`** - See frontend patterns

---

## 📊 File Statistics

### Backend Files
- Configuration files: 2
- Test modules: 8
- Supporting files: 2
- **Total: 12 files**
- **Total lines: ~16,000**

### Frontend Files
- Configuration files: 2
- Mock files: 2
- Test utilities: 1
- Test files: 3
- Supporting files: 1
- **Total: 9 files**
- **Total lines: ~10,000**

### CI/CD & Documentation
- CI/CD workflow: 1
- Documentation: 4
- **Total: 5 files**
- **Total lines: ~45,000**

### Grand Total
- **Total files: 26**
- **Total lines: ~113,000+**

---

## 🔍 Finding Specific Information

### "How do I..."

| Question | Answer Location |
|----------|-----------------|
| Run tests locally? | TESTING_GUIDE.md → "Running Tests" |
| Use a specific fixture? | conftest.py (fixture definitions) |
| Mock an API endpoint? | __tests__/mocks/handlers.ts (handlers) |
| Test a component? | __tests__/components/*.test.tsx (examples) |
| Test a hook? | __tests__/hooks/*.test.ts (examples) |
| Override a mock handler? | TESTING_GUIDE.md → "Mock Service Worker" |
| Generate coverage report? | TESTING_GUIDE.md → "Coverage Reports" |
| Configure CI/CD? | .github/workflows/tests.yml |
| See available fixtures? | conftest.py (scroll to fixture defs) |
| Find test patterns? | Example test files (`__tests__/components/*.test.tsx`) |
| Check implementation status? | TESTING_CHECKLIST.md |

---

## 📋 Content Organization

### `conftest.py` Sections
- Database setup (lines 1-60)
- Database fixtures (lines 62-120)
- Client fixture (lines 122-150)
- Sample data fixtures (lines 152-250)
- Entity fixtures (lines 252-350)
- Authentication fixtures (lines 352-400)
- Pytest configuration (lines 402-end)

### `TESTING_GUIDE.md` Sections
- Overview (lines 1-50)
- Backend testing guide (lines 51-400)
- Frontend testing guide (lines 401-650)
- Running tests (lines 651-750)
- Coverage reports (lines 751-850)
- Best practices (lines 851-1000+)

### Test Files Structure
Each test file follows this pattern:
1. Docstring with test overview
2. Test class (organized by feature)
3. Individual test methods
4. Comments explaining test purpose

---

## 🔐 File Permissions & Access

All files should be:
- ✅ Readable by all developers
- ✅ Writable by team members
- ✅ Tracked in Git
- ✅ Not requiring credentials to run

None of these files contain:
- ❌ Hardcoded secrets
- ❌ Credentials
- ❌ API keys
- ❌ Personal information

---

## 🚀 Deployment & Distribution

### Files to Commit to Git
- ✅ All test files (`tests/*.py`)
- ✅ All configuration files (`conftest.py`, `pytest.ini`, `jest.config.js`, `jest.setup.js`)
- ✅ All documentation files (`TESTING_*.md`)
- ✅ CI/CD workflow (`.github/workflows/tests.yml`)
- ✅ Frontend test files (`__tests__/**/*.{ts,tsx}`)
- ✅ Updated package files (`requirements.txt`, `package.json`)

### Files NOT to Commit
- ❌ `.pytest_cache/`
- ❌ `__pycache__/`
- ❌ `node_modules/`
- ❌ `coverage/`
- ❌ `htmlcov/`
- ❌ `.coverage`
- ❌ `.nyc_output/`

### .gitignore Entry
```
# Testing
__pycache__/
.pytest_cache/
.coverage
htmlcov/
coverage/
.nyc_output/
*.pyc
.next/
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Backend Tests:**
- Cannot import app? → Check you're in `Smart-Agriculture-Advisory-System/` directory
- Database locked? → Automatic cleanup should handle, check for stale processes
- Fixture not found? → Verify fixture is defined in `conftest.py`

**Frontend Tests:**
- Cannot find module? → Run `npm install`
- MSW not mocking? → Check handler path matches request URL
- Jest config error? → Verify `jest.config.js` syntax

### Getting Help

1. **For testing guidance:** → Read `TESTING_GUIDE.md`
2. **For setup issues:** → Check `IMPLEMENTATION_SUMMARY.md`
3. **For implementation:** → Use `TESTING_CHECKLIST.md`
4. **For examples:** → Review example test files

### Documentation References

- pytest documentation: https://docs.pytest.org/
- Jest documentation: https://jestjs.io/
- React Testing Library: https://testing-library.com/
- MSW documentation: https://mswjs.io/

---

## 📈 Progress Tracking

Use `TESTING_CHECKLIST.md` to track:
- [x] Framework setup (DONE)
- [ ] Backend test implementation (IN PROGRESS)
- [ ] Frontend test implementation (IN PROGRESS)
- [ ] CI/CD validation (PENDING)
- [ ] Coverage goals (PENDING)

---

## ✅ Validation Checklist

Before starting implementation, verify:
- [ ] All files listed above exist in correct locations
- [ ] `conftest.py` imports successfully: `python -c "from conftest import *"`
- [ ] `pytest.ini` is valid
- [ ] `jest.config.js` is valid JavaScript
- [ ] `jest.setup.js` imports MSW correctly
- [ ] Example tests show correct patterns
- [ ] GitHub Actions workflow syntax is valid
- [ ] Documentation files are readable

---

**Created:** 2024
**Version:** 1.0
**Status:** ✅ Complete and Ready for Implementation

For questions or updates, refer to the comprehensive guides in the documentation section.
