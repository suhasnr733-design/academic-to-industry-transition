# backend/app/docs/swagger.py

from flask import jsonify
from flask_swagger_ui import get_swaggerui_blueprint
import yaml
import os

SWAGGER_URL = '/api/docs'
API_URL = '/api/swagger.json'

def setup_swagger(app):
    """Setup Swagger documentation"""
    
    # Load OpenAPI spec
    spec_path = os.path.join(os.path.dirname(__file__), 'openapi.yaml')
    with open(spec_path, 'r') as f:
        spec = yaml.safe_load(f)
    
    @app.route(API_URL)
    def swagger_json():
        return jsonify(spec)
    
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={
            'app_name': "Academic-to-Industry Transition API"
        }
    )
    
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)