import re
from app.exceptions.auth_errors import ValidationError

def validate_email(email: str):
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        raise ValidationError("Invalid email")

def validate_username(username: str):
    if len(username) < 3 or len(username) > 20:
        raise ValidationError("Username must be 3-20 characters")

def validate_password(password: str):
    if len(password) < 4:
        raise ValidationError("Password must be at least 4 characters")

def validate_message_text(text: str):
    if not text or len(text) > 500:
        raise ValidationError("Message text must be between 1 and 500 characters")
