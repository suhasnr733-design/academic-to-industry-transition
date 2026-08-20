# backend/app/services/service_mesh.py

import requests
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ServiceMesh:
    """Service mesh implementation for microservices"""
    
    def __init__(self):
        self.services = {}
        self.circuit_breakers = {}
        self.register_services()
    
    def register_services(self):
        """Register all services in mesh"""
        self.services = {
            'auth': {'urls': ['http://auth-service:5001'], 'version': '1.0.0', 'active': True},
            'resume': {'urls': ['http://resume-service:5002'], 'version': '1.0.0', 'active': True},
            'job': {'urls': ['http://job-service:5003'], 'version': '1.0.0', 'active': True},
            'ml': {'urls': ['http://ml-service:8000'], 'version': '1.0.0', 'active': True}
        }
        
        for service in self.services:
            self.circuit_breakers[service] = {
                'state': 'closed', 'failures': 0, 'threshold': 5, 'timeout': 60
            }
        logger.info("✅ Service mesh initialized")
    
    def get_service_url(self, service):
        if service not in self.services:
            return None
        return self.services[service]['urls'][0]
    
    def check_service_health(self, service):
        try:
            response = requests.get(f"{self.get_service_url(service)}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def call_service(self, service, method, endpoint, data=None, headers=None):
        if self.is_circuit_open(service):
            return {'error': f'Service {service} unavailable'}
        
        url = f"{self.get_service_url(service)}{endpoint}"
        try:
            response = requests.request(method, url, json=data, headers=headers or {}, timeout=30)
            self.record_success(service)
            return response.json()
        except Exception as e:
            self.record_failure(service)
            return {'error': str(e)}
    
    def is_circuit_open(self, service):
        if service not in self.circuit_breakers:
            return False
        cb = self.circuit_breakers[service]
        if cb['state'] == 'open':
            if (datetime.now() - cb['last_failure']).seconds > cb['timeout']:
                cb['state'] = 'half-open'
                return False
            return True
        return False
    
    def record_success(self, service):
        if service in self.circuit_breakers:
            self.circuit_breakers[service]['failures'] = 0
            if self.circuit_breakers[service]['state'] == 'half-open':
                self.circuit_breakers[service]['state'] = 'closed'
    
    def record_failure(self, service):
        if service in self.circuit_breakers:
            cb = self.circuit_breakers[service]
            cb['failures'] += 1
            cb['last_failure'] = datetime.now()
            if cb['failures'] >= cb['threshold']:
                cb['state'] = 'open'
    
    def get_mesh_status(self):
        return {
            'services': self.services,
            'circuit_breakers': self.circuit_breakers,
            'timestamp': datetime.now().isoformat()
        }