import secrets
import hashlib
from datetime import datetime, timedelta

def generate_email_token():
    """Generate a secure email verification token."""
    return secrets.token_urlsafe(32)

def hash_token(token):
    """Hash a token for storage (currently just returning as-is for dev)."""
    return token

def verify_token(stored_token, provided_token):
    """Verify if provided token matches stored token."""
    return stored_token == provided_token
