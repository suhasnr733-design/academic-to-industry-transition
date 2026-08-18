import os
from datetime import datetime, timedelta


class ProductionConfig:
    """Production configuration for data pipeline"""

    # Data Sources
    JOB_SOURCES = {
        'naukri': {
            'enabled': True,
            'rate_limit': 2,
            'max_pages': 50
        },
        'linkedin': {
            'enabled': True,
            'rate_limit': 3,
            'max_pages': 30
        },
        'indeed': {
            'enabled': True,
            'rate_limit': 1.5,
            'max_pages': 100
        }
    }

    COURSE_SOURCES = {
        'coursera': {
            'enabled': True,
            'rate_limit': 1,
            'max_items': 500
        },
        'udemy': {
            'enabled': True,
            'rate_limit': 1,
            'max_items': 300
        }
    }

    # Storage
    STORAGE = {
        'raw_data': 'data/raw/',
        'processed_data': 'data/processed/',
        'archived_data': 'data/archive/',
        'backup_data': 'data/backup/'
    }

    # Database
    DATABASE = {
        'url': os.environ.get(
            'DATABASE_URL',
            'postgresql://postgres:password@localhost:5432/pipeline_db'
        ),
        'pool_size': 10,
        'max_overflow': 20
    }

    # Processing
    PROCESSING = {
        'batch_size': 1000,
        'parallel_workers': 4,
        'retry_attempts': 3,
        'retry_delay': 60
    }

    # Quality
    QUALITY = {
        'min_quality_score': 70,
        'max_error_rate': 0.05,
        'data_freshness_hours': 24
    }