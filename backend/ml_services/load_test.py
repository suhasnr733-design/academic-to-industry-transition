# backend/ml_service/load_test.py

import requests
import json
import time
import numpy as np
from concurrent.futures import ThreadPoolExecutor
import statistics

class LoadTester:
    """Load test ML service"""
    
    def __init__(self, url='http://localhost:8000'):
        self.url = url
    
    def test_health(self):
        """Test health endpoint"""
        response = requests.get(f'{self.url}/health')
        return response.status_code == 200
    
    def test_prediction(self, data):
        """Test single prediction"""
        try:
            start_time = time.time()
            response = requests.post(f'{self.url}/predict', json=data, timeout=10)
            duration = (time.time() - start_time) * 1000
            return {'status': response.status_code, 'duration': duration}
        except Exception as e:
            return {'status': -1, 'duration': 0, 'error': str(e)}
    
    def run_load_test(self, n_requests=100, concurrency=10):
        """Run load test"""
        print(f"🚀 Starting load test: {n_requests} requests, {concurrency} concurrent")
        
        # Sample data
        sample_data = {
            "cgpa": 8.5,
            "skill_count": 10,
            "skill_diversity": 8,
            "internship_months": 6,
            "projects": 4,
            "certifications": 3,
            "workshops": 5,
            "total_experience": 14,
            "cgpa_normalized": 0.85,
            "certification_score": 11,
            "skill_cgpa_ratio": 1.18,
            "exp_skill_ratio": 1.4,
            "department_encoded": 0
        }
        
        # Warm up
        print("Warming up...")
        for _ in range(10):
            self.test_prediction(sample_data)
        
        # Run tests
        results = []
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(self.test_prediction, sample_data) for _ in range(n_requests)]
            for future in futures:
                results.append(future.result())
        
        # Analyze results
        successful = [r for r in results if r.get('status') == 200]
        failed = [r for r in results if r.get('status') != 200]
        
        durations = [r['duration'] for r in successful]
        
        print("\n📊 Load Test Results:")
        print(f"Total requests: {n_requests}")
        print(f"Successful: {len(successful)}")
        print(f"Failed: {len(failed)}")
        print(f"Success rate: {(len(successful)/n_requests)*100:.1f}%")
        
        if durations:
            print(f"Min response time: {min(durations):.2f} ms")
            print(f"Max response time: {max(durations):.2f} ms")
            print(f"Avg response time: {statistics.mean(durations):.2f} ms")
            print(f"Median response time: {statistics.median(durations):.2f} ms")
            print(f"95th percentile: {np.percentile(durations, 95):.2f} ms")
        
        return {
            'total': n_requests,
            'successful': len(successful),
            'failed': len(failed),
            'success_rate': (len(successful)/n_requests)*100,
            'response_times': durations
        }

if __name__ == '__main__':
    tester = LoadTester()
    if tester.test_health():
        print("✅ Service is healthy")
        results = tester.run_load_test(n_requests=200, concurrency=20)
    else:
        print("❌ Service is not available")