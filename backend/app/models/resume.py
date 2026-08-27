# backend/app/models/resume.py

from app import db
from datetime import datetime

class Resume(db.Model):
    __tablename__ = 'resumes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    filename = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    file_type = db.Column(db.String(10))
    
    skills = db.Column(db.JSON, default=list)
    education = db.Column(db.JSON, default=list)
    experience = db.Column(db.JSON, default=dict)
    projects = db.Column(db.JSON, default=list)
    certifications = db.Column(db.JSON, default=list)
    
    employability_score = db.Column(db.Float)
    recommended_roles = db.Column(db.JSON, default=list)
    skill_gaps = db.Column(db.JSON, default=list)
    
    status = db.Column(db.String(20), default='pending')
    error_message = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, user_id=None, filename=None, file_path=None, file_size=None,
                 file_type=None, skills=None, education=None, experience=None,
                 projects=None, certifications=None, employability_score=None,
                 recommended_roles=None, skill_gaps=None, status='pending',
                 error_message=None, **kwargs):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        self.filename = filename
        self.file_path = file_path
        self.file_size = file_size
        self.file_type = file_type
        self.skills = skills if skills is not None else []
        self.education = education if education is not None else []
        self.experience = experience if experience is not None else {}
        self.projects = projects if projects is not None else []
        self.certifications = certifications if certifications is not None else []
        self.employability_score = employability_score
        self.recommended_roles = recommended_roles if recommended_roles is not None else []
        self.skill_gaps = skill_gaps if skill_gaps is not None else []
        self.status = status
        self.error_message = error_message
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'candidate_name': self.user.full_name if self.user else None,
            'user_email': self.user.email if self.user else None,
            'filename': self.filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'skills': self.skills or [],
            'education': self.education or [],
            'experience': self.experience or {},
            'projects': self.projects or [],
            'certifications': self.certifications or [],
            'employability_score': self.employability_score,
            'recommended_roles': self.recommended_roles or [],
            'skill_gaps': self.skill_gaps or [],
            'status': self.status,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
