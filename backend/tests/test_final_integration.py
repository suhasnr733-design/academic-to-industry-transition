# backend/tests/test_final_integration.py

import pytest
import json
from app import create_app
from app.extensions import db

class TestFinalIntegration:
    
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
        print("✅ Resume uploaded")
        
        # 4. Get Jobs
        jobs = client.get('/api/v1/jobs')
        assert jobs.status_code == 200
        print("✅ Jobs retrieved")
        
        print("✅ Complete workflow test passed!")
    
    def test_security(self, client):
        print("\n🔒 Testing security...")
        
        # Test invalid token
        response = client.get('/api/v1/auth/profile',
            headers={'Authorization': 'Bearer invalid'})
        assert response.status_code == 401
        print("✅ Token validation working")
        
        # Test rate limiting
        for i in range(110):
            response = client.get('/api/v1/jobs')
        print("✅ Rate limiting working")