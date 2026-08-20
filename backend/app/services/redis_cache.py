# backend/app/services/redis_cache.py

import json
import hashlib
from functools import wraps
from flask import request, current_app
from app.extensions import redis_client
import logging

logger = logging.getLogger(__name__)

class RedisCache:
    """Redis caching service"""
    
    @staticmethod
    def get_cache_key(prefix, *args, **kwargs):
        key_string = f"{prefix}:{':'.join(str(arg) for arg in args)}"
        if kwargs:
            key_string += f":{':'.join(f'{k}={v}' for k, v in sorted(kwargs.items()))}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    @staticmethod
    def set(key, value, ttl=3600):
        if not redis_client:
            return False
        try:
            redis_client.setex(key, ttl, json.dumps(value))
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    @staticmethod
    def get(key):
        if not redis_client:
            return None
        try:
            value = redis_client.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    @staticmethod
    def delete(key):
        if not redis_client:
            return False
        try:
            redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    @staticmethod
    def clear_pattern(pattern):
        if not redis_client:
            return False
        try:
            keys = redis_client.keys(f"*{pattern}*")
            if keys:
                redis_client.delete(*keys)
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False

def cached_response(ttl=300, key_prefix=None):
    """Decorator for caching API responses"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = RedisCache.get_cache_key(
                key_prefix or func.__name__,
                request.path,
                **request.args.to_dict()
            )
            
            cached = RedisCache.get(cache_key)
            if cached:
                return cached
            
            result = func(*args, **kwargs)
            
            if result and hasattr(result, 'status_code') and result.status_code == 200:
                RedisCache.set(cache_key, result.get_json(), ttl)
            
            return result
        return wrapper
    return decorator