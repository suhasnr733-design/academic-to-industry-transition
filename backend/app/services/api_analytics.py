# backend/app/services/api_analytics.py

import json
from datetime import datetime, timedelta
from collections import Counter
from app.extensions import redis_client

class APIAnalytics:
    """API analytics service"""
    
    @staticmethod
    def track_request(endpoint, method, status_code, duration):
        if not redis_client:
            return
        
        key = f"api_analytics:{datetime.now().strftime('%Y%m%d')}"
        data = {
            'endpoint': endpoint,
            'method': method,
            'status': status_code,
            'duration': duration,
            'timestamp': datetime.now().isoformat()
        }
        redis_client.lpush(key, json.dumps(data))
        redis_client.ltrim(key, 0, 9999)
    
    @staticmethod
    def get_analytics(days=7):
        if not redis_client:
            return {'error': 'Redis not available'}
        
        all_data = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y%m%d')
            key = f"api_analytics:{date}"
            items = redis_client.lrange(key, 0, -1)
            for item in items:
                all_data.append(json.loads(item))
        
        if not all_data:
            return {'error': 'No data available'}
        
        total = len(all_data)
        statuses = Counter(item['status'] for item in all_data)
        endpoints = Counter(item['endpoint'] for item in all_data)
        durations = [item['duration'] for item in all_data]
        
        return {
            'total_requests': total,
            'status_distribution': dict(statuses),
            'top_endpoints': dict(endpoints.most_common(10)),
            'avg_response_time': sum(durations) / len(durations) if durations else 0,
            'p95_response_time': sorted(durations)[int(len(durations) * 0.95)] if durations else 0,
            'period': f'last_{days}_days'
        }