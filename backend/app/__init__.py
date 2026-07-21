from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
import os

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()
cors = CORS()

def create_app(config_class='app.config.Config'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_class)
    
    # Ensure instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app)
    
    # Register blueprints 
    from app.routes.auth import auth_bp
    # from app.routes.resume import resume_bp
    # from app.routes.job import job_bp
    # from app.routes.prediction import prediction_bp
    
    api_prefix = app.config.get('API_PREFIX', '/api')
    api_version = app.config.get('API_VERSION', 'v1')
    
    app.register_blueprint(auth_bp, url_prefix=f'{api_prefix}/{api_version}/auth')
    # app.register_blueprint(resume_bp, url_prefix=f'{api_prefix}/{api_version}/resume')
    # app.register_blueprint(job_bp, url_prefix=f'{api_prefix}/{api_version}/jobs')
    # app.register_blueprint(prediction_bp, url_prefix=f'{api_prefix}/{api_version}/prediction')
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app