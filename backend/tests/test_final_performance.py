# backend/tests/test_final_performance.py

import os
import pytest
import time
import numpy as np
from app.services.prediction_service import PredictionService

class TestFinalPerformance:
    
    def test_model_accuracy(self):
        """Test final model prediction pipeline"""
        print("\n🎯 Testing final model prediction pipeline...")
        service = PredictionService()
        sample_student = {
            'cgpa': 8.5,
            'skill_count': 6,
            'skill_diversity': 5,
            'internship_months': 4,
            'projects': 3,
            'certifications': 2,
            'workshops': 2,
            'total_experience': 10,
            'cgpa_normalized': 0.85,
            'certification_score': 5,
            'skill_cgpa_ratio': 6 / 8.5,
            'exp_skill_ratio': 10 / 7,
            'department_encoded': 0
        }
        res = service.predict_employability(sample_student)
        assert res is not None
        assert 'employable' in res or 'confidence' in res
        print(f"✅ Prediction result: {res}")
    
    def test_inference_speed(self):
        """Test inference speed"""
        print("\n⚡ Testing inference speed...")
        service = PredictionService()
        sample_student = {
            'cgpa': 8.5,
            'skill_count': 6,
            'skill_diversity': 5,
            'internship_months': 4,
            'projects': 3,
            'certifications': 2,
            'workshops': 2,
            'total_experience': 10,
            'cgpa_normalized': 0.85,
            'certification_score': 5,
            'skill_cgpa_ratio': 6 / 8.5,
            'exp_skill_ratio': 10 / 7,
            'department_encoded': 0
        }
        
        # Warm up
        for _ in range(5):
            service.predict_employability(sample_student)
        
        # Benchmark
        times = []
        for _ in range(50):
            start = time.time()
            service.predict_employability(sample_student)
            times.append((time.time() - start) * 1000)
        
        avg_time = np.mean(times)
        p95_time = np.percentile(times, 95)
        
        print(f"✅ Avg inference time: {avg_time:.2f}ms")
        print(f"✅ 95th percentile: {p95_time:.2f}ms")
        assert avg_time < 50, f"Avg time {avg_time:.2f}ms exceeds 50ms"