# backend/app/services/security.py

import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from flask import request, jsonify
import re

class SecurityService:
    """Security service for authentication and encryption"""
    
    @staticmethod
    def generate_secure_token(length=32):
        """Generate secure random token"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def hash_data(data):
        """Hash data using SHA-256"""
        return hashlib.sha256(data.encode()).hexdigest()
    
    @staticmethod
    def validate_password_strength(password):
        """Validate password strength"""
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
        return True, "Password is strong"
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def sanitize_input(data):
        """Sanitize user input to prevent XSS"""
        if isinstance(data, str):
            # Remove script tags
            data = re.sub(r'<script.*?</script>', '', data, flags=re.DOTALL)
            # Remove on* attributes
            data = re.sub(r' on\w+=.*?(?=>)', '', data)
            return data
        elif isinstance(data, dict):
            return {k: SecurityService.sanitize_input(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [SecurityService.sanitize_input(item) for item in data]
        return data

class RateLimitService:
    """Rate limiting with multiple strategies"""
    
    @staticmethod
    def check_rate_limit(key, limit=100, window=3600):
        """Check if rate limit is exceeded"""
        from app.extensions import redis_client
        
        if not redis_client:
            return True
        
        current = redis_client.get(key)
        if current is None:
            redis_client.setex(key, window, 1)
            return True
        
        count = int(current)
        if count >= limit:
            return False
        
        redis_client.incr(key)
        return True
    
    @staticmethod
    def get_rate_limit_status(key):
        """Get rate limit status"""
        from app.extensions import redis_client
        
        if not redis_client:
            return {'remaining': None, 'reset': None}
        
        count = redis_client.get(key)
        ttl = redis_client.ttl(key)
        
        return {
            'remaining': 100 - int(count) if count else 100,
            'reset': ttl if ttl > 0 else 0
        }