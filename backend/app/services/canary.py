# backend/app/services/canary.py

import random
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class CanaryDeployment:
    def __init__(self):
        self.deployments = {}
    
    def create_canary(self, service, new_version, percentage=10):
        deployment = {
            'service': service,
            'new_version': new_version,
            'percentage': percentage,
            'active': True,
            'created_at': datetime.now().isoformat(),
            'metrics': {'requests': 0, 'errors': 0}
        }
        self.deployments[service] = deployment
        logger.info(f"✅ Canary deployment created for {service}")
        return deployment
    
    def route_request(self, service):
        deployment = self.deployments.get(service)
        if not deployment or not deployment['active']:
            return 'stable'
        
        if random.randint(1, 100) <= deployment['percentage']:
            deployment['metrics']['requests'] += 1
            return 'canary'
        return 'stable'
    
    def record_error(self, service):
        deployment = self.deployments.get(service)
        if deployment:
            deployment['metrics']['errors'] += 1
    
    def get_status(self, service):
        deployment = self.deployments.get(service)
        if not deployment:
            return None
        
        metrics = deployment['metrics']
        error_rate = metrics['errors'] / max(metrics['requests'], 1)
        
        return {
            'service': service,
            'percentage': deployment['percentage'],
            'requests': metrics['requests'],
            'errors': metrics['errors'],
            'error_rate': error_rate,
            'status': 'healthy' if error_rate < 0.05 else 'unhealthy'
        }
    
    def promote(self, service):
        if service in self.deployments:
            self.deployments[service]['percentage'] = 100
            self.deployments[service]['active'] = False
            logger.info(f"✅ Canary promoted for {service}")
    
    def rollback(self, service):
        if service in self.deployments:
            self.deployments[service]['active'] = False
            logger.info(f"✅ Canary rolled back for {service}")

canary = CanaryDeployment()
