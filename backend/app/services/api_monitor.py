# backend/app/services/api_monitor.py

import time
from functools import wraps
from flask import request, jsonify
from app.extensions import redis_client
import json
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class APIMonitor:
    """API performance monitoring"""
    
    @staticmethod
    def track_performance(func):
        """Track API performance metrics"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                
                # Store metrics
                APIMonitor._store_metric(
                    endpoint=request.path,
                    method=request.method,
                    duration=duration,
                    status='success'
                )
                
                # Log slow requests
                if duration > 1000:
                    logger.warning(f"Slow API: {request.path} - {duration:.2f}ms")
                
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                APIMonitor._store_metric(
                    endpoint=request.path,
                    method=request.method,
                    duration=duration,
                    status='error',
                    error=str(e)
                )
                raise
        return wrapper
    
    @staticmethod
    def _store_metric(endpoint, method, duration, status, error=None):
        """Store API metric in Redis"""
        if not redis_client:
            return
        
        timestamp = datetime.now().strftime('%Y%m%d')
        key = f"api_metrics:{timestamp}"
        
        metric = {
            'endpoint': endpoint,
            'method': method,
            'duration': duration,
            'status': status,
            'timestamp': datetime.now().isoformat()
        }
        if error:
            metric['error'] = error
        
        redis_client.lpush(key, json.dumps(metric))
        redis_client.ltrim(key, 0, 9999)
    
    @staticmethod
    def get_metrics(days=7):
        """Get API metrics for last N days"""
        if not redis_client:
            return {'error': 'Redis not available'}
        
        metrics = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y%m%d')
            key = f"api_metrics:{date}"
            items = redis_client.lrange(key, 0, -1)
            for item in items:
                metrics.append(json.loads(item))
        
        return metrics
    
    @staticmethod
    def get_summary(days=7):
        """Get API metrics summary"""
        metrics = APIMonitor.get_metrics(days)
        
        if not metrics:
            return {'error': 'No metrics available'}
        
        total_requests = len(metrics)
        success_requests = sum(1 for m in metrics if m.get('status') == 'success')
        error_requests = total_requests - success_requests
        
        durations = [m.get('duration', 0) for m in metrics if m.get('duration')]
        
        return {
            'total_requests': total_requests,
            'success_rate': (success_requests / total_requests * 100) if total_requests > 0 else 0,
            'error_count': error_requests,
            'avg_response_time': sum(durations) / len(durations) if durations else 0,
            'min_response_time': min(durations) if durations else 0,
            'max_response_time': max(durations) if durations else 0,
            'p95_response_time': sorted(durations)[int(len(durations) * 0.95)] if durations else 0
        }