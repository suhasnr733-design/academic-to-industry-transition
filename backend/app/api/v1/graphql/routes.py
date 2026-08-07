# backend/app/api/v1/graphql/routes.py

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.v1.graphql import graphql_bp
from app.graphql.schema import schema
import json

@graphql_bp.route('', methods=['POST'])
@jwt_required(optional=True)
def graphql_query():
    """GraphQL endpoint"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid request'}), 400
    
    query = data.get('query')
    variables = data.get('variables', {})
    operation_name = data.get('operationName')
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    # Execute GraphQL query
    result = schema.execute(
        query,
        variables=variables,
        operation_name=operation_name,
        context={'user_id': get_jwt_identity() if get_jwt_identity() else None}
    )
    
    if result.errors:
        return jsonify({
            'errors': [str(e) for e in result.errors]
        }), 400
    
    return jsonify(result.data), 200

@graphql_bp.route('/explore', methods=['GET'])
def graphql_explorer():
    """GraphQL Explorer UI"""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>GraphQL Explorer</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
        <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
    </head>
    <body>
        <div id="root"></div>
        <script>
            window.addEventListener('load', function() {
                GraphQLPlayground.init(document.getElementById('root'), {
                    endpoint: '/api/v1/graphql',
                    subscriptionEndpoint: '/api/v1/graphql'
                })
            })
        </script>
    </body>
    </html>
    '''