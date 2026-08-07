import json
import hashlib
import logging
from functools import wraps

from flask import current_app, request
from app.extensions import redis_client

logger = logging.getLogger(__name__)


class CacheService:
    """Redis caching service"""

    @staticmethod
    def get_cache_key(prefix: str, *args, **kwargs) -> str:
        """Generate cache key"""
        key_string = f"{prefix}:{':'.join(str(arg) for arg in args)}"
        if kwargs:
            key_string += ":" + ":".join(
                f"{k}={v}" for k, v in sorted(kwargs.items())
            )
        return hashlib.md5(key_string.encode()).hexdigest()

    @staticmethod
    def set(key: str, value, expire: int = 3600) -> bool:
        """Set cache value"""
        if not redis_client:
            logger.warning("Redis not available")
            return False
        try:
            redis_client.set(key, json.dumps(value), ex=expire)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False

    @staticmethod
    def get(key: str):
        """Get cache value"""
        if not redis_client:
            return None
        try:
            value = redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    @staticmethod
    def delete(key: str) -> bool:
        """Delete cache key"""
        if not redis_client:
            return False
        try:
            redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    @staticmethod
    def cache_prediction(resume_id, prediction, expire=3600):
        """Cache prediction result"""
        key = CacheService.get_cache_key("prediction", resume_id)
        return CacheService.set(key, prediction, expire)

    @staticmethod
    def get_cached_prediction(resume_id):
        """Get cached prediction"""
        key = CacheService.get_cache_key("prediction", resume_id)
        return CacheService.get(key)

    @staticmethod
    def clear_pattern(pattern: str) -> bool:
        """Clear cache keys matching pattern"""
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

    @staticmethod
    def get_or_set(key: str, func, expire: int = 3600):
        """Get from cache or execute function and cache"""
        cached = CacheService.get(key)
        if cached is not None:
            return cached

        result = func()
        CacheService.set(key, result, expire)
        return result


def cached_response(ttl: int = 300, key_prefix: str = None):
    """Decorator to cache API responses"""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = CacheService.get_cache_key(
                key_prefix or func.__name__,
                request.path,
                **request.args.to_dict()
            )

            cached = CacheService.get(cache_key)
            if cached:
                return cached

            result = func(*args, **kwargs)

            if (
                result
                and hasattr(result, "status_code")
                and result.status_code == 200
            ):
                CacheService.set(cache_key, result.get_json(), ttl)

            return result

        return wrapper

    return decorator