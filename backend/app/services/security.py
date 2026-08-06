# backend/app/services/security.py

import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from flask import request, jsonify
import re
import bcrypt
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)

class SecurityService:
    """Advanced security service"""
    
    # Password policies
    MIN_PASSWORD_LENGTH = 8
    MAX_PASSWORD_LENGTH = 128
    PASSWORD_COMPLEXITY = {
        'uppercase': True,
        'lowercase': True,
        'digits': True,
        'special': True
    }
    
    @staticmethod
    def generate_secure_token(length=32) -> str:
        """Generate secure random token"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode(), hashed.encode())
    
    @staticmethod
    def validate_password_strength(password: str) -> Tuple[bool, str]:
        """Validate password strength"""
        if len(password) < SecurityService.MIN_PASSWORD_LENGTH:
            return False, f"Password must be at least {SecurityService.MIN_PASSWORD_LENGTH} characters"
        if len(password) > SecurityService.MAX_PASSWORD_LENGTH:
            return False, f"Password must be less than {SecurityService.MAX_PASSWORD_LENGTH} characters"
        if SecurityService.PASSWORD_COMPLEXITY['uppercase'] and not re.search(r'[A-Z]', password):
            return False, "Password must contain uppercase letter"
        if SecurityService.PASSWORD_COMPLEXITY['lowercase'] and not re.search(r'[a-z]', password):
            return False, "Password must contain lowercase letter"
        if SecurityService.PASSWORD_COMPLEXITY['digits'] and not re.search(r'[0-9]', password):
            return False, "Password must contain number"
        if SecurityService.PASSWORD_COMPLEXITY['special'] and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain special character"
        return True, "Password is strong"
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def sanitize_input(data: Any) -> Any:
        """Sanitize user input to prevent XSS"""
        if isinstance(data, str):
            # Remove script tags
            data = re.sub(r'<script.*?</script>', '', data, flags=re.DOTALL)
            # Remove on* attributes
            data = re.sub(r' on\w+=.*?(?=>)', '', data)
            # Remove javascript: URLs
            data = re.sub(r'javascript:[^"]*', '', data)
            return data
        elif isinstance(data, dict):
            return {k: SecurityService.sanitize_input(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [SecurityService.sanitize_input(item) for item in data]
        return data
    
    @staticmethod
    def generate_jwt(user_id: int, expires_in: int = 3600) -> str:
        """Generate JWT token"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in)
        }
        return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    @staticmethod
    def decode_jwt(token: str) -> Dict[str, Any]:
        """Decode JWT token"""
        try:
            return jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return {'error': 'Token expired'}
        except jwt.InvalidTokenError:
            return {'error': 'Invalid token'}
    
    @staticmethod
    def generate_otp(length=6) -> str:
        """Generate OTP"""
        import random
        return ''.join(str(random.randint(0, 9)) for _ in range(length))

class RateLimitService:
    """Rate limiting service"""
    
    @staticmethod
    def check_rate_limit(key: str, limit: int = 100, window: int = 3600) -> Tuple[bool, Dict]:
        """Check if rate limit is exceeded"""
        from app.extensions import redis_client
        
        if not redis_client:
            return True, {'remaining': None, 'reset': None}
        
        current = redis_client.get(key)
        if current is None:
            redis_client.setex(key, window, 1)
            return True, {'remaining': limit - 1, 'reset': window}
        
        count = int(current)
        if count >= limit:
            ttl = redis_client.ttl(key)
            return False, {'remaining': 0, 'reset': ttl}
        
        redis_client.incr(key)
        return True, {'remaining': limit - count - 1, 'reset': redis_client.ttl(key)}
    
    @staticmethod
    def get_rate_limit_headers(remaining: int, reset: int) -> Dict[str, str]:
        """Get rate limit headers"""
        return {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': str(remaining),
            'X-RateLimit-Reset': str(reset)
        }
    
    @staticmethod
    def ip_rate_limit(limit: int = 100, window: int = 60):
        """Decorator for IP-based rate limiting"""
        def decorator(func):
            from functools import wraps
            @wraps(func)
            def wrapper(*args, **kwargs):
                ip = request.headers.get('X-Forwarded-For', request.remote_addr)
                key = f"ratelimit:ip:{ip}:{func.__name__}"
                
                allowed, info = RateLimitService.check_rate_limit(key, limit, window)
                if not allowed:
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'message': f'Please wait {info["reset"]} seconds'
                    }), 429
                
                return func(*args, **kwargs)
            return wrapper
        return decorator
    
    @staticmethod
    def user_rate_limit(limit: int = 200, window: int = 3600):
        """Decorator for user-based rate limiting"""
        def decorator(func):
            from functools import wraps
            @wraps(func)
            def wrapper(*args, **kwargs):
                from flask_jwt_extended import get_jwt_identity
                user_id = get_jwt_identity()
                if not user_id:
                    return func(*args, **kwargs)
                
                key = f"ratelimit:user:{user_id}:{func.__name__}"
                allowed, info = RateLimitService.check_rate_limit(key, limit, window)
                if not allowed:
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'message': f'Please wait {info["reset"]} seconds'
                    }), 429
                
                return func(*args, **kwargs)
            return wrapper
        return decorator