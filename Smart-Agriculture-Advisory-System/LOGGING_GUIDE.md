# Error Handling & Logging Quick Reference

## For Developers Working on This Project

### Using the Logger

**Import the logger in any module:**
```python
from app.logging_config import get_logger
logger = get_logger(__name__)
```

### Logging Patterns

**Success Operations:**
```python
logger.info(f"User {user_id} logged in successfully")
logger.debug(f"Database query executed for table {table_name}")
```

**Warnings (non-critical issues):**
```python
logger.warning(f"Weather API took {duration}ms to respond")
logger.warning(f"Farmer {farmer_id} opted out of SMS")
```

**Errors (always include exc_info=True for stack traces):**
```python
try:
    result = fetch_weather_data(lat, lon)
except Exception as e:
    logger.error(f"Failed to fetch weather: {str(e)}", exc_info=True)
    raise  # Re-raise or handle gracefully
```

### Error Handling Patterns

**Pattern 1: Log and Re-raise (for caller to handle)**
```python
try:
    critical_operation()
except SpecificException as e:
    logger.error(f"Critical operation failed: {str(e)}", exc_info=True)
    raise  # Caller will see the error
```

**Pattern 2: Log and Handle Gracefully (for resilience)**
```python
try:
    advisory_data = evaluate_conditions(farm_data)
except Exception as e:
    logger.error(f"Advisory evaluation failed: {str(e)}", exc_info=True)
    # Return partial data instead of failing completely
    advisory_data = get_default_advisory()
```

**Pattern 3: Log and Continue (for batch operations)**
```python
errors = []
for farm in farms:
    try:
        process_farm(farm)
    except Exception as e:
        logger.error(f"Failed to process farm {farm.id}: {str(e)}", exc_info=True)
        errors.append({"farm_id": farm.id, "error": str(e)})
        continue  # Process next farm anyway

return {"success_count": len(farms) - len(errors), "errors": errors}
```

**Pattern 4: Log and Fall Back (for graceful degradation)**
```python
try:
    result = celery_task.delay(farmer_id, message)
    logger.info(f"Queued async SMS for farmer {farmer_id}")
except Exception as e:
    logger.warning(f"Celery unavailable, using sync SMS: {str(e)}")
    # Fall back to synchronous sending
    result = send_sms_sync(farmer_id, message)
```

### Logging Levels

| Level | Usage | Example |
|-------|-------|---------|
| **DEBUG** | Detailed diagnostic info | "Query execution started for table X" |
| **INFO** | General flow and milestones | "Advisory generated for farm 42" |
| **WARNING** | Unexpected but recoverable | "SMS delivery retrying after failure" |
| **ERROR** | Error that needs attention | "Database connection failed" |
| **CRITICAL** | System-level failures | (rarely used in this project) |

### Celery Task Logging

**Structure for long-running tasks:**
```python
@celery_app.task(bind=True, max_retries=3)
def my_task(self, param1, param2):
    """Task with proper logging."""
    try:
        logger.info(f"Task starting with params: {param1}, {param2}")
        
        # Step 1
        result1 = do_step_1(param1)
        logger.debug(f"Step 1 complete: {result1}")
        
        # Step 2
        result2 = do_step_2(result1)
        logger.debug(f"Step 2 complete: {result2}")
        
        logger.info(f"Task completed successfully")
        return result2
        
    except SomeError as e:
        logger.warning(f"Retriable error: {str(e)}")
        raise self.retry(exc=e, countdown=60)
    except Exception as e:
        logger.error(f"Unexpected error in task: {str(e)}", exc_info=True)
        raise
```

### Request/Response Logging

**Automatic:** All endpoints automatically logged via middleware
```json
// Request
{"timestamp": "2026-03-27T12:00:00", "level": "DEBUG", "message": "Incoming request: POST /api/advisories/generate/42"}

// Response
{"timestamp": "2026-03-27T12:00:05", "level": "INFO", "message": "Request completed: POST /api/advisories/generate/42 status=200 duration=5.123s"}
```

