# backend/ml_service/monitoring.py

import psutil
import time
from datetime import datetime
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import Response
import logging

logger = logging.getLogger(__name__)

# Metrics
PREDICTIONS_TOTAL = Counter('predictions_total', 'Total predictions')
PREDICTIONS_ERRORS = Counter('predictions_errors', 'Total prediction errors')
PREDICTION_LATENCY = Histogram('prediction_latency_seconds', 'Prediction latency')
MODEL_LOADED = Gauge('model_loaded', 'Model loaded status')
MEMORY_USAGE = Gauge('memory_usage_mb', 'Memory usage in MB')
CPU_USAGE = Gauge('cpu_usage_percent', 'CPU usage percentage')

class MonitoringService:
    def __init__(self):
        self.start_time = time.time()
    
    def track_prediction(self, success=True):
        PREDICTIONS_TOTAL.inc()
        if not success:
            PREDICTIONS_ERRORS.inc()
    
    def track_latency(self, latency_seconds):
        PREDICTION_LATENCY.observe(latency_seconds)
    
    def update_system_metrics(self):
        try:
            from main import service
            MODEL_LOADED.set(1 if getattr(service, 'model', None) else 0)
        except Exception:
            MODEL_LOADED.set(0)
        MEMORY_USAGE.set(psutil.Process().memory_info().rss / 1024 / 1024)
        CPU_USAGE.set(psutil.cpu_percent())
    
    def get_metrics(self):
        self.update_system_metrics()
        return {
            'uptime_seconds': time.time() - self.start_time,
            'total_predictions': PREDICTIONS_TOTAL._value.get(),
            'error_rate': PREDICTIONS_ERRORS._value.get() / max(PREDICTIONS_TOTAL._value.get(), 1),
            'memory_mb': MEMORY_USAGE._value.get(),
            'cpu_percent': CPU_USAGE._value.get()
        }

monitor = MonitoringService()
