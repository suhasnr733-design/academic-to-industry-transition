import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))
# Store database in user home directory to avoid OneDrive file locking issues on Windows
data_dir = os.path.join(os.path.expanduser('~'), '.transition_ai')
os.makedirs(data_dir, exist_ok=True)
default_db_path = 'sqlite:///' + os.path.join(data_dir, 'app.db').replace('\\', '/')

def resolve_db_uri(raw_uri):
    if not raw_uri:
        return default_db_path
    if raw_uri.startswith('postgres://'):
        return raw_uri.replace('postgres://', 'postgresql://', 1)
    if raw_uri.startswith('sqlite:///'):
        path_part = raw_uri[10:]
        if not os.path.isabs(path_part):
            # Resolve relative path safely in data_dir
            abs_path = os.path.join(data_dir, os.path.basename(path_part))
            return 'sqlite:///' + abs_path.replace('\\', '/')
    return raw_uri

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('DEBUG', 'False') == 'True'
    
    # Database default (safe from OneDrive file locks and permanent)
    SQLALCHEMY_DATABASE_URI = resolve_db_uri(os.environ.get('DATABASE_URL'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRES = 604800  # 7 days
    
    # Upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
    
    # ML
    MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data/models')
    
    # API
    API_PREFIX = '/api'
    API_VERSION = 'v1'

    # Mail / SMTP Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp-relay.brevo.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', os.environ.get('MAIL_USERNAME'))

    # Job Provider & Real-Time Aggregator Configurations
    RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY')
    ADZUNA_APP_ID = os.environ.get('ADZUNA_APP_ID')
    ADZUNA_APP_KEY = os.environ.get('ADZUNA_APP_KEY')
    DEFAULT_JOB_LOCATION = os.environ.get('DEFAULT_JOB_LOCATION', 'India')
    JOB_SYNC_INTERVAL_HOURS = int(os.environ.get('JOB_SYNC_INTERVAL_HOURS', 24))
    REMOTIVE_API_BASE_URL = os.environ.get('REMOTIVE_API_BASE_URL', 'https://remotive.com/api/remote-jobs')
    ARBEITNOW_API_BASE_URL = os.environ.get('ARBEITNOW_API_BASE_URL', 'https://www.arbeitnow.com/api/job-board-api')

    # OAuth & Frontend URL Configurations
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/v1/auth/google/callback')
    
    LINKEDIN_CLIENT_ID = os.environ.get('LINKEDIN_CLIENT_ID')
    LINKEDIN_CLIENT_SECRET = os.environ.get('LINKEDIN_CLIENT_SECRET')
    LINKEDIN_REDIRECT_URI = os.environ.get('LINKEDIN_REDIRECT_URI', 'http://localhost:5000/api/v1/auth/linkedin/callback')

class DevelopmentConfig(Config):
    DEBUG = True
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    SQLALCHEMY_DATABASE_URI = resolve_db_uri(os.environ.get('DATABASE_URL'))

class TestingConfig(Config):
    TESTING = True
    FRONTEND_URL = 'http://localhost:5173'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(data_dir, 'test.db').replace('\\', '/')

class ProductionConfig(Config):
    DEBUG = False
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://academic-to-industry-transition.vercel.app')
    TESTING = False
    SQLALCHEMY_DATABASE_URI = resolve_db_uri(os.environ.get('DATABASE_URL'))