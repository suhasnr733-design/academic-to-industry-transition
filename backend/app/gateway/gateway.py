# backend/app/gateway/gateway.py

from flask import request, jsonify, current_app
import requests
import time
import json
from functools import wraps
import hashlib
from app.extensions import redis_client
import logging

logger = logging.getLogger(__name__)

class APIGateway:
    """Advanced API Gateway with routing and rate limiting"""
    
    def __init__(self):
        self.routes = {
            '/api/v1/auth': {
                'service': 'auth-service',
                'url': 'http://auth-service:5001',
                'rate_limit': 100,  # per minute
                'timeout': 30
            },
            '/api/v1/resume': {
                'service': 'resume-service',
                'url': 'http://resume-service:5002',
                'rate_limit': 50,
                'timeout': 60
            },
            '/api/v1/jobs': {
                'service': 'job-service',
                'url': 'http://job-service:5003',
                'rate_limit': 200,
                'timeout': 30
            },
            '/api/v1/prediction': {
                'service': 'ml-service',
                'url': 'http://ml-service:8000',
                'rate_limit': 20,
                'timeout': 30
            },
            '/api/v1/notifications': {
                'service': 'notification-service',
                'url': 'http://notification-service:5004',
                'rate_limit': 150,
                'timeout': 20
            },
            '/api/v1/admin': {
                'service': 'admin-service',
                'url': 'http://admin-service:5005',
                'rate_limit': 50,
                'timeout': 30
            }
        }
        self.circuit_breakers = {}
    
    def get_service_url(self, path: str) -> str:
        """Get service URL for a path"""
        for route, config in self.routes.items():
            if path.startswith(route):
                return config['url']
        return None
    
    def get_rate_limit(self, path: str) -> int:
        """Get rate limit for a path"""
        for route, config in self.routes.items():
            if path.startswith(route):
                return config.get('rate_limit', 100)
        return 100
    
    def get_timeout(self, path: str) -> int:
        """Get timeout for a path"""
        for route, config in self.routes.items():
            if path.startswith(route):
                return config.get('timeout', 30)
        return 30
    
    def check_rate_limit(self, path: str, client_id: str) -> bool:
        """Check if rate limit is exceeded"""
        if not redis_client:
            return True
        
        key = f"gateway:ratelimit:{client_id}:{path}"
        limit = self.get_rate_limit(path)
        
        current = redis_client.get(key)
        if current is None:
            redis_client.setex(key, 60, 1)
            return True
        
        count = int(current)
        if count >= limit:
            return False
        
        redis_client.incr(key)
        return True
    
    def get_circuit_breaker(self, service: str):
        """Get circuit breaker for a service"""
        if service not in self.circuit_breakers:
            self.circuit_breakers[service] = {
                'state': 'closed',  # closed, open, half-open
                'failures': 0,
                'last_failure': 0,
                'threshold': 5,
                'timeout': 60  # seconds
            }
        return self.circuit_breakers[service]
    
    def is_circuit_open(self, service: str) -> bool:
        """Check if circuit is open for a service"""
        cb = self.get_circuit_breaker(service)
        
        if cb['state'] == 'open':
            if time.time() - cb['last_failure'] > cb['timeout']:
                cb['state'] = 'half-open'
                return False
            return True
        
        return False
    
    def record_failure(self, service: str):
        """Record a failure for circuit breaker"""
        cb = self.get_circuit_breaker(service)
        cb['failures'] += 1
        cb['last_failure'] = time.time()
        
        if cb['failures'] >= cb['threshold']:
            cb['state'] = 'open'
            logger.warning(f"Circuit opened for {service}")
    
    def record_success(self, service: str):
        """Record a success for circuit breaker"""
        cb = self.get_circuit_breaker(service)
        cb['failures'] = 0
        
        if cb['state'] == 'half-open':
            cb['state'] = 'closed'
            logger.info(f"Circuit closed for {service}")
    
    def route_request(self, path: str, method: str, headers: dict, 
                      data: dict = None, query_params: dict = None) -> tuple:
        """Route request to appropriate service"""
        # Get service URL
        service_url = self.get_service_url(path)
        if not service_url:
            return {'error': 'Service not found'}, 404
        
        # Get client ID for rate limiting
        client_id = request.headers.get('X-Forwarded-For', request.remote_addr)
        if 'Authorization' in headers:
            client_id = f"{client_id}:{headers['Authorization'][:20]}"
        
        # Check rate limit
        if not self.check_rate_limit(path, client_id):
            return {
                'error': 'Rate limit exceeded',
                'message': 'Too many requests. Please try again later.'
            }, 429
        
        # Get service name
        service_name = None
        for route, config in self.routes.items():
            if path.startswith(route):
                service_name = config['service']
                break
        
        # Check circuit breaker
        if service_name and self.is_circuit_open(service_name):
            return {
                'error': 'Service unavailable',
                'message': f'{service_name} is currently unavailable'
            }, 503
        
        # Build target URL
        target_url = f"{service_url}{path}"
        
        # Forward request
        try:
            response = requests.request(
                method=method,
                url=target_url,
                headers=headers,
                params=query_params,
                json=data,
                timeout=self.get_timeout(path)
            )
            
            # Record success
            if service_name:
                self.record_success(service_name)
            
            # Get response
            try:
                response_data = response.json()
            except:
                response_data = {'message': response.text}
            
            return response_data, response.status_code
            
        except requests.exceptions.Timeout:
            if service_name:
                self.record_failure(service_name)
            return {'error': 'Service timeout'}, 504
            
        except requests.exceptions.ConnectionError:
            if service_name:
                self.record_failure(service_name)
            return {'error': 'Service connection error'}, 503
            
        except Exception as e:
            if service_name:
                self.record_failure(service_name)
            logger.error(f"Gateway error: {e}")
            return {'error': str(e)}, 500

# Flask route handler
def create_gateway_routes(app):
    """Create gateway routes"""
    gateway = APIGateway()
    
    @app.route('/api/v1/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    def gateway_handler(path):
        """Handle all requests through gateway"""
        full_path = f"/api/v1/{path}"
        
        # Get headers
        headers = {k: v for k, v in request.headers.items() 
                   if k.lower() not in ['host', 'content-length']}
        
        # Get data
        data = request.get_json() if request.is_json else None
        
        # Get query params
        query_params = {k: v for k, v in request.args.items()}
        
        # Route request
        response_data, status_code = gateway.route_request(
            full_path,
            request.method,
            headers,
            data,
            query_params
        )
        
        return jsonify(response_data), status_code