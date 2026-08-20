# backend/app/utils/validators.py

import re
from email_validator import validate_email, EmailNotValidError

class Validators:
    @staticmethod
    def validate_email(email):
        try:
            validate_email(email)
            return True
        except EmailNotValidError:
            return False
    
    @staticmethod
    def validate_password(password):
        if len(password) < 8:
            return False, "Password must be at least 8 characters"
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain uppercase letter"
        if not re.search(r'[a-z]', password):
            return False, "Password must contain lowercase letter"
        if not re.search(r'[0-9]', password):
            return False, "Password must contain number"
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain special character"
        return True, "Valid password"
    
    @staticmethod
    def sanitize_input(data):
        if isinstance(data, str):
            # Remove script tags
            data = re.sub(r'<script.*?</script>', '', data, flags=re.DOTALL)
            data = re.sub(r' on\w+=.*?(?=>)', '', data)
            return data
        elif isinstance(data, dict):
            return {k: Validators.sanitize_input(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [Validators.sanitize_input(item) for item in data]
        return data