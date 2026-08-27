# backend/app/models/job_interest.py

from app import db
from datetime import datetime

class JobInterest(db.Model):
    """Tracks jobs that students have marked as interested/saved, with application stages"""
    __tablename__ = 'job_interests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=True, index=True)
    external_job_id = db.Column(db.String(255), nullable=True, index=True)
    
    job_title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(100), nullable=False)
    job_data = db.Column(db.JSON, nullable=True)  # Snapshot of job details (location, salary, skills, apply_url, source)
    
    status = db.Column(db.String(50), default='interested', nullable=False)  # interested, applied, interviewing, shortlisted, rejected, offer
    notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    job = db.relationship('Job', backref=db.backref('interests', lazy='dynamic', cascade='all, delete-orphan'), lazy=True)

    def __init__(
        self,
        user_id=None,
        job_id=None,
        external_job_id=None,
        job_title=None,
        company=None,
        job_data=None,
        status='interested',
        notes=None,
        **kwargs
    ):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        if job_id is not None:
            self.job_id = job_id
        if external_job_id is not None:
            self.external_job_id = external_job_id
        if job_title is not None:
            self.job_title = job_title
        if company is not None:
            self.company = company
        if job_data is not None:
            self.job_data = job_data
        self.status = status
        self.notes = notes

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'external_job_id': self.external_job_id,
            'job_title': self.job_title,
            'company': self.company,
            'job_data': self.job_data or {},
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
