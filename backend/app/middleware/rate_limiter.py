# backend/app/middleware/rate_limiter.py

import time
from functools import wraps
from flask import request, jsonify
from app.extensions import redis_client
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """Advanced rate limiting middleware"""
    
    def __init__(self):
        self.default_limits = {
            'public': {'limit': 100, 'window': 60},
            'authenticated': {'limit': 200, 'window': 60},
            'admin': {'limit': 500, 'window': 60}
        }
    
    def get_key(self, user_id=None):
        """Generate rate limit key"""
        if user_id:
            return f"ratelimit:user:{user_id}"
        return f"ratelimit:ip:{request.remote_addr}"
    
    def check_rate_limit(self, key, limit, window):
        if not redis_client:
            return True, {}
        
        current = redis_client.get(key)
        if current is None:
            redis_client.setex(key, window, 1)
            return True, {'remaining': limit - 1}
        
        count = int(current)
        if count >= limit:
            return False, {'remaining': 0}
        
        redis_client.incr(key)
        return True, {'remaining': limit - count - 1}
    
    def rate_limit(self, limit=None, window=None, user_scope=False):
        """Rate limit decorator"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                from flask_jwt_extended import get_jwt_identity
                user_id = get_jwt_identity() if user_scope else None
                
                key = self.get_key(user_id)
                limit = limit or self.default_limits['authenticated']['limit']
                window = window or self.default_limits['authenticated']['window']
                
                allowed, info = self.check_rate_limit(key, limit, window)
                if not allowed:
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'message': 'Too many requests. Please try again later.',
                        'limit': limit,
                        'window': window
                    }), 429
                
                return func(*args, **kwargs)
            return wrapper
        return decorator

rate_limiter = RateLimiter()