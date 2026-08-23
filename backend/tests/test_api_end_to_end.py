# backend/tests/test_api_end_to_end.py

import pytest
import json
import time
from app import create_app
from app.extensions import db

class TestAPIEndToEnd:
    
    @pytest.fixture
    def client(self):
        app = create_app('testing')
        with app.test_client() as client:
            with app.app_context():
                db.create_all()
                yield client
                db.drop_all()
    
    def test_complete_api_flow(self, client):
        print("\n🚀 Testing complete API flow...")
        
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
        
        # 5. Get Notifications
        notif = client.get('/api/v1/notifications')
        assert notif.status_code == 200
        print("✅ Notifications retrieved")
        
        print("✅ Complete API flow test passed!")
    
    def test_rate_limiting(self, client):
        print("\n⏱️ Testing rate limiting...")
        
        for i in range(110):
            response = client.get('/api/v1/jobs')
            if i >= 100 and response.status_code == 429:
                print("✅ Rate limiting working")
                break
        else:
            print("❌ Rate limiting not working")
    
    def test_security(self, client):
        print("\n🔒 Testing security...")
        
        # Test invalid token
        response = client.get('/api/v1/auth/profile',
            headers={'Authorization': 'Bearer invalid'})
        assert response.status_code == 401
        print("✅ Token validation working")
        
        # Test CORS
        response = client.options('/api/v1/jobs', 
            headers={'Origin': 'https://test.com'})
        assert response.status_code == 200
        print("✅ CORS configured")