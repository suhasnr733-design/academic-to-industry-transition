# backend/app/services/query_optimizer.py

from sqlalchemy import text
from app.services.db_pool import db_pool
import logging

logger = logging.getLogger(__name__)

class QueryOptimizer:
    def __init__(self):
        self.engine = db_pool.get_engine()
    
    def create_indexes(self):
        """Create optimized indexes"""
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
            "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);",
            "CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);",
            "CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_domain ON jobs(domain);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date);",
            "CREATE INDEX IF NOT EXISTS idx_assessment_user_id ON assessment_results(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_assessment_type ON assessment_results(assessment_type);",
            "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);"
        ]
        
        with self.engine.connect() as conn:
            for idx in indexes:
                try:
                    conn.execute(text(idx))
                    conn.commit()
                    logger.info(f"✅ Created index: {idx[:50]}...")
                except Exception as e:
                    logger.error(f"Error creating index: {e}")
    
    def analyze_queries(self):
        """Analyze slow queries"""
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    query,
                    calls,
                    total_time,
                    mean_time,
                    rows
                FROM pg_stat_statements
                ORDER BY mean_time DESC
                LIMIT 10
            """))
            slow_queries = [dict(row._mapping) for row in result]
            
            logger.info(f"Found {len(slow_queries)} slow queries")
            return slow_queries
    
    def get_table_stats(self):
        """Get table statistics"""
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    schemaname,
                    tablename,
                    seq_scan,
                    seq_tup_read,
                    idx_scan,
                    idx_tup_fetch
                FROM pg_stat_user_tables
                ORDER BY seq_scan DESC
                LIMIT 10
            """))
            return [dict(row._mapping) for row in result]

query_optimizer = QueryOptimizer()