# backend/tests/test_end_to_end_system.py

import pytest
import json
import time
from app import create_app
from app.extensions import db

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
        with open('tests/data/sample_resume.pdf', 'rb') as f:
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
        time.sleep(2)
        
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
        notif = client.get('/api/v1/notifications')
        assert notif.status_code == 200
        print("✅ Notifications retrieved")
        
        print("✅ Complete workflow test passed!")
    
    def test_ml_prediction_flow(self, client):
        print("\n🧪 Testing ML prediction flow...")
        
        # Get prediction from ML service
        response = client.get('/api/v1/prediction/test')
        assert response.status_code == 200
        data = response.get_json()
        assert 'prediction' in data
        print("✅ ML prediction test passed")