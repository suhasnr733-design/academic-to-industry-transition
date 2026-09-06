import pytest
from app import create_app, limiter

@pytest.fixture
def app():
    app = create_app('testing')
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_options_preflight_jobs(client):
    """CORS preflight for /api/v1/jobs must return 200/204 and CORS headers"""
    headers = {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type, X-Silent-Error'
    }
    response = client.options('/api/v1/jobs', headers=headers)
    assert response.status_code in (200, 204)
    assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:5173'
    assert 'GET' in response.headers.get('Access-Control-Allow-Methods', '')

def test_options_preflight_my_nominations(client):
    """CORS preflight for /api/v1/placement/my-nominations must return 200/204 and CORS headers"""
    headers = {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type, X-Silent-Error'
    }
    response = client.options('/api/v1/placement/my-nominations', headers=headers)
    assert response.status_code in (200, 204)
    assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:5173'
    assert 'GET' in response.headers.get('Access-Control-Allow-Methods', '')

def test_get_jobs_success(client):
    """GET /api/v1/jobs should return 200 and jobs list"""
    headers = {'Origin': 'http://localhost:5173'}
    response = client.get('/api/v1/jobs', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'jobs' in data
    assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:5173'

def test_preflight_not_rate_limited(client):
    """OPTIONS preflight requests should never receive 429 even under heavy request load"""
    headers = {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type, X-Silent-Error'
    }
    for _ in range(50):
        response = client.options('/api/v1/jobs', headers=headers)
        assert response.status_code in (200, 204)
        assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:5173'
