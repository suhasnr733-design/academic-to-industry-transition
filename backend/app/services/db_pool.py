# backend/app/services/db_pool.py

from sqlalchemy import create_engine, pool
from sqlalchemy.orm import sessionmaker
from app.config import Config
import logging

logger = logging.getLogger(__name__)

class DatabasePool:
    def __init__(self):
        self.engine = None
        self.session_factory = None
        self._init_pool()
    
    def _init_pool(self):
        """Initialize connection pool"""
        self.engine = create_engine(
            Config.DATABASE_URL,
            pool_size=20,
            max_overflow=40,
            pool_timeout=30,
            pool_recycle=3600,
            pool_pre_ping=True,
            echo=False
        )
        
        self.session_factory = sessionmaker(
            bind=self.engine,
            expire_on_commit=False
        )
        
        logger.info("✅ Database connection pool initialized")
    
    def get_session(self):
        return self.session_factory()
    
    def get_engine(self):
        return self.engine

db_pool = DatabasePool()