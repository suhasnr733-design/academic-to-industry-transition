# backend/tests/test_performance.py

import pytest
import time
from app import create_app

class TestPerformance:
    
    @pytest.fixture
    def client(self):
        app = create_app('testing')
        return app.test_client()
    
    def test_api_response_time(self, client):
        """Test API response times"""
        
        endpoints = [
            ('/api/v1/health', 'GET'),
            ('/api/v1/jobs', 'GET'),
            ('/api/v1/jobs/domains', 'GET'),
        ]
        
        for endpoint, method in endpoints:
            start_time = time.time()
            if method == 'GET':
                response = client.get(endpoint)
            duration = (time.time() - start_time) * 1000
            
            print(f"{endpoint}: {duration:.2f}ms")
            assert duration < 500, f"{endpoint} too slow: {duration:.2f}ms"
            assert response.status_code in [200, 404]
    
    def test_concurrent_requests(self, client):
        """Test concurrent requests"""
        import concurrent.futures
        
        def make_request():
            return client.get('/api/v1/jobs')
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(50)]
            results = [f.result() for f in futures]
            
            success_count = sum(1 for r in results if r.status_code == 200)
            print(f"Success rate: {success_count}/{len(results)}")
            
            assert success_count > 45, "Too many failed requests"