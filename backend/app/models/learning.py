# backend/app/models/learning.py

from app import db
from datetime import datetime

class LearningProgress(db.Model):
    """Tracks per-skill stage progress bound to a user and specific resume"""
    __tablename__ = 'learning_progress'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    resume_id = db.Column(db.Integer, db.ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, index=True)
    skill_name = db.Column(db.String(100), nullable=False, index=True)
    
    # Stages: learn, practice, build, assess, complete
    stage = db.Column(db.String(30), default='learn', nullable=False)
    progress_percent = db.Column(db.Float, default=0.0, nullable=False)
    is_completed = db.Column(db.Boolean, default=False, nullable=False)
    
    # Stage specifics
    learn_completed = db.Column(db.Boolean, default=False)
    practice_completed = db.Column(db.Boolean, default=False)
    build_completed = db.Column(db.Boolean, default=False)
    assess_completed = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'resume_id': self.resume_id,
            'skill_name': self.skill_name,
            'stage': self.stage,
            'progress_percent': self.progress_percent,
            'is_completed': self.is_completed,
            'stages_status': {
                'learn': self.learn_completed or False,
                'practice': self.practice_completed or False,
                'build': self.build_completed or False,
                'assess': self.assess_completed or False,
                'complete': self.is_completed or False
            },
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class LearningBookmark(db.Model):
    """Stores saved learning resources (videos, courses, articles, projects) per resume"""
    __tablename__ = 'learning_bookmarks'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    resume_id = db.Column(db.Integer, db.ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, index=True)
    
    skill_name = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(30), nullable=False)  # youtube, course, article, project, practice
    title = db.Column(db.String(255), nullable=False)
    url = db.Column(db.Text, nullable=True)
    thumbnail = db.Column(db.Text, nullable=True)
    provider = db.Column(db.String(100), nullable=True)
    extra_data = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'resume_id': self.resume_id,
            'skill_name': self.skill_name,
            'resource_type': self.resource_type,
            'title': self.title,
            'url': self.url,
            'thumbnail': self.thumbnail,
            'provider': self.provider,
            'extra_data': self.extra_data or {},
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class LearningActivity(db.Model):
    """Logs activity events for daily goals and progress calculation"""
    __tablename__ = 'learning_activities'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    resume_id = db.Column(db.Integer, db.ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, index=True)
    
    skill_name = db.Column(db.String(100), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # stage_complete, video_watched, practice_solved, project_started
    details = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'resume_id': self.resume_id,
            'skill_name': self.skill_name,
            'activity_type': self.activity_type,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
