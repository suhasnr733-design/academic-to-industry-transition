# data_pipeline/config.py

import os
from dotenv import load_dotenv
import yaml

load_dotenv('.env.data')

class DataConfig:
    """Data pipeline configuration"""
    
    # Directories
    RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data/raw')
    PROCESSED_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data/processed')
    CURATED_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data/curated')
    LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data/logs')
    MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data/models')
    
    # Database configuration
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///data/processed/industry_data.db')
    
    # API Keys
    COURSERA_API_KEY = os.environ.get('COURSERA_API_KEY')
    UDEMY_API_KEY = os.environ.get('UDEMY_API_KEY')
    
    # Scraping Configuration
    SCRAPING_DELAY = 2  # seconds between requests
    USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    
    # Data Validation Settings
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    REQUIRED_SKILLS = ['Python', 'Java', 'SQL', 'Git']
    MIN_SKILLS_PER_JOB = 3
    
    # Logging Configuration
    LOG_LEVEL = 'INFO'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'