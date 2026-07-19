# backend/app/services/db_optimizer.py

from sqlalchemy import text
from app.extensions import db
import logging

logger = logging.getLogger(__name__)

class DatabaseOptimizer:
    """Database optimization utilities"""
    
    @staticmethod
    def create_indexes():
        """Create database indexes for performance"""
        indexes = [
            # User table indexes
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
            "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
            "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);",
            
            # Resume table indexes
            "CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);",
            "CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at);",
            
            # Job table indexes
            "CREATE INDEX IF NOT EXISTS idx_jobs_domain ON jobs(domain);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date);",
            
            # Assessment indexes
            "CREATE INDEX IF NOT EXISTS idx_assessment_user_id ON assessment_results(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_assessment_type ON assessment_results(assessment_type);"
        ]
        
        with db.engine.connect() as conn:
            for index in indexes:
                try:
                    conn.execute(text(index))
                    conn.commit()
                    logger.info(f"Created index: {index.split('ON')[1].strip() if 'ON' in index else index}")
                except Exception as e:
                    logger.error(f"Error creating index: {e}")
    
    @staticmethod
    def analyze_tables():
        """Analyze tables for query optimization"""
        tables = ['users', 'resumes', 'jobs', 'assessment_results']
        
        with db.engine.connect() as conn:
            for table in tables:
                try:
                    conn.execute(text(f"ANALYZE {table};"))
                    conn.commit()
                    logger.info(f"Analyzed table: {table}")
                except Exception as e:
                    logger.error(f"Error analyzing {table}: {e}")
    
    @staticmethod
    def vacuum():
        """Vacuum database (PostgreSQL)"""
        try:
            with db.engine.connect() as conn:
                conn.execute(text("VACUUM ANALYZE;"))
                conn.commit()
                logger.info("Database vacuumed")
        except Exception as e:
            logger.error(f"Vacuum error: {e}")
    
    @staticmethod
    def optimize_all():
        """Run all optimizations"""
        logger.info("Starting database optimization...")
        DatabaseOptimizer.create_indexes()
        DatabaseOptimizer.analyze_tables()
        DatabaseOptimizer.vacuum()
        logger.info("Database optimization complete")