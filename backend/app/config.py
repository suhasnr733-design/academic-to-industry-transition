import os
import tempfile  # <-- Add this import at the top
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('DEBUG', 'False') == 'True'
    
    # Database default
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///' + os.path.join(tempfile.gettempdir(), 'site.db')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 86400  # 24 hours
    
    # Upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'pdf', 'docx'}
    
    # ML
    MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data/models')
    
    # API
    API_PREFIX = '/api'
    API_VERSION = 'v1'

class DevelopmentConfig(Config):
    DEBUG = True
    # Safe absolute path away from OneDrive
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(tempfile.gettempdir(), 'dev.db')

class TestingConfig(Config):
    TESTING = True
    # Safe absolute path away from OneDrive
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(tempfile.gettempdir(), 'test.db')

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')