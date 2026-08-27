# backend/tests/test_job_interest.py

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import pytest
import json
from app import create_app, db
from app.models import User, Job, JobInterest
from flask_jwt_extended import create_access_token

@pytest.fixture
def app():
    """Create and configure a test app"""
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create a test client"""
    return app.test_client()

@pytest.fixture
def student_user(app):
    with app.app_context():
        user = User.query.filter_by(email='student_interest@test.com').first()
        if not user:
            user = User(
                username='student_interest',
                email='student_interest@test.com',
                full_name='Interest Tester',
                role='student',
                department='Computer Science'
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()
        return user

@pytest.fixture
def auth_headers(app, student_user):
    with app.app_context():
        token = create_access_token(identity=str(student_user.id))
        return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

@pytest.fixture
def sample_job(app):
    with app.app_context():
        job = Job.query.filter_by(title='Campus Test Engineer').first()
        if not job:
            job = Job(
                title='Campus Test Engineer',
                company='Campus Corp',
                description='Great campus role for graduating seniors',
                required_skills=['Python', 'SQL', 'Flask'],
                source='internal',
                is_active=True
            )
            db.session.add(job)
            db.session.commit()
        return job

def test_add_job_interest_internal(client, auth_headers, sample_job):
    """Test student marking an internal campus job as interested"""
    payload = {
        'job_id': sample_job.id,
        'status': 'interested',
        'notes': 'Excited about this campus drive'
    }
    response = client.post('/api/v1/jobs/interested', headers=auth_headers, data=json.dumps(payload))
    assert response.status_code in (200, 201)
    data = response.get_json()
    assert data['is_interested'] is True
    assert data['interest']['job_title'] == 'Campus Test Engineer'
    assert data['interest']['company'] == 'Campus Corp'

def test_add_job_interest_external(client, auth_headers):
    """Test student saving an external live job"""
    payload = {
        'external_job_id': 'ext-unstop-12345',
        'job_title': 'Frontend Developer Intern',
        'company': 'Tech Startup',
        'job_data': {
            'location': 'Bengaluru',
            'source': 'unstop',
            'apply_url': 'https://unstop.com/job/12345',
            'required_skills': ['React', 'JavaScript', 'CSS']
        },
        'status': 'interested'
    }
    response = client.post('/api/v1/jobs/interested', headers=auth_headers, data=json.dumps(payload))
    assert response.status_code in (200, 201)
    data = response.get_json()
    assert data['is_interested'] is True
    assert data['interest']['external_job_id'] == 'ext-unstop-12345'
    assert data['interest']['company'] == 'Tech Startup'

def test_get_interested_jobs(client, auth_headers, sample_job):
    """Test retrieving student interested jobs"""
    client.post('/api/v1/jobs/interested', headers=auth_headers, data=json.dumps({'job_id': sample_job.id}))

    response = client.get('/api/v1/jobs/interested', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert data['count'] >= 1
    assert any(i['company'] == 'Campus Corp' for i in data['interests'])

def test_update_interest_status(client, auth_headers, sample_job):
    """Test advancing application stage: interested -> applied"""
    res_post = client.post('/api/v1/jobs/interested', headers=auth_headers, data=json.dumps({'job_id': sample_job.id}))
    interest_id = res_post.get_json()['interest']['id']

    patch_res = client.patch(
        f'/api/v1/jobs/interested/{interest_id}/status',
        headers=auth_headers,
        data=json.dumps({'status': 'applied', 'notes': 'Application submitted on portal'})
    )
    assert patch_res.status_code == 200
    updated = patch_res.get_json()['interest']
    assert updated['status'] == 'applied'
    assert 'Application submitted' in updated['notes']

def test_campus_board_aggregation(client, sample_job, auth_headers):
    """Test public campus board API returns jobs with campus_interest_count"""
    client.post('/api/v1/jobs/interested', headers=auth_headers, data=json.dumps({'job_id': sample_job.id}))

    response = client.get('/api/v1/jobs/campus-board')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert 'campus_jobs' in data
    matched = [j for j in data['campus_jobs'] if j['id'] == sample_job.id]
    assert len(matched) == 1
    assert matched[0]['campus_interest_count'] >= 1

def test_remove_job_interest(client, auth_headers, sample_job):
    """Test removing a job from interested campus board"""
    res_post = client.post('/api/v1/jobs/interested', headers=auth_headers, data=json.dumps({'job_id': sample_job.id}))
    interest_id = res_post.get_json()['interest']['id']

    del_res = client.delete(f'/api/v1/jobs/interested/{interest_id}', headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.get_json()['message'] == 'Job interest removed successfully'
