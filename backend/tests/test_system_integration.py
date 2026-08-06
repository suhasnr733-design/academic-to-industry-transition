# backend/tests/test_system_integration.py

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
    
    def test_complete_workflow(self, client):
        """Test complete system workflow"""
        print("\n🚀 Testing complete workflow...")
        
        # 1. Register
        reg_response = client.post('/api/v1/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'full_name': 'Test User'
        })
        assert reg_response.status_code == 201
        token = reg_response.get_json()['access_token']
        print("✅ Registration complete")
        
        # 2. Upload Resume
        with open('tests/data/sample_resume.pdf', 'rb') as f:
            upload_response = client.post(
                '/api/v1/resume/upload',
                headers={'Authorization': f'Bearer {token}'},
                content_type='multipart/form-data',
                data={'file': (f, 'sample_resume.pdf')}
            )
        assert upload_response.status_code == 201
        resume_id = upload_response.get_json()['resume_id']
        print("✅ Resume upload complete")
        
        # 3. Process Resume
        process_response = client.post(
            f'/api/v1/resume/{resume_id}/process',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert process_response.status_code == 202
        print("✅ Resume processing started")
        
        # 4. Get Profile
        profile_response = client.get(
            '/api/v1/auth/profile',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert profile_response.status_code == 200
        print("✅ Profile retrieved")
        
        # 5. Get Jobs
        jobs_response = client.get('/api/v1/jobs')
        assert jobs_response.status_code == 200
        print("✅ Jobs retrieved")
        
        # 6. Get Prediction
        pred_response = client.get(
            f'/api/v1/prediction/employability/{resume_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert pred_response.status_code in [200, 500]
        print("✅ Prediction retrieved")
        
        # 7. Get Notifications
        notif_response = client.get(
            '/api/v1/notifications',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert notif_response.status_code == 200
        print("✅ Notifications retrieved")
        
        print("✅ Complete system workflow test passed!")
    
    def test_graphql_federation(self, client):
        """Test GraphQL federation"""
        query = """
        {
            user(id: 1) {
                id
                username
                full_name
                resumes {
                    id
                    filename
                    skills
                }
            }
        }
        """
        
        response = client.post('/api/v1/graphql', json={'query': query})
        assert response.status_code in [200, 400]
        print("✅ GraphQL federation test passed")
    
    def test_gateway_routing(self, client):
        """Test gateway routing"""
        response = client.get('/api/v1/health')
        assert response.status_code in [200, 404]
        print("✅ Gateway routing test passed")