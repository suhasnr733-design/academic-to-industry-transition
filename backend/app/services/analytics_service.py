# backend/app/services/analytics_service.py

from app.models import User, Resume, Job, AssessmentResult
from app.extensions import db
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

class AnalyticsService:
    """Advanced analytics and reporting"""
    
    def get_dashboard_stats(self):
        """Get main dashboard statistics"""
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        total_resumes = Resume.query.count()
        processed_resumes = Resume.query.filter_by(status='completed').count()
        total_jobs = Job.query.count()
        
        return {
            'users': {
                'total': total_users,
                'active': active_users,
                'students': User.query.filter_by(role='student').count(),
                'faculty': User.query.filter_by(role='faculty').count()
            },
            'resumes': {
                'total': total_resumes,
                'processed': processed_resumes,
                'pending': Resume.query.filter_by(status='pending').count(),
                'failed': Resume.query.filter_by(status='failed').count()
            },
            'jobs': {
                'total': total_jobs,
                'active': Job.query.filter_by(is_active=True).count()
            }
        }
    
    def get_placement_trends(self, months=6):
        """Get placement trends over time"""
        cutoff_date = datetime.utcnow() - timedelta(days=30*months)
        
        # Get resumes with employability scores
        resumes = Resume.query.filter(
            Resume.created_at >= cutoff_date,
            Resume.employability_score.isnot(None)
        ).all()
        
        # Group by month
        df = pd.DataFrame([{
            'date': r.created_at,
            'score': r.employability_score
        } for r in resumes])
        
        if df.empty:
            return []
        
        df['month'] = df['date'].dt.strftime('%Y-%m')
        trends = df.groupby('month')['score'].mean().to_dict()
        
        return [{'month': k, 'avg_score': v} for k, v in trends.items()]
    
    def get_skill_distribution(self):
        """Get skill distribution across all resumes"""
        resumes = Resume.query.filter(Resume.skills.isnot(None)).all()
        
        skill_counts = {}
        for resume in resumes:
            if resume.skills:
                for skill in resume.skills:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
        
        # Sort by count
        sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)
        
        return [{'skill': k, 'count': v} for k, v in sorted_skills[:20]]
    
    def get_employability_distribution(self):
        """Get employability score distribution"""
        resumes = Resume.query.filter(
            Resume.employability_score.isnot(None)
        ).all()
        
        if not resumes:
            return []
        
        scores = [r.employability_score for r in resumes]
        
        # Create bins
        bins = [0, 20, 40, 60, 80, 100]
        labels = ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%']
        
        distribution = pd.cut(scores, bins, labels=labels)
        counts = distribution.value_counts().to_dict()
        
        return [{'range': k, 'count': v} for k, v in counts.items()]