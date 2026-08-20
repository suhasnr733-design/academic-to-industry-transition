# backend/tests/test_integration.py

import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import User, Resume, Job

def test_complete_flow():
    """Test complete user flow from registration to resume processing"""
    app = create_app('app.config.TestingConfig')
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            # 1. Register
            reg_response = client.post('/api/v1/auth/register', json={
                'username': 'teststudent',
                'email': 'student@example.com',
                'password': 'TestPass123!',
                'full_name': 'Test Student',
                'department': 'Computer Science'
            })
            assert reg_response.status_code == 201
            token = reg_response.get_json()['access_token']
            
            # 2. Upload Resume
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
                f.write(b'%PDF-1.4\nSample Resume\nSkills: Python, Java, SQL')
                test_file_path = f.name
            
            try:
                with open(test_file_path, 'rb') as f:
                    upload_response = client.post(
                        '/api/v1/resume/upload',
                        headers={'Authorization': f'Bearer {token}'},
                        content_type='multipart/form-data',
                        data={'file': (f, 'resume.pdf')}
                    )
                assert upload_response.status_code == 201
                resume_id = upload_response.get_json()['resume_id']
                
                # 3. List Resumes
                list_response = client.get(
                    '/api/v1/resume/list',
                    headers={'Authorization': f'Bearer {token}'}
                )
                assert list_response.status_code == 200
                data = list_response.get_json()
                assert data['total'] >= 1
                
                # 4. Process Resume
                process_response = client.post(
                    f'/api/v1/resume/{resume_id}/process',
                    headers={'Authorization': f'Bearer {token}'}
                )
                assert process_response.status_code == 202
                
                # 5. Check Status
                status_response = client.get(
                    f'/api/v1/resume/{resume_id}/status',
                    headers={'Authorization': f'Bearer {token}'}
                )
                assert status_response.status_code == 200
                status_data = status_response.get_json()
                assert status_data['resume_id'] == resume_id
                
            finally:
                if os.path.exists(test_file_path):
                    os.unlink(test_file_path)
            
            print("✅ Complete flow test passed!")
            db.drop_all()
