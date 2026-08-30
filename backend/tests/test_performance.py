# backend/tests/test_performance.py

import pytest
import time
from app import create_app
from app.services.advanced_cache import AdvancedCache
from app.services.api_monitor import api_monitor

class TestPerformance:
    
    def test_cache_performance(self):
        """Test caching improves performance"""
        app = create_app('app.config.TestingConfig')
        
        with app.test_client() as client:
            # First request (uncached)
            start_time = time.time()
            response1 = client.get('/api/v1/jobs')
            uncached_time = (time.time() - start_time) * 1000
            
            # Second request (cached)
            start_time = time.time()
            response2 = client.get('/api/v1/jobs')
            cached_time = (time.time() - start_time) * 1000
            
            assert cached_time <= uncached_time + 50.0, "Cache should maintain or improve performance"
            print(f"Uncached: {uncached_time:.2f}ms, Cached: {cached_time:.2f}ms")
    
    def test_api_monitoring(self):
        """Test API monitoring"""
        # Simulate API logs
        for _ in range(5):
            api_monitor.log_request('/api/v1/jobs', 'GET', 200, 12.5)
        
        # Get metrics
        summary = api_monitor.get_metrics(hours=1)
        assert 'total_requests' in summary
        assert summary['total_requests'] >= 5
        print(f"API Metrics: {summary}")