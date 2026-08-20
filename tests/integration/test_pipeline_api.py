# tests/integration/test_pipeline_api.py

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

    def test_query_analysis_and_stats_api(self, client):
        res1 = client.get('/api/v1/pipeline/query/analysis')
        assert res1.status_code == 200
        assert res1.get_json()['status'] == 'success'

        res2 = client.get('/api/v1/pipeline/query/stats')
        assert res2.status_code == 200
        assert res2.get_json()['status'] == 'success'

    def test_automated_quality_api(self, client):
        payload = {
            'records': [
                {'title': 'Software Engineer', 'company': 'Google'},
                {'title': 'Data Scientist', 'company': 'Meta'}
            ]
        }
        res1 = client.post('/api/v1/pipeline/quality/run', json=payload)
        assert res1.status_code == 200
        assert res1.get_json()['status'] == 'success'

        res2 = client.get('/api/v1/pipeline/quality/summary')
        assert res2.status_code == 200
        assert res2.get_json()['status'] == 'success'

    def test_anomalies_api(self, client):
        payload = {
            'records': [
                {'val': 10}, {'val': 12}, {'val': 11}, {'val': 1000}
            ]
        }
        res = client.post('/api/v1/pipeline/anomalies', json=payload)
        assert res.status_code == 200
        assert res.get_json()['status'] == 'success'

    def test_resilience_test_apis(self, client):
        res1 = client.get('/api/v1/pipeline/test/retry')
        assert res1.status_code == 200
        assert res1.get_json()['status'] == 'success'

        res2 = client.get('/api/v1/pipeline/test/circuit')
        assert res2.status_code == 200
        assert res2.get_json()['status'] == 'success'

    def test_backup_apis(self, client):
        res1 = client.get('/api/v1/pipeline/backup/list')
        assert res1.status_code == 200
        assert res1.get_json()['status'] == 'success'

    def test_production_and_health_apis(self, client):
        # /optimize API
        payload = {'records': [{'col1': 1, 'col2': 'A'}, {'col1': 2, 'col2': 'B'}]}
        res_opt = client.post('/api/v1/pipeline/optimize', json=payload)
        assert res_opt.status_code == 200
        assert res_opt.get_json()['status'] == 'success'

        # /health API
        res_health = client.get('/api/v1/pipeline/health')
        assert res_health.status_code == 200
        assert res_health.get_json()['status'] == 'success'

        # /cleanup/run API
        res_cleanup = client.post('/api/v1/pipeline/cleanup/run')
        assert res_cleanup.status_code == 200
        assert res_cleanup.get_json()['status'] == 'success'

