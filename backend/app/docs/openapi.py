# backend/app/docs/openapi.py

from flask import jsonify, send_from_directory
import yaml
import os

def setup_openapi(app):
    """Setup OpenAPI documentation"""
    
    @app.route('/api/openapi.yaml')
    def get_openapi():
        """Serve OpenAPI specification"""
        spec_path = os.path.join(os.path.dirname(__file__), 'openapi.yaml')
        with open(spec_path, 'r') as f:
            return f.read(), 200, {'Content-Type': 'text/yaml'}
    
    @app.route('/api/docs')
    def api_docs():
        """API documentation UI"""
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>API Documentation</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css" />
            <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script>
                window.onload = function() {
                    SwaggerUIBundle({
                        url: "/api/openapi.yaml",
                        dom_id: '#swagger-ui',
                        presets: [
                            SwaggerUIBundle.presets.apis,
                            SwaggerUIBundle.SwaggerUIStandalonePreset
                        ],
                        layout: "BaseLayout",
                        deepLinking: true
                    });
                }
            </script>
        </body>
        </html>
        '''