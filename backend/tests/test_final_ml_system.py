# backend/tests/test_final_ml_system.py

import pytest
import json
import numpy as np
from app import create_app
from app.extensions import db
from app.ml_models.explainability import model_explainer
from app.ml_models.drift_detection import drift_detector

class TestFinalMLSystem:
    
    @pytest.fixture
    def client(self):
        app = create_app('testing')
        with app.test_client() as client:
            with app.app_context():
                db.create_all()
                yield client
                db.drop_all()
    
    def test_model_prediction(self, client):
        print("\n🧪 Testing model prediction...")
        
        response = client.post('/api/v1/prediction/test', json={
            'cgpa': 8.5,
            'skill_count': 10,
            'skill_diversity': 8,
            'internship_months': 6,
            'projects': 4,
            'certifications': 3,
            'workshops': 5,
            'total_experience': 14,
            'cgpa_normalized': 0.85,
            'certification_score': 11,
            'skill_cgpa_ratio': 1.18,
            'exp_skill_ratio': 1.4,
            'department_encoded': 0
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'prediction' in data
        print("✅ Prediction test passed")
    
    def test_model_explainability(self, client):
        print("\n🔍 Testing model explainability...")
        
        response = client.post('/api/v1/models/explain', json={
            'cgpa': 8.5,
            'skill_count': 10,
            'skill_diversity': 8,
            'internship_months': 6,
            'projects': 4,
            'certifications': 3,
            'workshops': 5,
            'total_experience': 14,
            'cgpa_normalized': 0.85,
            'certification_score': 11,
            'skill_cgpa_ratio': 1.18,
            'exp_skill_ratio': 1.4,
            'department_encoded': 0
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'feature_importance' in data
        print("✅ Explainability test passed")
    
    def test_drift_detection(self, client):
        print("\n📊 Testing drift detection...")
        
        response = client.get('/api/v1/models/drift')
        assert response.status_code == 200
        data = response.get_json()
        assert 'drift_score' in data
        print("✅ Drift detection test passed")
    
    def test_model_retraining(self, client):
        print("\n🔄 Testing model retraining...")
        
        response = client.post('/api/v1/models/retrain')
        assert response.status_code == 200
        data = response.get_json()
        assert 'status' in data
        print("✅ Retraining test passed")
    
    def test_hyperparameter_tuning(self, client):
        print("\n🎯 Testing hyperparameter tuning...")
        
        response = client.post('/api/v1/models/tune')
        assert response.status_code == 200
        data = response.get_json()
        assert 'best_params' in data
        print("✅ Hyperparameter tuning test passed")
