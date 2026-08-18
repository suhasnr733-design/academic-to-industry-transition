# backend/app/services/multilevel_cache.py

import json
import hashlib
import time
from functools import wraps
from flask import request
from app.extensions import redis_client
import logging

logger = logging.getLogger(__name__)

class MultiLevelCache:
    def __init__(self):
        self.memory_cache = {}
        self.memory_ttl = {}
    
    def get(self, key):
        if key in self.memory_cache:
            if self.memory_ttl.get(key, 0) > time.time():
                return self.memory_cache[key]
            else:
                del self.memory_cache[key]
                del self.memory_ttl[key]
        
        if redis_client:
            try:
                value = redis_client.get(key)
                if value:
                    data = json.loads(value)
                    self.memory_cache[key] = data
                    self.memory_ttl[key] = time.time() + 300
                    return data
            except:
                pass
        return None
    
    def set(self, key, value, ttl=3600):
        self.memory_cache[key] = value
        self.memory_ttl[key] = time.time() + min(300, ttl)
        if redis_client:
            try:
                redis_client.setex(key, ttl, json.dumps(value))
            except:
                pass
    
    def delete(self, key):
        if key in self.memory_cache:
            del self.memory_cache[key]
            del self.memory_ttl[key]
        if redis_client:
            try:
                redis_client.delete(key)
            except:
                pass
    
    def cache(self, ttl=3600, key_prefix=None):
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                key_parts = [key_prefix or func.__name__]
                if request:
                    key_parts.append(request.path)
                    for k, v in sorted(request.args.items()):
                        key_parts.append(f"{k}={v}")
                
                cache_key = hashlib.md5(':'.join(key_parts).encode()).hexdigest()
                cached = self.get(cache_key)
                if cached is not None:
                    return cached
                
                result = func(*args, **kwargs)
                self.set(cache_key, result, ttl)
                return result
            return wrapper
        return decorator

cache = MultiLevelCache()