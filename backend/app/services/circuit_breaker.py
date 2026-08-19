# backend/app/services/circuit_breaker.py

import time
import logging
from typing import Dict, Any
from functools import wraps
from flask import jsonify

logger = logging.getLogger(__name__)

class CircuitBreaker:
    """Circuit breaker pattern for service calls"""
    
    def __init__(self, name, failure_threshold=5, timeout=30):
        self.name = name
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
        self.half_open_attempts = 0
    
    def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker"""
        if self.state == 'OPEN':
            if self._should_attempt_reset():
                self.state = 'HALF_OPEN'
            else:
                return {'error': 'Circuit breaker open, service unavailable'}
        
        try:
            result = func(*args, **kwargs)
            
            if self.state == 'HALF_OPEN':
                self._reset()
            
            return result
            
        except Exception as e:
            self._record_failure()
            if self.state == 'CLOSED' and self.failure_count >= self.failure_threshold:
                self._open_circuit()
            
            return {'error': str(e)}
    
    def _should_attempt_reset(self):
        """Check if circuit should attempt reset"""
        if self.last_failure_time is None:
            return True
        return (time.time() - self.last_failure_time) > self.timeout
    
    def _record_failure(self):
        """Record a failure"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        self.half_open_attempts = 0
    
    def _reset(self):
        """Reset circuit breaker"""
        self.state = 'CLOSED'
        self.failure_count = 0
        self.last_failure_time = None
        self.half_open_attempts = 0
        logger.info(f"Circuit {self.name} reset to CLOSED")
    
    def _open_circuit(self):
        """Open circuit"""
        self.state = 'OPEN'
        self.last_failure_time = time.time()
        logger.warning(f"Circuit {self.name} opened")

# Circuit breaker decorator
def circuit_breaker(name=None, failure_threshold=5, timeout=30):
    """Circuit breaker decorator"""
    def decorator(func):
        breaker = CircuitBreaker(
            name or func.__name__,
            failure_threshold,
            timeout
        )
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            return breaker.call(func, *args, **kwargs)
        return wrapper
    return decorator

# Usage
@circuit_breaker('ml_service', failure_threshold=3, timeout=60)
def call_ml_service(data):
    # Implementation
    pass