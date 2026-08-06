# backend/app/services/db_optimizer.py

from sqlalchemy import text, func
from sqlalchemy.orm import joinedload, selectinload
from app.extensions import db
from app.models import User, Resume, Job
import logging

logger = logging.getLogger(__name__)

class DatabaseOptimizer:
    """Advanced database optimization"""
    
    @staticmethod
    def optimize_queries():
        """Apply query optimizations"""
        # Create composite indexes
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_resumes_user_status ON resumes(user_id, status);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_domain_active ON jobs(domain, is_active);",
            "CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);",
            "CREATE INDEX IF NOT EXISTS idx_jobs_company_location ON jobs(company, location);"
        ]
        
        with db.engine.connect() as conn:
            for index in indexes:
                try:
                    conn.execute(text(index))
                    conn.commit()
                except Exception as e:
                    logger.error(f"Index creation error: {e}")
    
    @staticmethod
    def get_resumes_with_users():
        """Eager load resumes with users"""
        return Resume.query.options(
            selectinload(Resume.user)
        ).all()
    
    @staticmethod
    def get_jobs_with_skills():
        """Get jobs with skill analysis"""
        return Job.query.filter(
            Job.is_active == True,
            Job.required_skills.isnot(None)
        ).all()
    
    @staticmethod
    def paginate_query(query, page, per_page):
        """Efficient pagination with count"""
        total = query.count()
        items = query.limit(per_page).offset((page - 1) * per_page).all()
        
        return {
            'items': items,
            'total': total,
            'page': page,
            'pages': (total + per_page - 1) // per_page
        }
    
    @staticmethod
    def bulk_update_employability():
        """Bulk update employability scores"""
        from app.services.prediction_service import PredictionService
        service = PredictionService()
        
        resumes = Resume.query.filter(
            Resume.status == 'completed',
            Resume.employability_score.is_(None)
        ).all()
        
        updates = []
        for resume in resumes:
            # Calculate score
            score = len(resume.skills or []) * 5
            score = min(100, score)
            updates.append({
                'id': resume.id,
                'employability_score': score
            })
        
        # Bulk update
        if updates:
            db.session.bulk_update_mappings(Resume, updates)
            db.session.commit()
            logger.info(f"Updated {len(updates)} employability scores")
    
    @staticmethod
    def analyze_query_performance():
        """Analyze query performance"""
        with db.engine.connect() as conn:
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