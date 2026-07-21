# backend/tests/test_auth.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app import create_app, db
from app.models import User

@pytest.fixture
def app():
    """Create and configure a test app"""
    app = create_app('app.config.TestingConfig')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """Create a test client"""
    return app.test_client()

def test_register_success(client):
    """Test successful registration"""
    response = client.post('/api/v1/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'TestPass123!',
        'full_name': 'Test User'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'User registered successfully'
    assert 'access_token' in data
    assert 'user' in data
    assert data['user']['username'] == 'testuser'

def test_register_duplicate(client):
    """Test registration with existing username"""
    # First registration
    client.post('/api/v1/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'TestPass123!',
        'full_name': 'Test User'
    })
    
    # Second registration with same username
    response = client.post('/api/v1/auth/register', json={
        'username': 'testuser',
        'email': 'another@example.com',
        'password': 'TestPass123!',
        'full_name': 'Another User'
    })
    assert response.status_code == 409
    assert response.get_json()['error'] == 'Username already exists'

def test_login_success(client):
    """Test successful login"""
    # Register user
    client.post('/api/v1/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'TestPass123!',
        'full_name': 'Test User'
    })
    
    # Login
    response = client.post('/api/v1/auth/login', json={
        'username': 'testuser',
        'password': 'TestPass123!'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert data['user']['username'] == 'testuser'

def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post('/api/v1/auth/login', json={
        'username': 'nonexistent',
        'password': 'wrongpass'
    })
    assert response.status_code == 401
    assert response.get_json()['error'] == 'Invalid credentials'

def test_profile_protected(client):
    """Test that profile endpoint requires authentication"""
    response = client.get('/api/v1/auth/profile')
    assert response.status_code == 401

def test_profile_with_token(client):
    """Test profile endpoint with valid token"""
    # Register and get token
    reg_response = client.post('/api/v1/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'TestPass123!',
        'full_name': 'Test User'
    })
    token = reg_response.get_json()['access_token']
    
    # Get profile
    response = client.get(
        '/api/v1/auth/profile',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data['username'] == 'testuser'