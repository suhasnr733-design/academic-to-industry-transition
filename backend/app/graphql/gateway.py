# backend/app/graphql/gateway.py

import requests
from flask import request, jsonify, current_app
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class FederatedGateway:
    """GraphQL Federation Gateway"""
    
    def __init__(self):
        self.services = {
            'user': {
                'url': 'http://user-service:5001/graphql',
                'schema': self._load_user_schema()
            },
            'resume': {
                'url': 'http://resume-service:5002/graphql',
                'schema': self._load_resume_schema()
            },
            'job': {
                'url': 'http://job-service:5003/graphql',
                'schema': self._load_job_schema()
            }
        }
    
    def _load_user_schema(self):
        """Load user service schema"""
        return """
        type User @key(fields: "id") {
            id: ID!
            username: String!
            email: String!
            full_name: String!
            role: String!
            department: String
        }
        """
    
    def _load_resume_schema(self):
        """Load resume service schema"""
        return """
        type Resume @key(fields: "id") {
            id: ID!
            user_id: Int!
            filename: String!
            skills: [String!]
            employability_score: Float
            status: String!
        }
        """
    
    def _load_job_schema(self):
        """Load job service schema"""
        return """
        type Job @key(fields: "id") {
            id: ID!
            title: String!
            company: String!
            required_skills: [String!]
            location: String
            domain: String
        }
        """
    
    def route_query(self, query: str, variables: Dict = None) -> Dict[str, Any]:
        """Route GraphQL query to appropriate service"""
        # Parse query to determine service
        service = self._get_service(query)
        
        if not service:
            return {'error': 'Unknown service'}
        
        try:
            response = requests.post(
                self.services[service]['url'],
                json={'query': query, 'variables': variables or {}},
                timeout=10
            )
            return response.json()
        except Exception as e:
            logger.error(f"Federation error: {e}")
            return {'error': str(e)}
    
    def _get_service(self, query: str) -> str:
        """Determine service from query"""
        query_lower = query.lower()
        
        if 'user' in query_lower or 'createuser' in query_lower:
            return 'user'
        elif 'resume' in query_lower:
            return 'resume'
        elif 'job' in query_lower:
            return 'job'
        else:
            return None
    
    def federated_query(self, query: str, variables: Dict = None) -> Dict[str, Any]:
        """Execute federated query across services"""
        # Parse the query to find fields from different services
        parts = self._parse_federated_query(query)
        
        results = {}
        for service, subquery in parts.items():
            if service in self.services:
                result = self.route_query(subquery, variables)
                results[service] = result
        
        # Merge results
        return self._merge_results(results)
    
    def _parse_federated_query(self, query: str) -> Dict[str, str]:
        """Parse federated query into service-specific subqueries"""
        # Simple parsing - in production use AST parsing
        parts = {}
        
        # Extract fields by service
        if 'User' in query:
            parts['user'] = query
        if 'Resume' in query:
            parts['resume'] = query
        if 'Job' in query:
            parts['job'] = query
        
        return parts
    
    def _merge_results(self, results: Dict) -> Dict[str, Any]:
        """Merge results from different services"""
        merged = {}
        for service, result in results.items():
            if 'data' in result:
                for key, value in result['data'].items():
                    merged[key] = value
            elif 'errors' in result:
                return {'errors': result['errors']}
        
        return {'data': merged}

# Flask route for federation
def create_federation_routes(app):
    """Create federation routes"""
    gateway = FederatedGateway()
    
    @app.route('/api/graphql/federated', methods=['POST'])
    def federated_graphql():
        data = request.get_json()
        query = data.get('query')
        variables = data.get('variables')
        
        if not query:
            return jsonify({'error': 'Query required'}), 400
        
        result = gateway.federated_query(query, variables)
        return jsonify(result), 200