# backend/app/services/api_monitor.py

import time
import json
from datetime import datetime, timedelta
from collections import deque
from app.extensions import redis_client
import logging

logger = logging.getLogger(__name__)

class APIMonitor:
    def __init__(self):
        self.requests = deque(maxlen=10000)
        self.errors = deque(maxlen=1000)
        self.latencies = deque(maxlen=10000)
    
    def log_request(self, endpoint, method, status_code, duration):
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': endpoint,
            'method': method,
            'status': status_code,
            'duration': duration
        }
        
        self.requests.append(log_entry)
        
        if status_code >= 400:
            self.errors.append(log_entry)
        
        self.latencies.append(duration)
        
        # Store in Redis
        if redis_client:
            key = f"api_requests:{datetime.now().strftime('%Y%m%d')}"
            redis_client.lpush(key, json.dumps(log_entry))
            redis_client.ltrim(key, 0, 9999)
    
    def get_metrics(self, hours=24):
        cutoff = datetime.now() - timedelta(hours=hours)
        recent = [r for r in self.requests 
                 if datetime.fromisoformat(r['timestamp']) > cutoff]
        
        if not recent:
            return {'error': 'No recent requests'}
        
        total = len(recent)
        errors = sum(1 for r in recent if r['status'] >= 400)
        
        return {
            'total_requests': total,
            'error_count': errors,
            'success_rate': ((total - errors) / total) * 100 if total > 0 else 0,
            'avg_latency': sum(self.latencies) / len(self.latencies) if self.latencies else 0,
            'p95_latency': sorted(self.latencies)[int(len(self.latencies) * 0.95)] if self.latencies else 0,
            'period_hours': hours,
            'timestamp': datetime.now().isoformat()
        }

api_monitor = APIMonitor()