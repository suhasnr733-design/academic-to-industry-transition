import sys
import os

sys.path.insert(0, os.path.abspath('backend'))

import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app('app.config.TestingConfig')
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client



class TestPipelineAPIEndpoints:

    def test_get_pipeline_status(self, client):
        res = client.get('/api/v1/pipeline/status')
        assert res.status_code == 200
        data = res.get_json()
        assert data['status'] == 'success'
        assert 'metrics' in data
        assert 'daily_trend' in data

    def test_get_pipeline_quality(self, client):
        res = client.get('/api/v1/pipeline/quality')
        assert res.status_code == 200
        data = res.get_json()
        assert data['status'] == 'success'
        assert 'summary' in data
        assert 'current' in data

    def test_get_pipeline_alerts(self, client):
        res = client.get('/api/v1/pipeline/alerts')
        assert res.status_code == 200
        data = res.get_json()
        assert data['status'] == 'success'
        assert 'alerts' in data

    def test_get_etl_status(self, client):
        res = client.get('/api/v1/pipeline/etl/status')
        assert res.status_code == 200
        data = res.get_json()
        assert data['status'] == 'success'
        assert 'is_running' in data

    def test_validate_pipeline_data(self, client):
        res = client.get('/api/v1/pipeline/validate')
        assert res.status_code == 200
        data = res.get_json()
        assert data['status'] == 'success'
        assert 'summary' in data

    def test_get_optimization_status(self, client):
        res = client.get('/api/v1/pipeline/optimization/status')
        assert res.status_code == 200
        data = res.get_json()
        assert data['status'] == 'success'
        assert 'max_workers' in data

    def test_get_cache_stats(self, client):
        res = client.get('/api/v1/pipeline/cache/stats')
        assert res.status_code == 200
        data = res.get_json()
        assert data['status'] == 'success'
        assert 'cache_stats' in data
