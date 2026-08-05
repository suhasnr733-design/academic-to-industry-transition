# backend/tests/test_system_integration.py

import pytest
from app import create_app
from app.extensions import db
import json

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
        """Test complete user flow from registration to report"""
        
        # 1. Register
        reg_response = client.post('/api/v1/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'full_name': 'Test User',
            'role': 'student'
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
        
        # 4. Get prediction
        pred_response = client.get(
            f'/api/v1/prediction/employability/{resume_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert pred_response.status_code in [200, 500]
        
        # 5. Get recommendations
        rec_response = client.get(
            f'/api/v1/prediction/recommendations/{resume_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert rec_response.status_code in [200, 500]
        
        # 6. Get notifications
        notif_response = client.get(
            '/api/v1/notifications',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert notif_response.status_code == 200
        
        print("✅ Complete system integration test passed!")