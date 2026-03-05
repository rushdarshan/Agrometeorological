"""
SMS Gateway integration with Twilio.
Handles sending SMS messages to farmers with advisories.
"""

import os
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

# Lazy import - only load Twilio if credentials are configured
_twilio_client = None

def get_twilio_client():
    """Get or initialize Twilio client."""
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
        logger.info("✓ Twilio client initialized successfully")
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
    advisory_id: Optional[int] = None
) -> Dict:
    """
    Send SMS via Twilio.
    
    Args:
        phone_number: Farmer's phone number (E.164 format, e.g., +919876543210)
        message_text: Advisory message (auto-truncated to 160 chars)
        advisory_id: Reference to advisory for tracking
    
    Returns:
        Dict with 'success', 'message_sid', 'error' keys
    """
    
    sms_enabled = os.getenv("SMS_ENABLED", "False").lower() == "true"
    if not sms_enabled:
        logger.info(f"SMS disabled. Would send to {phone_number}: {message_text[:50]}...")
        return {
            "success": False,
            "message_sid": None,
            "error": "SMS disabled in configuration"
        }
    
    client = get_twilio_client()
    if not client:
        return {
            "success": False,
            "message_sid": None,
            "error": "Twilio client not initialized"
        }
    
    try:
        # Truncate message to SMS limit (160 chars for basic text, 70 for emoji-heavy)
        if len(message_text) > 160:
            message_text = message_text[:157] + "..."
        
        from_number = os.getenv("TWILIO_PHONE_NUMBER", "+1234567890")
        
        message = client.messages.create(
            body=message_text,
            from_=from_number,
            to=phone_number
        )
        
        logger.info(f"✓ SMS sent to {phone_number}. SID: {message.sid}")
        
        return {
            "success": True,
            "message_sid": message.sid,
            "status": message.status,
            "error": None
        }
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"✗ Failed to send SMS to {phone_number}: {error_msg}")
        
        return {
            "success": False,
            "message_sid": None,
            "error": error_msg
        }

def check_message_status(message_sid: str) -> Optional[str]:
    """
    Check delivery status of sent message.
    
    Args:
        message_sid: Twilio message SID
    
    Returns:
        Status string: 'queued', 'sending', 'sent', 'delivered', 'undelivered', etc.
    """
    
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
    Format phone number to E.164 format.
    Assumes Indian numbers if no country code provided.
    
    Examples:
        9876543210 → +919876543210
        +919876543210 → +919876543210
        919876543210 → +919876543210
    """
    
    # Remove any spaces, dashes, parentheses
    clean = ''.join(c for c in phone if c.isdigit())
    
    # If already has country code (starts with country digits)
    if clean.startswith('91') and len(clean) == 12:
        return f"+{clean}"
    
    # If just 10 digits (Indian mobile), add country code
    if len(clean) == 10:
        return f"+91{clean}"
    
    # If already has +, just validate length
    if phone.startswith('+'):
        if len(clean) >= 10:
            return f"+{clean}"
    
    # Fallback: add +91 if looks like Indian number
    if len(clean) == 10:
        return f"+91{clean}"
    
    return f"+{clean}" if not phone.startswith('+') else phone
