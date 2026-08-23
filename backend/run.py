# backend/run.py

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

config_name = os.environ.get(
    'FLASK_CONFIG',
    'app.config.ProductionConfig' if (os.environ.get('RENDER') or os.environ.get('PORT')) else 'app.config.DevelopmentConfig'
)
app = create_app(config_name)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', False))
