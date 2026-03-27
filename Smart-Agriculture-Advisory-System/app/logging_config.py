"""
Structured logging configuration for the Smart Agriculture Advisory System.
Uses Python's built-in logging module with JSON formatter for better observability.
"""

import logging
import logging.handlers
import json
from typing import Any
from datetime import datetime
import sys
import os


class JSONFormatter(logging.Formatter):
    """Custom formatter that outputs structured JSON logs."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'extra_fields') and record.extra_fields:
            log_obj.update(record.extra_fields)
        
        return json.dumps(log_obj)


def configure_logging(
    log_level: str = "INFO",
    log_file: str = None,
    use_json: bool = True
) -> None:
    """
    Configure root logger with file and console handlers.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file path for log output
        use_json: If True, use JSON formatting; else use standard format
    """
    # Get or create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Choose formatter
    if use_json:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    # Console handler (always add)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (optional)
    if log_file:
        try:
            # Ensure log directory exists
            log_dir = os.path.dirname(log_file)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir, exist_ok=True)
            
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=10 * 1024 * 1024,  # 10 MB
                backupCount=5
            )
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)
        except Exception as e:
            root_logger.warning(f"Could not configure file logging: {e}")


def get_logger(name: str) -> logging.LoggerAdapter:
    """
    Get a logger instance with the given name.
    Returns a LoggerAdapter for easier use of extra fields.
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        logging.LoggerAdapter instance
    """
    logger = logging.getLogger(name)
    return LoggerAdapter(logger)


class LoggerAdapter(logging.LoggerAdapter):
    """
    Custom adapter for structured logging with extra fields.
    Allows passing context-specific information easily.
    """
    
    def __init__(self, logger: logging.Logger, extra: dict = None):
        """Initialize adapter with optional extra fields."""
        super().__init__(logger, extra or {})
    
    def process(self, msg: str, kwargs: dict) -> tuple:
        """Add extra fields to all log messages."""
        if self.extra:
            kwargs['extra'] = {
                'extra_fields': self.extra.copy()
            }
            if 'extra' in kwargs:
                kwargs['extra'].get('extra_fields', {}).update(kwargs['extra'])
        return msg, kwargs
    
    def with_context(self, **context) -> 'LoggerAdapter':
        """Create a new adapter with additional context."""
        new_extra = self.extra.copy() if self.extra else {}
        new_extra.update(context)
        return LoggerAdapter(self.logger, new_extra)


# Initialize logging when module is imported
_log_level = os.getenv("LOG_LEVEL", "INFO")
_log_file = os.getenv("LOG_FILE", None)
_use_json = os.getenv("LOG_FORMAT", "json").lower() == "json"

configure_logging(
    log_level=_log_level,
    log_file=_log_file,
    use_json=_use_json
)
