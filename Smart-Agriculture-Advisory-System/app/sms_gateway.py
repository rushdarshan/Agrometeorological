"""
SMS Gateway integration with Twilio.
Supports multilingual messages via app.translations.
"""

import os
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

_twilio_client = None


def get_twilio_client():
    """Get or initialize Twilio client (lazy load)."""
    global _twilio_client

    if _twilio_client is not None:
        return _twilio_client

    try:
        from twilio.rest import Client

        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")

        if not account_sid or not auth_token or account_sid == "demo":
            logger.warning("Twilio credentials not configured. SMS disabled.")
            return None

        _twilio_client = Client(account_sid, auth_token)
        logger.info("Twilio client initialized")
        return _twilio_client

    except ImportError:
        logger.error("Twilio library not installed. Run: pip install twilio")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Twilio: {e}")
        return None


def send_sms(
    phone_number: str,
    message_text: str,
    advisory_id: Optional[int] = None,
    language: str = "en"
) -> Dict:
    """
    Send SMS via Twilio.

    Args:
        phone_number: Farmer's phone in E.164 format (+91xxxxxxxxxx)
        message_text: Message content (auto-truncated to 160 chars)
        advisory_id: Reference to advisory for tracking
        language: Language code (for logging only; format_sms should be called before this)

    Returns:
        Dict with 'success', 'message_sid', 'error' keys
    """
    sms_enabled = os.getenv("SMS_ENABLED", "False").lower() == "true"
    if not sms_enabled:
        logger.info(f"SMS disabled. Would send to {phone_number}: {message_text[:60]}...")
        return {"success": False, "message_sid": None, "error": "SMS disabled in configuration"}

    client = get_twilio_client()
    if not client:
        return {"success": False, "message_sid": None, "error": "Twilio client not initialized"}

    try:
        if len(message_text) > 160:
            message_text = message_text[:157] + "..."

        from_number = os.getenv("TWILIO_PHONE_NUMBER", "+1234567890")
        
        try:
            formatted = format_phone_number(phone_number)
        except ValueError as ve:
            logger.error(f"E.164 Validation Failed for {phone_number}: {ve}")
            return {"success": False, "message_sid": None, "error": str(ve)}

        message = client.messages.create(
            body=message_text,
            from_=from_number,
            to=formatted
        )

        logger.info(f"SMS sent to {formatted}. SID: {message.sid}")
        return {"success": True, "message_sid": message.sid, "status": message.status, "error": None}

    except Exception as e:
        error_msg = str(e)
        logger.error(f"SMS send failed to {phone_number}: {error_msg}")
        return {"success": False, "message_sid": None, "error": error_msg}


def check_message_status(message_sid: str) -> Optional[str]:
    """Check delivery status of a sent message via Twilio."""
    client = get_twilio_client()
    if not client:
        return None
    try:
        message = client.messages(message_sid).fetch()
        return message.status
    except Exception as e:
        logger.error(f"Failed to check status for {message_sid}: {e}")
        return None


def format_phone_number(phone: str) -> str:
    """
    Format phone to E.164. Assumes Indian (+91) if no country code.
    Raises ValueError if the number is fundamentally invalid.

    Examples:
        9876543210       → +919876543210
        +919876543210    → +919876543210
        919876543210     → +919876543210
    """
    if not phone:
        raise ValueError("Phone number is empty")
        
    clean = ''.join(c for c in phone if c.isdigit())
    
    if len(clean) < 10 or len(clean) > 15:
        raise ValueError(f"Invalid phone number length: {len(clean)} digits")

    if clean.startswith('91') and len(clean) == 12:
        return f"+{clean}"
    if len(clean) == 10:
        return f"+91{clean}"
    if phone.startswith('+') and len(clean) >= 10:
        return f"+{clean}"
        
    return f"+91{clean}" if len(clean) == 10 else f"+{clean}"
