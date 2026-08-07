import time
from functools import wraps
from flask import request, jsonify
from app.extensions import redis_client
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiting service using Redis"""
    
    def __init__(self, limit: int = 100, window: int = 3600):
        self.limit = limit
        self.window = window
    
    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not redis_client:
                logger.warning("Redis not available, rate limiting disabled")
                return func(*args, **kwargs)
            
            # Get client identifier
            client_id = request.headers.get('X-Forwarded-For', request.remote_addr)
            if 'Authorization' in request.headers:
                client_id = f"{client_id}:{request.headers.get('Authorization')[:20]}"
            
            key = f"ratelimit:{client_id}:{func.__name__}"
            
            # Get current count
            current = redis_client.get(key)
            if current is None:
                # First request
                redis_client.set(key, 1, ex=self.window)
                return func(*args, **kwargs)
            
            count = int(current)
            if count >= self.limit:
                ttl = redis_client.ttl(key)
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Please wait {ttl} seconds',
                    'limit': self.limit,
                    'window': self.window,
                    'retry_after': ttl
                }), 429
            
            # Increment count
            redis_client.incr(key)
            return func(*args, **kwargs)
        
        return wrapper

def rate_limit(limit: int = 100, window: int = 3600):
    """Rate limit decorator"""
    return RateLimiter(limit=limit, window=window)

# Different rate limits for different endpoints
public_rate_limit = rate_limit(limit=50, window=60)  # 50 requests per minute
auth_rate_limit = rate_limit(limit=10, window=60)    # 10 login attempts per minute
api_rate_limit = rate_limit(limit=100, window=60)    # 100 API calls per minute