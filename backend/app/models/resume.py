from app.extensions import db
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
    
    employability_score = db.Column(db.Float)
    recommended_roles = db.Column(db.JSON, default=list)
    skill_gaps = db.Column(db.JSON, default=list)
    
    status = db.Column(db.String(20), default='pending')
    error_message = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'skills': self.skills or [],
            'education': self.education or [],
            'experience': self.experience or {},
            'projects': self.projects or [],
            'employability_score': self.employability_score,
            'recommended_roles': self.recommended_roles or [],
            'skill_gaps': self.skill_gaps or [],
            'status': self.status,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
