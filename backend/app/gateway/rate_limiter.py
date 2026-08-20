# backend/app/gateway/rate_limiter.py

import time
from flask import request, jsonify
from functools import wraps
from app.extensions import redis_client
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter for API Gateway"""
    
    def __init__(self):
        self.default_limits = {
            'ip': {'limit': 100, 'window': 60},
            'user': {'limit': 200, 'window': 60},
            'endpoint': {'limit': 500, 'window': 60}
        }
    
    def get_key(self, request, strategy='ip'):
        if strategy == 'ip':
            return f"ratelimit:ip:{request.remote_addr}"
        elif strategy == 'endpoint':
            return f"ratelimit:endpoint:{request.path}"
        return None
    
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
    
    def rate_limit(self, limit=100, window=60, strategy='ip'):
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                key = self.get_key(request, strategy)
                if not key:
                    return func(*args, **kwargs)
                
                allowed, info = self.check_rate_limit(key, limit, window)
                if not allowed:
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'message': 'Too many requests. Please try again later.'
                    }), 429
                
                return func(*args, **kwargs)
            return wrapper
        return decorator

rate_limiter = RateLimiter()