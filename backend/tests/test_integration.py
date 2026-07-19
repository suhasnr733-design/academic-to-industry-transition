# backend/tests/test_integration.py

import pytest
import json
from app import create_app
from app.extensions import db
from app.models import User, Resume, Job

class TestSystemIntegration:
    
    @pytest.fixture
    def client(self):
        app = create_app('testing')
        with app.test_client() as client:
            with app.app_context():
                db.create_all()
                yield client
                db.drop_all()
    
    def test_complete_user_flow(self, client):
        """Test complete user flow"""
        
        # 1. Register
        reg_response = client.post('/api/v1/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'full_name': 'Test User'
        })
        assert reg_response.status_code == 201
        token = reg_response.get_json()['access_token']
        
        # 2. Upload resume
        with open('tests/data/sample_resume.pdf', 'rb') as f:
            upload_response = client.post(
                '/api/v1/resume/upload',
                headers={'Authorization': f'Bearer {token}'},
                content_type='multipart/form-data',
                data={'file': (f, 'sample_resume.pdf')}
            )
        assert upload_response.status_code == 201
        resume_id = upload_response.get_json()['resume_id']
        
        # 3. Process resume
        process_response = client.post(
            f'/api/v1/resume/{resume_id}/process',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert process_response.status_code == 202
        
        # 4. Get job matches
        match_response = client.get(
            f'/api/v1/jobs/match/{resume_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert match_response.status_code in [200, 404]
        
        # 5. Get recommendations
        rec_response = client.get(
            f'/api/v1/prediction/recommendations/{resume_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert rec_response.status_code in [200, 400]
        
        # 6. Get notifications
        notif_response = client.get(
            '/api/v1/notifications',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert notif_response.status_code == 200
        
        print("✅ Complete user flow test passed!")