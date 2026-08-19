# backend/app/services/advanced_cache.py

import redis
import json
import hashlib
from functools import wraps
from flask import request, current_app
import time
import pickle
import logging
from typing import Any, Callable, Dict

logger = logging.getLogger(__name__)

class AdvancedCache:
    """Advanced caching with Redis"""
    
    def __init__(self, redis_url='redis://localhost:6379/0'):
        self.redis = redis.from_url(redis_url)
        self.default_ttl = 3600  # 1 hour
    
    def get(self, key: str) -> Any:
        """Get value from cache"""
        try:
            value = self.redis.get(key)
            if value:
                return pickle.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache"""
        try:
            ttl = ttl or self.default_ttl
            self.redis.setex(key, ttl, pickle.dumps(value))
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear keys matching pattern"""
        try:
            keys = self.redis.keys(f"*{pattern}*")
            if keys:
                return self.redis.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache clear pattern error: {e}")
            return 0
    
    def get_or_set(self, key: str, func: Callable, ttl: int = None) -> Any:
        """Get from cache or execute function"""
        value = self.get(key)
        if value is not None:
            return value
        
        value = func()
        self.set(key, value, ttl)
        return value
    
    def cache_response(self, ttl: int = None, key_prefix: str = None,
                      vary_by_user: bool = False, vary_by_params: bool = True):
        """Decorator for caching API responses"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Build cache key
                key_parts = [key_prefix or func.__name__, request.path]
                
                if vary_by_user:
                    from flask_jwt_extended import get_jwt_identity
                    user_id = get_jwt_identity()
                    if user_id:
                        key_parts.append(f"user_{user_id}")
                
                if vary_by_params:
                    for key, value in sorted(request.args.items()):
                        key_parts.append(f"{key}={value}")
                
                cache_key = hashlib.md5(':'.join(key_parts).encode()).hexdigest()
                
                # Try cache
                cached = self.get(cache_key)
                if cached is not None:
                    return cached
                
                # Execute function
                result = func(*args, **kwargs)
                
                # Cache result
                if result and hasattr(result, 'status_code') and result.status_code < 400:
                    if hasattr(result, 'get_json'):
                        self.set(cache_key, result.get_json(), ttl)
                    else:
                        self.set(cache_key, result, ttl)
                
                return result
            return wrapper
        return decorator
    
    def cache_aggregate(self, ttl: int = 600, key_prefix: str = 'aggregate'):
        """Cache aggregate data"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                cache_key = f"{key_prefix}:{func.__name__}"
                
                # Try cache
                cached = self.get(cache_key)
                if cached is not None:
                    return cached
                
                # Execute function
                result = func(*args, **kwargs)
                
                # Cache result
                self.set(cache_key, result, ttl)
                return result
            return wrapper
        return decorator
    
    def invalidate_user_cache(self, user_id: int):
        """Invalidate all cache for a user"""
        return self.clear_pattern(f"user_{user_id}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            info = self.redis.info()
            return {
                'used_memory': info.get('used_memory_human', '0B'),
                'total_keys': len(self.redis.keys('*')),
                'hit_rate': info.get('keyspace_hits', 0) / max(1, info.get('keyspace_misses', 0) + info.get('keyspace_hits', 0)),
                'connected_clients': info.get('connected_clients', 0)
            }
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {'error': str(e)}