# backend/tests/test_final_performance.py

import pytest
import time
import numpy as np
import joblib
from sklearn.metrics import accuracy_score, f1_score

class TestFinalPerformance:
    
    def test_model_accuracy(self):
        """Test final model accuracy"""
        print("\n🎯 Testing final model accuracy...")
        model = joblib.load('data/models/production/model_production.pkl')
        
        # Load test data
        # Assume test data is available
        X_test = np.random.rand(100, 13)
        y_test = np.random.randint(0, 2, 100)
        
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        
        print(f"✅ Accuracy: {accuracy:.4f}")
        print(f"✅ F1 Score: {f1:.4f}")
        assert accuracy > 0.80, f"Accuracy {accuracy} below 80%"
    
    def test_inference_speed(self):
        """Test inference speed"""
        print("\n⚡ Testing inference speed...")
        model = joblib.load('data/models/production/model_production.pkl')
        
        # Warm up
        for _ in range(10):
            X = np.random.rand(1, 13)
            model.predict(X)
        
        # Benchmark
        times = []
        for _ in range(100):
            X = np.random.rand(1, 13)
            start = time.time()
            model.predict(X)
            times.append((time.time() - start) * 1000)
        
        avg_time = np.mean(times)
        p95_time = np.percentile(times, 95)
        
        print(f"✅ Avg inference time: {avg_time:.2f}ms")
        print(f"✅ 95th percentile: {p95_time:.2f}ms")
        assert avg_time < 50, f"Avg time {avg_time:.2f}ms exceeds 50ms"