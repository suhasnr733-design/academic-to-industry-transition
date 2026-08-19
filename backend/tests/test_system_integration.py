# backend/tests/test_system_integration.py

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
        
        # 1. Register
        reg = client.post('/api/v1/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'full_name': 'Test User'
        })
        assert reg.status_code == 201
        token = reg.get_json()['access_token']
        print("✅ Registration successful")
        
        # 2. Upload Resume
        with open('tests/data/sample_resume.pdf', 'rb') as f:
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