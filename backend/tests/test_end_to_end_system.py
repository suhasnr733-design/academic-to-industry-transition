# backend/tests/test_end_to_end_system.py

import os
import pytest
import json
import time
from app import create_app
from app.extensions import db
from app.services.prediction_service import PredictionService

class TestEndToEndSystem:
    
    @pytest.fixture
    def client(self):
        app = create_app('testing')
        with app.test_client() as client:
            with app.app_context():
                db.create_all()
                yield client
                db.drop_all()
    
    def test_complete_user_workflow(self, client):
        print("\n🚀 Testing complete user workflow...")
        
        # 1. Register
        reg = client.post('/api/v1/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'full_name': 'Test User'
        })
        assert reg.status_code == 201
        print("✅ Registration successful")
        
        # 2. Login
        login = client.post('/api/v1/auth/login', json={
            'username': 'testuser',
            'password': 'TestPass123!'
        })
        assert login.status_code == 200
        token = login.get_json()['access_token']
        print("✅ Login successful")
        
        # 3. Upload Resume
        resume_path = os.path.join(os.path.dirname(__file__), 'data', 'sample_resume.pdf')
        with open(resume_path, 'rb') as f:
            upload = client.post(
                '/api/v1/resume/upload',
                headers={'Authorization': f'Bearer {token}'},
                data={'file': (f, 'sample_resume.pdf')}
            )
        assert upload.status_code == 201
        resume_id = upload.get_json()['resume_id']
        print("✅ Resume uploaded")
        
        # 4. Process Resume
        process = client.post(
            f'/api/v1/resume/{resume_id}/process',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert process.status_code == 202
        print("✅ Resume processing started")
        
        # 5. Wait for processing
        time.sleep(1)
        
        # 6. Get Prediction
        pred = client.get(
            f'/api/v1/prediction/employability/{resume_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert pred.status_code == 200
        print("✅ Prediction retrieved")
        
        # 7. Get Jobs
        jobs = client.get('/api/v1/jobs')
        assert jobs.status_code == 200
        print("✅ Jobs retrieved")
        
        # 8. Get Notifications
        notif = client.get('/api/v1/notifications', headers={'Authorization': f'Bearer {token}'})
        assert notif.status_code == 200
        print("✅ Notifications retrieved")
        
        print("✅ Complete workflow test passed!")
    
    def test_ml_prediction_flow(self, client):
        print("\n🧪 Testing ML prediction flow...")
        
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
        prediction = service.predict_employability(sample_student)
        assert prediction is not None
        assert 'employable' in prediction or 'confidence' in prediction
        print("✅ ML prediction test passed")