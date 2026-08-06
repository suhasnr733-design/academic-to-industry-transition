# backend/app/services/db_optimizer.py

from sqlalchemy import text, func, select
from sqlalchemy.orm import joinedload, selectinload, defer
from app.extensions import db
from app.models import User, Resume, Job
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class DatabaseOptimizer:
    """Advanced database optimization utilities"""
    
    @staticmethod
    def create_performance_indexes():
        """Create performance indexes"""
        indexes = [
            # User table
            "CREATE INDEX IF NOT EXISTS idx_users_email_username ON users(email, username);",
            "CREATE INDEX IF NOT EXISTS idx_users_role_dept ON users(role, department);",
            "CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);",
            
            # Resume table
            "CREATE INDEX IF NOT EXISTS idx_resumes_user_status ON resumes(user_id, status);",
            "CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_resumes_score ON resumes(employability_score);",
            
            # Job table
            "CREATE INDEX IF NOT EXISTS idx_jobs_domain_company ON jobs(domain, company);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date);",
            
            # Assessment table
            "CREATE INDEX IF NOT EXISTS idx_assessment_user_type ON assessment_results(user_id, assessment_type);",
            "CREATE INDEX IF NOT EXISTS idx_assessment_created_at ON assessment_results(created_at);"
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
    def analyze_queries():
        """Analyze query performance"""
        queries = [
            "SELECT * FROM users WHERE email LIKE '%@%' AND is_active = true;",
            "SELECT * FROM resumes WHERE user_id = 1 AND status = 'completed';",
            "SELECT * FROM jobs WHERE domain = 'AI/ML' AND is_active = true;"
        ]
        
        with db.engine.connect() as conn:
            for query in queries:
                try:
                    result = conn.execute(text(f"EXPLAIN ANALYZE {query}"))
                    logger.info(f"Query analysis: {query[:50]}...")
                    for row in result:
                        logger.info(f"  {row}")
                except Exception as e:
                    logger.error(f"Error analyzing query: {e}")
    
    @staticmethod
    def optimize_pagination(model, query, page=1, per_page=20):
        """Optimize pagination with keyset pagination"""
        # Use keyset pagination for better performance
        if hasattr(model, 'id'):
            # Get last ID from previous page
            last_id = None
            if page > 1:
                previous_page = query.order_by(model.id).limit(per_page).offset((page - 2) * per_page).all()
                if previous_page:
                    last_id = previous_page[-1].id
            
            if last_id:
                return query.filter(model.id > last_id).order_by(model.id).limit(per_page).all()
            else:
                return query.order_by(model.id).limit(per_page).all()
        
        return query.offset((page - 1) * per_page).limit(per_page).all()
    
    @staticmethod
    def get_resumes_eager():
        """Eager load resumes with user data"""
        return Resume.query.options(
            selectinload(Resume.user)
        ).all()
    
    @staticmethod
    def get_user_with_resumes(user_id):
        """Get user with resumes using joinedload"""
        return User.query.options(
            joinedload(User.resumes)
        ).filter_by(id=user_id).first()
    
    @staticmethod
    def bulk_update_scores():
        """Bulk update employability scores"""
        resumes = Resume.query.filter(Resume.skills.isnot(None)).all()
        
        updates = []
        for resume in resumes:
            score = len(resume.skills or []) * 5
            score = min(100, score)
            updates.append({
                'id': resume.id,
                'employability_score': score
            })
        
        if updates:
            db.session.bulk_update_mappings(Resume, updates)
            db.session.commit()
            logger.info(f"Updated {len(updates)} employability scores")
    
    @staticmethod
    def get_query_stats():
        """Get query statistics"""
        with db.engine.connect() as conn:
            try:
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
                return [dict(row._mapping) for row in result]
            except:
                return {'error': 'pg_stat_statements not available'}
    
    @staticmethod
    def vacuum_analyze():
        """Vacuum and analyze database"""
        try:
            with db.engine.connect() as conn:
                conn.execute(text("VACUUM ANALYZE;"))
                conn.commit()
                logger.info("Database vacuumed and analyzed")
        except Exception as e:
            logger.error(f"Vacuum error: {e}")