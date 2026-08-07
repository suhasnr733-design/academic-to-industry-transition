# backend/app/ml_models/model_monitor.py

import time
import psutil
import os
import json
from datetime import datetime

class ModelMonitor:
    """Monitor model performance and system metrics"""
    
    def __init__(self, log_file='logs/model_metrics.json'):
        self.log_file = log_file
        self.metrics = []
    
    def record_metric(self, model_name, response_time, accuracy=None):
        """Record a metric"""
        metric = {
            'timestamp': datetime.now().isoformat(),
            'model': model_name,
            'response_time_ms': response_time,
            'accuracy': accuracy,
            'memory_usage_mb': psutil.Process(os.getpid()).memory_info().rss / 1024 / 1024,
            'cpu_percent': psutil.cpu_percent()
        }
        self.metrics.append(metric)
        
        if len(self.metrics) > 1000:
            self.save_metrics()
            self.metrics = []
    
    def save_metrics(self):
        """Save metrics to file"""
        if self.metrics:
            with open(self.log_file, 'a') as f:
                for metric in self.metrics:
                    f.write(json.dumps(metric) + '\n')
    
    def get_performance_report(self):
        """Generate performance report"""
        if not os.path.exists(self.log_file):
            return {'error': 'No metrics available'}
        
        with open(self.log_file, 'r') as f:
            lines = f.readlines()
        
        if not lines:
            return {'error': 'Empty metrics file'}
        
        metrics = [json.loads(line) for line in lines[-100:]]
        
        avg_response_time = sum(m['response_time_ms'] for m in metrics) / len(metrics)
        
        return {
            'total_requests': len(metrics),
            'avg_response_time_ms': avg_response_time,
            'avg_memory_usage_mb': sum(m['memory_usage_mb'] for m in metrics) / len(metrics),
            'avg_cpu_percent': sum(m['cpu_percent'] for m in metrics) / len(metrics)
        }