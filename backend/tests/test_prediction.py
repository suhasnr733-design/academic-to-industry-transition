# backend/tests/test_prediction.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import tempfile
from app import create_app, db
from app.models import User, Resume, Job
from datetime import datetime

@pytest.fixture
def app():
    app = create_app('app.config.TestingConfig')
    with app.app_context():
        db.create_all()
        
        # Create test user
        user = User(
            username='testuser',
            email='test@example.com',
            full_name='Test User'
        )
        user.set_password('TestPass123!')
        db.session.add(user)
        
        # Create test jobs
        jobs = [
            Job(
                title='Data Scientist',
                company='Test Corp',
                required_skills=['Python', 'Machine Learning', 'SQL'],
                domain='AI/ML',
                posted_date=datetime.utcnow()
            ),
            Job(
                title='Software Engineer',
                company='Test Inc',
                required_skills=['Python', 'Java', 'Git'],
                domain='Software Development',
                posted_date=datetime.utcnow()
            )
        ]
        db.session.add_all(jobs)
        db.session.commit()
        
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_token(client):
    response = client.post('/api/v1/auth/login', json={
        'username': 'testuser',
        'password': 'TestPass123!'
    })
    return response.get_json()['access_token']

@pytest.fixture
def test_resume(client, auth_token):
    # Create a test resume
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
        f.write(b'%PDF-1.4\nSkills: Python, SQL, Git')
        test_file_path = f.name
    
    try:
        with open(test_file_path, 'rb') as f:
            response = client.post(
                '/api/v1/resume/upload',
                headers={'Authorization': f'Bearer {auth_token}'},
                content_type='multipart/form-data',
                data={'file': (f, 'resume.pdf')}
            )
        resume_id = response.get_json()['resume_id']
        
        # Process resume
        from app.services.resume_processor import ResumeProcessor
        processor = ResumeProcessor()
        processor.process_resume(resume_id)
        
        yield resume_id
        
    finally:
        os.unlink(test_file_path)

def test_skill_gap_analysis(client, auth_token, test_resume):
    """Test skill gap analysis"""
    response = client.get(
        f'/api/v1/prediction/resume/{test_resume}/gap?target_role=Data Scientist',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.get_json()
    assert 'current_skills' in data
    assert 'target_skills' in data
    assert 'missing_skills' in data

def test_job_matching(client, auth_token, test_resume):
    """Test job matching"""
    response = client.get(
        f'/api/v1/prediction/resume/{test_resume}/match',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.get_json()
    assert 'matches' in data
    assert 'total_matches' in data

def test_recommendations(client, auth_token, test_resume):
    """Test course recommendations"""
    response = client.get(
        f'/api/v1/prediction/resume/{test_resume}/recommendations',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.get_json()
    assert 'recommendations' in data
    assert 'total_recommendations' in data