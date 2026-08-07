# backend/tests/test_resume.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import tempfile
from app import create_app, db
from app.models import User, Resume

@pytest.fixture
def app():
    app = create_app('app.config.TestingConfig')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_token(client):
    """Get auth token for testing"""
    client.post('/api/v1/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'TestPass123!',
        'full_name': 'Test User'
    })
    response = client.post('/api/v1/auth/login', json={
        'username': 'testuser',
        'password': 'TestPass123!'
    })
    return response.get_json()['access_token']

def test_upload_resume(client, auth_token):
    """Test resume upload"""
    # Create a test PDF file
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
        f.write(b'%PDF-1.4\nTest PDF content for resume')
        test_file_path = f.name
    
    try:
        with open(test_file_path, 'rb') as f:
            response = client.post(
                '/api/v1/resume/upload',
                headers={'Authorization': f'Bearer {auth_token}'},
                content_type='multipart/form-data',
                data={'file': (f, 'test_resume.pdf')}
            )
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'resume_id' in data
        assert data['filename'] == 'test_resume.pdf'
        assert data['status'] == 'pending'
        
    finally:
        # Clean up
        os.unlink(test_file_path)

def test_list_resumes(client, auth_token):
    """Test listing resumes"""
    response = client.get(
        '/api/v1/resume/list',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.get_json()
    assert 'resumes' in data
    assert 'total' in data

def test_get_resume_data(client, auth_token):
    """Test getting resume data after processing"""
    # Upload resume
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
        f.write(b'%PDF-1.4\nTest PDF content')
        test_file_path = f.name
    
    try:
        with open(test_file_path, 'rb') as f:
            upload_response = client.post(
                '/api/v1/resume/upload',
                headers={'Authorization': f'Bearer {auth_token}'},
                content_type='multipart/form-data',
                data={'file': (f, 'test.pdf')}
            )
        resume_id = upload_response.get_json()['resume_id']
        
        # Process resume (would be async in production)
        # For testing, we'll directly process
        from app.services.resume_processor import ResumeProcessor
        processor = ResumeProcessor()
        processor.process_resume(resume_id)
        
        # Get data
        response = client.get(
            f'/api/v1/resume/{resume_id}/data',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'skills' in data
        
    finally:
        os.unlink(test_file_path)