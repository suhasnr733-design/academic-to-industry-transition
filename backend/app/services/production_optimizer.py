# backend/app/services/production_optimizer.py

import time
from functools import wraps
from flask import request, jsonify
from app.extensions import redis_client
import logging

logger = logging.getLogger(__name__)

class ProductionOptimizer:
    def __init__(self):
        self.cache_ttl = 3600
        self.max_retries = 3
    
    def optimize_response(self, func):
        """Optimize API response with caching and compression"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"api:{request.path}:{request.args}"
            
            # Try cache
            if redis_client:
                cached = redis_client.get(cache_key)
                if cached:
                    return cached
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            if redis_client and result:
                redis_client.setex(cache_key, self.cache_ttl, result)
            
            return result
        return wrapper
    
    def with_retry(self, func):
        """Retry failed operations"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(self.max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == self.max_retries - 1:
                        raise
                    time.sleep(2 ** attempt)
            return None
        return wrapper

production_optimizer = ProductionOptimizer()