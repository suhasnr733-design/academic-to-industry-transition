# backend/app/models/job.py

from app import db
from datetime import datetime

class Job(db.Model):
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    required_skills = db.Column(db.JSON, default=list)
    
    experience_required = db.Column(db.Integer)
    location = db.Column(db.String(100))
    salary_range = db.Column(db.String(50))
    job_type = db.Column(db.String(50))
    domain = db.Column(db.String(50))
    
    is_active = db.Column(db.Boolean, default=True)
    is_live = db.Column(db.Boolean, default=False)
    source = db.Column(db.String(50), default='internal')  # internal, remotive, arbeitnow, jsearch, adzuna, scraper
    external_id = db.Column(db.String(255), index=True, nullable=True)
    apply_url = db.Column(db.Text, nullable=True)
    
    salary_min = db.Column(db.Float, nullable=True)
    salary_max = db.Column(db.Float, nullable=True)
    currency = db.Column(db.String(10), default='INR')
    
    posted_date = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    raw_data = db.Column(db.JSON, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'company': self.company,
            'description': self.description,
            'required_skills': self.required_skills or [],
            'experience_required': self.experience_required,
            'location': self.location,
            'salary_range': self.salary_range,
            'salary_min': self.salary_min,
            'salary_max': self.salary_max,
            'currency': self.currency,
            'job_type': self.job_type,
            'domain': self.domain,
            'source': self.source or 'internal',
            'external_id': self.external_id,
            'apply_url': self.apply_url,
            'is_live': bool(self.is_live),
            'is_active': self.is_active,
            'posted_date': self.posted_date.isoformat() if self.posted_date else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

