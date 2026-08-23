# backend/app/middleware/logging.py

import time
import json
from flask import request
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class RequestLogger:
    """Request logging middleware"""
    
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        start_time = time.time()
        
        def log_response(status, headers, exc_info=None):
            duration = (time.time() - start_time) * 1000
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'method': request.method,
                'path': request.path,
                'status': status.split(' ')[0],
                'duration_ms': round(duration, 2),
                'ip': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', '')
            }
            logger.info(json.dumps(log_entry))
            return start_response(status, headers, exc_info)
        
        return self.app(environ, log_response)