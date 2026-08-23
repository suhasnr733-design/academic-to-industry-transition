# backend/app/services/db_performance.py

from sqlalchemy import text
from app.extensions import db
import logging

logger = logging.getLogger(__name__)

class DBPerformanceOptimizer:
    @staticmethod
    def create_performance_indexes():
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
            "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);",
            "CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_domain ON jobs(domain);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);"
        ]
        
        with db.engine.connect() as conn:
            for index in indexes:
                try:
                    conn.execute(text(index))
                    conn.commit()
                    logger.info(f"✅ Created index: {index}")
                except Exception as e:
                    logger.error(f"Error creating index: {e}")
    
    @staticmethod
    def analyze_slow_queries():
        try:
            with db.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT query, calls, total_time, mean_time
                    FROM pg_stat_statements
                    ORDER BY mean_time DESC LIMIT 5
                """))
                return [dict(row._mapping) for row in result]
        except:
            return []