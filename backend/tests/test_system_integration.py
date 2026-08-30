# backend/tests/test_system_integration.py

import os
import pytest
import time
from app import create_app
from app.extensions import db

class TestSystemIntegration:
    
    @pytest.fixture
    def client(self):
        app = create_app('testing')
        with app.test_client() as client:
            with app.app_context():
                db.create_all()
                yield client
                db.drop_all()
    
    def test_complete_workflow(self, client):
        print("\n🚀 Testing complete workflow...")
        
        # 1. Register & Login
        reg = client.post('/api/v1/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'full_name': 'Test User'
        })
        assert reg.status_code == 201
        
        login = client.post('/api/v1/auth/login', json={
            'username': 'testuser',
            'password': 'TestPass123!'
        })
        assert login.status_code == 200
        token = login.get_json()['access_token']
        print("✅ Registration and login successful")
        
        # 2. Upload Resume
        resume_path = os.path.join(os.path.dirname(__file__), 'data', 'sample_resume.pdf')
        with open(resume_path, 'rb') as f:
            upload = client.post(
                '/api/v1/resume/upload',
                headers={'Authorization': f'Bearer {token}'},
                data={'file': (f, 'sample_resume.pdf')}
            )
        assert upload.status_code == 201
        print("✅ Resume uploaded")
        
        # 3. Get Jobs
        jobs = client.get('/api/v1/jobs')
        assert jobs.status_code == 200
        print("✅ Jobs retrieved")
        
        print("✅ Complete workflow test passed!")