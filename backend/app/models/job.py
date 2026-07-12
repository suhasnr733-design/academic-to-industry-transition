from app.extensions import db
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
    posted_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
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
            'job_type': self.job_type,
            'domain': self.domain,
            'is_active': self.is_active,
            'posted_date': self.posted_date.isoformat() if self.posted_date else None
        }
