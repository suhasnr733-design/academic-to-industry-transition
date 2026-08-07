# backend/tests/test_performance.py

import pytest
import time
from app import create_app
from app.services.advanced_cache import AdvancedCache
from app.services.api_monitor import APIMonitor

class TestPerformance:
    
    def test_cache_performance(self):
        """Test caching improves performance"""
        app = create_app('testing')
        
        with app.test_client() as client:
            # First request (uncached)
            start_time = time.time()
            response1 = client.get('/api/v1/jobs')
            uncached_time = (time.time() - start_time) * 1000
            
            # Second request (cached)
            start_time = time.time()
            response2 = client.get('/api/v1/jobs')
            cached_time = (time.time() - start_time) * 1000
            
            assert cached_time < uncached_time, "Cache should improve performance"
            print(f"Uncached: {uncached_time:.2f}ms, Cached: {cached_time:.2f}ms")
    
    def test_api_monitoring(self):
        """Test API monitoring"""
        # Simulate API calls
        app = create_app('testing')
        
        with app.test_client() as client:
            for _ in range(10):
                client.get('/api/v1/jobs')
                client.get('/api/v1/auth/login')
        
        # Get metrics
        summary = APIMonitor.get_summary(days=1)
        assert summary['total_requests'] > 0
        print(f"API Metrics: {summary}")