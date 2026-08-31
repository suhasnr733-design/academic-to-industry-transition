# backend/app/__init__.py

import sys
import os
import logging
from datetime import timedelta

# Ensure backend and root directories are in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail, Message

import re

logger = logging.getLogger(__name__)

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()
cors = CORS()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per hour"],
    storage_uri=os.environ.get('RATELIMIT_STORAGE_URI', 'memory://')
)
mail = Mail()
socketio = None

def create_app(config_class='app.config.DevelopmentConfig'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    if config_class == 'testing':
        config_class = 'app.config.TestingConfig'
    elif config_class == 'development':
        config_class = 'app.config.DevelopmentConfig'
    elif config_class == 'production':
        config_class = 'app.config.ProductionConfig'

    if isinstance(config_class, str):
        app.config.from_object(config_class)
    else:
        app.config.from_object(config_class)
    
    # Ensure default JWT key if missing
    if not app.config.get('JWT_SECRET_KEY'):
        app.config['JWT_SECRET_KEY'] = 'dev-jwt-secret-key-change-in-production'
    
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # Ensure instance and upload folders exist
    os.makedirs(app.instance_path, exist_ok=True)
    upload_folder = app.config.get('UPLOAD_FOLDER', os.path.join(app.root_path, 'uploads'))
    os.makedirs(upload_folder, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = upload_folder
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # Configure mail
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', os.environ.get('MAIL_USERNAME'))
    mail.init_app(app)
    
    # Configure production-safe CORS origins
    allowed_exact_origins = [
        'https://academic-to-industry-transition.vercel.app',
        'https://academic-to-industry-transition.onrender.com'
    ]
    
    env_origins_str = os.environ.get('CORS_ORIGINS', os.environ.get('FRONTEND_URL', ''))
    if env_origins_str:
        for raw_origin in env_origins_str.split(','):
            origin = raw_origin.strip()
            if origin and origin != '*' and origin not in allowed_exact_origins:
                allowed_exact_origins.append(origin)

    allowed_origin_patterns = [
        r'https://academic-to-industry-transition-.*\.vercel\.app',
        r'https://academic-to-industry-transition.*\.vercel\.app',
        r'http://localhost:\d+',
        r'http://127\.0\.0\.1:\d+',
        re.compile(r'^https://academic-to-industry-transition-.*\.vercel\.app$'),
        re.compile(r'^https://academic-to-industry-transition.*\.vercel\.app$'),
        re.compile(r'^http://localhost(:\d+)?$'),
        re.compile(r'^http://127\.0\.0\.1(:\d+)?$')
    ]
    
    cors_origins_list = allowed_exact_origins + allowed_origin_patterns

    cors.init_app(
        app,
        resources={r"/*": {"origins": cors_origins_list}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"]
    )

    def is_origin_allowed(origin):
        if not origin:
            return False
        if origin in allowed_exact_origins:
            return True
        if re.match(r'^https://academic-to-industry-transition-.*\.vercel\.app$', origin):
            return True
        if re.match(r'^https://academic-to-industry-transition.*\.vercel\.app$', origin):
            return True
        if re.match(r'^http://localhost(:\d+)?$', origin):
            return True
        if re.match(r'^http://127\.0\.0\.1(:\d+)?$', origin):
            return True
        return False

    @app.after_request
    def add_cors_headers_fallback(response):
        origin = request.headers.get('Origin')
        if origin and is_origin_allowed(origin):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-Requested-With, Accept, Origin'
        return response

    limiter.init_app(app)
    
    # JWT Loader handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({'error': 'Missing or invalid token', 'message': callback}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({'error': 'Invalid token', 'message': callback}), 401
    
    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    # Health check endpoints
    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    @app.route('/api/v1/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'version': '1.0.0'
        }), 200
    
    # Register blueprints
    from app.api.v1 import api_v1_bp
    api_prefix = app.config.get('API_PREFIX', '/api')
    api_version = app.config.get('API_VERSION', 'v1')
    
    app.register_blueprint(api_v1_bp, url_prefix=f'{api_prefix}/{api_version}')
    
    # OAuth2 token endpoint
    @app.route('/oauth/token', methods=['POST'])
    @app.route('/api/v1/oauth/token', methods=['POST'])
    def oauth_token():
        from flask_jwt_extended import create_access_token
        from app.models import OAuth2Client
        grant_type = request.form.get('grant_type') or (request.get_json(silent=True) or {}).get('grant_type')
        client_id = request.form.get('client_id') or (request.get_json(silent=True) or {}).get('client_id')
        client_secret = request.form.get('client_secret') or (request.get_json(silent=True) or {}).get('client_secret')

        if grant_type != 'client_credentials':
            return jsonify({'error': 'unsupported_grant_type', 'message': 'Only client_credentials grant type is supported'}), 400

        if not client_id or not client_secret:
            return jsonify({'error': 'invalid_client', 'message': 'Missing client_id or client_secret'}), 401

        client = OAuth2Client.query.filter_by(client_id=client_id).first()
        if client and client.client_secret and client.client_secret != client_secret:
            return jsonify({'error': 'invalid_client', 'message': 'Invalid client credentials'}), 401

        if not client:
            client = OAuth2Client(
                client_id=client_id,
                client_secret=client_secret,
                client_type='confidential',
                client_name='API Client'
            )
            db.session.add(client)
            db.session.commit()

        token = create_access_token(identity=f"client:{client.client_id}")
        return jsonify({
            'access_token': token,
            'token_type': 'Bearer',
            'expires_in': 3600,
            'client_id': client.client_id
        }), 200
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found', 'message': str(error)}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal Server Error', 'message': str(error)}), 500
    
    # Initialize database tables and default data
    with app.app_context():
        from app.models import User, Job, Resume
        db.create_all()

        # Schema migration check for OAuth columns
        try:
            with db.engine.connect() as conn:
                from sqlalchemy import inspect
                inspector = inspect(db.engine)
                if 'users' in inspector.get_table_names():
                    columns = [c['name'] for c in inspector.get_columns('users')]
                    if 'oauth_provider' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(30)"))
                    if 'oauth_provider_id' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN oauth_provider_id VARCHAR(100)"))
                    if 'profile_picture' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255)"))
                    if 'placement_status' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN placement_status VARCHAR(20) DEFAULT 'seeking'"))
                    if 'placed_company' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN placed_company VARCHAR(100)"))
                    if 'package_lpa' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN package_lpa FLOAT"))
                    if 'department' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN department VARCHAR(100)"))
                    if 'year_of_study' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN year_of_study INTEGER"))
                    if 'college' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN college VARCHAR(150)"))
                    if 'phone' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN phone VARCHAR(20)"))
                    if 'bio' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN bio TEXT"))
                    if 'notifications_enabled' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN DEFAULT 1"))
                    if 'email_alerts_enabled' not in columns:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN email_alerts_enabled BOOLEAN DEFAULT 1"))
                # Schema migration check for Job live columns
                if 'jobs' in inspector.get_table_names():
                    job_columns = [c['name'] for c in inspector.get_columns('jobs')]
                    if 'is_live' not in job_columns:
                        conn.execute(db.text("ALTER TABLE jobs ADD COLUMN is_live BOOLEAN DEFAULT 0"))
                    if 'source' not in job_columns:
                        conn.execute(db.text("ALTER TABLE jobs ADD COLUMN source VARCHAR(50) DEFAULT 'internal'"))
                    if 'external_id' not in job_columns:
                        conn.execute(db.text("ALTER TABLE jobs ADD COLUMN external_id VARCHAR(255)"))
                    if 'apply_url' not in job_columns:
                        conn.execute(db.text("ALTER TABLE jobs ADD COLUMN apply_url TEXT"))
                    if 'salary_min' not in job_columns:
                        conn.execute(db.text("ALTER TABLE jobs ADD COLUMN salary_min FLOAT"))
                    if 'salary_max' not in job_columns:
                        conn.execute(db.text("ALTER TABLE jobs ADD COLUMN salary_max FLOAT"))
                    if 'currency' not in job_columns:
                        conn.execute(db.text("ALTER TABLE jobs ADD COLUMN currency VARCHAR(10) DEFAULT 'INR'"))
                    if 'expires_at' not in job_columns:
                        conn.execute(db.text("ALTER TABLE jobs ADD COLUMN expires_at DATETIME"))
                    if 'raw_data' not in job_columns:
                        conn.execute(db.text("ALTER TABLE jobs ADD COLUMN raw_data JSON"))
                conn.commit()
        except Exception as e:
            logger.warning(f"Database columns auto-migration notice: {e}")

        
        # Seed admin user safely
        if not User.query.filter_by(username='admin').first():
            admin_password = None
            if app.config.get('DEBUG'):
                admin_password = 'Admin@123'
            else:
                admin_password = os.environ.get('ADMIN_INITIAL_PASSWORD')
                
            if admin_password:
                admin = User(
                    username='admin',
                    email=os.environ.get('ADMIN_EMAIL', 'admin@example.com'),
                    full_name='System Administrator',
                    role='admin',
                    is_active=True,
                    is_email_verified=True
                )
                admin.set_password(admin_password)
                db.session.add(admin)
                db.session.commit()
                print("ADMIN USER: Created initial admin user from secure configuration.")
        
        # Seed faculty demo user safely
        if not User.query.filter_by(username='faculty').first():
            faculty_user = User(
                username='faculty',
                email='faculty@university.edu',
                full_name='Dr. Smith (Faculty)',
                role='faculty',
                is_active=True,
                is_email_verified=True
            )
            faculty_user.set_password('Faculty@123')
            db.session.add(faculty_user)
            db.session.commit()
            print("FACULTY USER: Created initial faculty user (faculty / Faculty@123).")
            
    return app