**Add request ID to logs for tracing:**
```python
from starlette.requests import Request

@router.get("/data")
async def get_data(request: Request):
    request_id = request.scope.get("request_id", "unknown")
    logger.info(f"Processing request {request_id}")
    # ... rest of handler
```

### Debugging Failed Requests

1. **Find the request in logs by status code:**
   ```
   grep '"status_code":500' app.log
   ```

2. **Use the error_id from the response:**
   ```json
   {"detail": "Internal server error", "error_id": "abc-123-def"}
   ```

3. **Find detailed error in logs:**
   ```
   grep "abc-123-def" app.log  # Shows full error context
   ```

### Common Mistakes to Avoid

❌ **DON'T: Swallow exceptions silently**
```python
try:
    risky_operation()
except:  # ❌ BAD - exception is lost
    pass
```

❌ **DON'T: Log without context**
```python
except Exception as e:
    logger.error("Error occurred")  # ❌ Doesn't help debugging
```

❌ **DON'T: Miss stack traces**
```python
except Exception as e:
    logger.error(f"Error: {str(e)}")  # ❌ No stack trace
```

✅ **DO: Always log with context and stack trace**
```python
except Exception as e:
    logger.error(f"Failed to process farm {farm_id}: {str(e)}", exc_info=True)
```

✅ **DO: Log at appropriate levels**
```python
logger.debug("Detailed diagnostic")      # Development/debugging
logger.info("User action completed")     # Normal operation
logger.warning("Unexpected but OK")      # Investigate trends
logger.error("Action failed")            # Immediate attention
```

### Performance Considerations

- **DEBUG logs are verbose** - Disable in production (`LOG_LEVEL=INFO`)
- **exc_info=True adds overhead** - Use only for actual errors
- **JSON formatting is slower** - But enables structured parsing
- **File logging** - Configure rotation to manage disk space

### Environment Setup

```bash
# Development (verbose logging)
export LOG_LEVEL=DEBUG
export LOG_FORMAT=json
export LOG_FILE=app.log

# Production (important logs only)
export LOG_LEVEL=INFO
export LOG_FORMAT=json
export LOG_FILE=/var/log/agriculture.log

# Testing (minimal logging)
export LOG_LEVEL=WARNING
```

### Integration with Log Aggregation

**For ELK Stack, Splunk, DataDog, etc:**
- JSON format ensures easy parsing
- `error_id` field for correlation
- `X-Request-ID` header for distributed tracing
- Structured fields for filtering and searching

**Sample search queries:**
```
# Find all errors for a farm
level:ERROR message:"farm 42"

# Find slow requests
duration > 5000

# Find SMS failures
message:"SMS" AND level:ERROR

# Find failed advisory generation
message:"advisory" AND level:ERROR
```

## Quick Checklist for Code Reviews

- [ ] All exceptions are caught (no `except: pass`)
- [ ] All exceptions are logged with `exc_info=True`
- [ ] Logging includes context (IDs, inputs, states)
- [ ] Error messages are user-friendly and actionable
- [ ] Celery tasks have retry logic with backoff
- [ ] Database errors are logged
- [ ] External API errors are logged
- [ ] Graceful degradation where appropriate
- [ ] No sensitive data in logs (passwords, tokens, etc.)
- [ ] Response includes error_id for client debugging

## Troubleshooting

**Q: Where are logs stored?**
A: By default, logs output to console (stdout). Set `LOG_FILE=/path/to/file.log` for file output.

**Q: How do I see full stack traces?**
A: Ensure `exc_info=True` is used in logger.error() calls. Stack traces appear after the main error message.

**Q: How do I trace a request through the system?**
A: Look for the `X-Request-ID` header in responses. Use this UUID to grep all logs for that request.

**Q: My logs are too verbose**
A: Set `LOG_LEVEL=WARNING` in production to reduce noise.

**Q: How do I add custom context to logs?**
A: Use LoggerAdapter's `with_context()` method:
```python
logger = get_logger(__name__)
logger_with_user = logger.with_context(user_id=42, session_id="abc123")
logger_with_user.info("User action")
```
