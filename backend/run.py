# backend/run.py

import sys
import os

# Add backend and project root directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)
sys.path.insert(0, backend_dir)
sys.path.insert(0, root_dir)

from app import create_app

from app import create_app

from app import create_app

config_name = os.environ.get(
    'FLASK_CONFIG',
    'app.config.ProductionConfig' if (os.environ.get('RENDER') or os.environ.get('PORT')) else 'app.config.DevelopmentConfig'
)
app = create_app(config_name)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', False))