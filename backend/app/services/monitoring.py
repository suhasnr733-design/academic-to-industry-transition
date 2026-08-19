# backend/app/services/monitoring.py

import time
from functools import wraps
from flask import request, jsonify
from app.extensions import redis_client
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class APIMonitor:
    """API performance monitoring"""
    
    @staticmethod
    def track_request(func):
        """Track API request performance"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                
                # Store metrics
                APIMonitor._store_metrics(
                    endpoint=request.path,
                    method=request.method,
                    duration=duration,
                    status='success'
                )
                
                # Log slow requests
                if duration > 1000:  # > 1 second
                    logger.warning(f"Slow API: {request.path} - {duration:.2f}ms")
                
                return result
                
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                APIMonitor._store_metrics(
                    endpoint=request.path,
                    method=request.method,
                    duration=duration,
                    status='error',
                    error=str(e)
                )
                raise
        
        return wrapper
    
    @staticmethod
    def _store_metrics(endpoint: str, method: str, duration: float, 
                       status: str, error: str = None):
        """Store metrics in Redis"""
        if not redis_client:
            return
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M')
        key = f"metrics:{timestamp}:{endpoint}"
        
        metrics = {
            'endpoint': endpoint,
            'method': method,
            'duration': duration,
            'status': status,
            'timestamp': datetime.now().isoformat()
        }
        if error:
            metrics['error'] = error
        
        # Store in Redis list (keep last 1000)
        redis_client.lpush(key, json.dumps(metrics))
        redis_client.ltrim(key, 0, 999)
        
        # Increment counters
        redis_client.incr(f"counters:{endpoint}:{method}")
        redis_client.incr("total_requests")
        
        if status == 'error':
            redis_client.incr("total_errors")
    
    @staticmethod
    def get_metrics(endpoint: str = None, limit: int = 100):
        """Get API metrics"""
        if not redis_client:
            return {'error': 'Redis not available'}
        
        # Get recent metrics
        if endpoint:
            keys = redis_client.keys(f"metrics:*:{endpoint}")
        else:
            keys = redis_client.keys("metrics:*")
        
        metrics = []
        for key in keys[:limit]:
            items = redis_client.lrange(key, 0, -1)
            for item in items:
                metrics.append(json.loads(item))
        
        return {
            'total_requests': redis_client.get('total_requests') or 0,
            'total_errors': redis_client.get('total_errors') or 0,
            'recent_metrics': metrics
        }