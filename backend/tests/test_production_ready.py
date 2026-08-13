# backend/tests/test_production_ready.py

import pytest
from app import create_app
from app.services.production_ready import ProductionHardening

class TestProductionReadiness:
    
    def test_logging_setup(self):
        """Test production logging"""
        logger = ProductionHardening.setup_logging()
        assert logger is not None
        logger.info("Test log message")
        print("✅ Logging test passed")
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        app = create_app('app.config.TestingConfig')
        ProductionHardening.setup_health_checks(app)
        
        with app.test_client() as client:
            response = client.get('/health')
            assert response.status_code == 200
            assert response.json['status'] == 'healthy'
            print("✅ Health endpoint test passed")
    
    def test_resource_monitoring(self):
        """Test resource monitoring"""
        resources = ProductionHardening.monitor_resources()
        assert 'memory' in resources
        assert 'cpu' in resources
        print(f"Resources: {resources}")