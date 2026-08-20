# backend/tests/test_oauth.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app import create_app, db
from app.models import User
from app.api.v1.auth.routes import find_or_create_oauth_user

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

def test_oauth_user_creation(app):
    """Test creating a new user via find_or_create_oauth_user"""
    with app.app_context():
        user = find_or_create_oauth_user(
            provider='google',
            provider_id='google-uid-12345',
            email='oauth_test@example.com',
            full_name='OAuth Test User',
            picture='https://example.com/avatar.jpg'
        )
        assert user is not None
        assert user.email == 'oauth_test@example.com'
        assert user.oauth_provider == 'google'
        assert user.oauth_provider_id == 'google-uid-12345'
        assert user.profile_picture == 'https://example.com/avatar.jpg'
        assert user.is_email_verified is True

def test_oauth_user_linking_existing_email(app):
    """Test linking an existing email account when logging in via OAuth"""
    with app.app_context():
        # Create user via regular registration
        existing = User(
            username='existing_student',
            email='student_link@example.com',
            full_name='Existing Student',
            role='student'
        )
        existing.set_password('SecretPass123!')
        db.session.add(existing)
        db.session.commit()

        # Link via LinkedIn OAuth
        linked_user = find_or_create_oauth_user(
            provider='linkedin',
            provider_id='linkedin-uid-67890',
            email='student_link@example.com',
            full_name='Existing Student LinkedIn'
        )

        assert linked_user.id == existing.id
        assert linked_user.oauth_provider == 'linkedin'
        assert linked_user.oauth_provider_id == 'linkedin-uid-67890'
        # Password remains intact
        assert linked_user.check_password('SecretPass123!') is True

def test_google_auth_redirect_unconfigured(client):
    """Test GET /api/v1/auth/google redirects with error when unconfigured"""
    res = client.get('/api/v1/auth/google')
    assert res.status_code == 302
    assert 'google_oauth_not_configured' in res.headers['Location']

def test_google_auth_redirect_configured(app, client):
    """Test GET /api/v1/auth/google redirects to Google auth URL when configured"""
    app.config['GOOGLE_CLIENT_ID'] = 'test-google-client-id'
    app.config['GOOGLE_CLIENT_SECRET'] = 'test-google-secret'
    res = client.get('/api/v1/auth/google')
    assert res.status_code == 302
    assert 'accounts.google.com' in res.headers['Location']
    assert 'client_id=test-google-client-id' in res.headers['Location']

def test_linkedin_auth_redirect_unconfigured(client):
    """Test GET /api/v1/auth/linkedin redirects with error when unconfigured"""
    res = client.get('/api/v1/auth/linkedin')
    assert res.status_code == 302
    assert 'linkedin_oauth_not_configured' in res.headers['Location']

def test_linkedin_auth_redirect_configured(app, client):
    """Test GET /api/v1/auth/linkedin redirects to LinkedIn auth URL when configured"""
    app.config['LINKEDIN_CLIENT_ID'] = 'test-linkedin-client-id'
    app.config['LINKEDIN_CLIENT_SECRET'] = 'test-linkedin-secret'
    res = client.get('/api/v1/auth/linkedin')
    assert res.status_code == 302
    assert 'linkedin.com/oauth/v2/authorization' in res.headers['Location']
    assert 'client_id=test-linkedin-client-id' in res.headers['Location']
