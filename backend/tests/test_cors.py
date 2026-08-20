# backend/tests/test_cors.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app import create_app, db

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

def test_cors_preflight_production_vercel(client):
    """Test CORS preflight OPTIONS request from production Vercel domain"""
    origin = 'https://academic-to-industry-transition.vercel.app'
    response = client.options('/api/v1/auth/login', headers={
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
    })
    assert response.status_code == 200
    assert response.headers.get('Access-Control-Allow-Origin') == origin
    allowed_methods = response.headers.get('Access-Control-Allow-Methods', '')
    for method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']:
        assert method in allowed_methods
    allowed_headers = response.headers.get('Access-Control-Allow-Headers', '').lower()
    assert 'authorization' in allowed_headers
    assert 'content-type' in allowed_headers
    assert response.headers.get('Access-Control-Allow-Credentials') == 'true'

def test_cors_preflight_vercel_preview(client):
    """Test CORS preflight OPTIONS request from Vercel preview domain"""
    origin = 'https://academic-to-industry-transition-nc8pbzced-neral-nexus.vercel.app'
    response = client.options('/api/v1/auth/login', headers={
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
    })
    assert response.status_code == 200
    assert response.headers.get('Access-Control-Allow-Origin') == origin

def test_cors_preflight_localhost(client):
    """Test CORS preflight OPTIONS request from local development origin"""
    origin = 'http://localhost:5173'
    response = client.options('/api/v1/auth/login', headers={
        'Origin': origin,
        'Access-Control-Request-Method': 'POST'
    })
    assert response.status_code == 200
    assert response.headers.get('Access-Control-Allow-Origin') == origin

def test_cors_unauthorized_origin(client):
    """Test that unauthorized origin does NOT get CORS headers"""
    origin = 'https://unauthorized-domain.com'
    response = client.options('/api/v1/auth/login', headers={
        'Origin': origin,
        'Access-Control-Request-Method': 'POST'
    })
    assert response.headers.get('Access-Control-Allow-Origin') != origin
