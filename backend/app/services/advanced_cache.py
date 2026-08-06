# backend/app/services/advanced_cache.py

import redis
import json
import hashlib
from functools import wraps
from flask import request, current_app
from app.extensions import redis_client
import logging

logger = logging.getLogger(__name__)

class AdvancedCache:
    """Advanced caching with multiple strategies"""
    
    @staticmethod
    def cache_response(ttl=300, key_prefix=None, vary_by_user=False):
        """Cache API responses with variations"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if not redis_client:
                    return func(*args, **kwargs)
                
                # Build cache key
                key_parts = [key_prefix or func.__name__, request.path]
                
                if vary_by_user:
                    from flask_jwt_extended import get_jwt_identity
                    user_id = get_jwt_identity()
                    if user_id:
                        key_parts.append(f"user_{user_id}")
                
                # Add query params to key
                for key, value in sorted(request.args.items()):
                    key_parts.append(f"{key}={value}")
                
                cache_key = hashlib.md5(':'.join(key_parts).encode()).hexdigest()
                
                # Try to get from cache
                cached = redis_client.get(cache_key)
                if cached:
                    return json.loads(cached)
                
                # Execute function
                result = func(*args, **kwargs)
                
                # Cache result
                if result and hasattr(result, 'status_code') and result.status_code < 400:
                    redis_client.setex(cache_key, ttl, json.dumps(result.get_json()))
                
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def invalidate_pattern(pattern):
        """Invalidate all cache keys matching pattern"""
        if not redis_client:
            return
        try:
            keys = redis_client.keys(f"*{pattern}*")
            if keys:
                redis_client.delete(*keys)
        except Exception as e:
            logger.error(f"Cache invalidation error: {e}")
    
    @staticmethod
    def cache_aggregate(ttl=600, key_prefix='aggregate'):
        """Cache aggregate data with TTL"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if not redis_client:
                    return func(*args, **kwargs)
                
                cache_key = f"{key_prefix}:{func.__name__}"
                cached = redis_client.get(cache_key)
                
                if cached:
                    return json.loads(cached)
                
                result = func(*args, **kwargs)
                redis_client.setex(cache_key, ttl, json.dumps(result))
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def cache_warmup(func, *args, **kwargs):
        """Warm up cache with data"""
        cache_key = f"warmup:{func.__name__}"
        if not redis_client:
            return
        
        try:
            data = func(*args, **kwargs)
            redis_client.setex(cache_key, 3600, json.dumps(data))
            logger.info(f"Cache warmed up for {func.__name__}")
        except Exception as e:
            logger.error(f"Cache warmup error: {e}")

# Usage example
@AdvancedCache.cache_response(ttl=600, key_prefix='jobs', vary_by_user=True)
def get_cached_jobs():
    # Function implementation
    pass