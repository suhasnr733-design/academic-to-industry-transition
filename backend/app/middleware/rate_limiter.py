# backend/app/middleware/rate_limiter.py

from flask import request, jsonify
from functools import wraps
from app.extensions import redis_client
import time

class RateLimiter:
    """Rate limiting middleware"""
    
    def __init__(self, limit=100, window=60):
        self.limit = limit
        self.window = window
    
    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not redis_client:
                return func(*args, **kwargs)
            
            client_id = request.headers.get('X-Forwarded-For', request.remote_addr)
            key = f"ratelimit:{client_id}:{func.__name__}"
            
            current = redis_client.get(key)
            if current is None:
                redis_client.setex(key, self.window, 1)
                return func(*args, **kwargs)
            
            count = int(current)
            if count >= self.limit:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Please wait {self.window} seconds',
                    'limit': self.limit,
                    'window': self.window
                }), 429
            
            redis_client.incr(key)
            return func(*args, **kwargs)
        return wrapper

def rate_limit(limit=100, window=60):
    return RateLimiter(limit=limit, window=window)