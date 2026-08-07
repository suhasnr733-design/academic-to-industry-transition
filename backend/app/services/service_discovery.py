# backend/app/services/service_discovery.py

import requests
import json
import time
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class ServiceDiscovery:
    """Service discovery for microservices"""
    
    SERVICES = {
        'ml_service': {
            'url': 'http://ml-service:8000',
            'health_endpoint': '/health',
            'version': '1.0.0',
            'active': True
        },
        'auth_service': {
            'url': 'http://auth-service:5001',
            'health_endpoint': '/health',
            'version': '1.0.0',
            'active': True
        },
        'notification_service': {
            'url': 'http://notification-service:5002',
            'health_endpoint': '/health',
            'version': '1.0.0',
            'active': True
        }
    }
    
    @classmethod
    def get_service_url(cls, service_name):
        """Get service URL"""
        service = cls.SERVICES.get(service_name)
        if not service:
            return None
        return service['url']
    
    @classmethod
    def check_health(cls, service_name):
        """Check service health"""
        service = cls.SERVICES.get(service_name)
        if not service:
            return False
        
        try:
            response = requests.get(
                f"{service['url']}{service['health_endpoint']}",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False
    
    @classmethod
    def get_healthy_services(cls):
        """Get all healthy services"""
        healthy = []
        for name, service in cls.SERVICES.items():
            if cls.check_health(name):
                healthy.append(name)
        return healthy

class ServiceClient:
    """Client for inter-service communication"""
    
    def __init__(self, service_name):
        self.service_name = service_name
        self.base_url = ServiceDiscovery.get_service_url(service_name)
    
    def request(self, method, endpoint, data=None, headers=None):
        """Make request to service"""
        if not self.base_url:
            return {'error': 'Service not found'}
        
        if not ServiceDiscovery.check_health(self.service_name):
            return {'error': 'Service unavailable'}
        
        try:
            url = f"{self.base_url}{endpoint}"
            headers = headers or {}
            
            response = requests.request(
                method=method,
                url=url,
                json=data,
                headers=headers,
                timeout=30
            )
            
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'error': str(e)}