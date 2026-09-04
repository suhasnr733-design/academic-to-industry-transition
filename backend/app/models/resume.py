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
    
    # 11-Pillar Fields
    personal_info = db.Column(db.JSON, default=dict)
    links = db.Column(db.JSON, default=dict)
    summary = db.Column(db.Text)
    achievements = db.Column(db.JSON, default=list)
    publications = db.Column(db.JSON, default=list)
    ats_breakdown = db.Column(db.JSON, default=dict)
    
    employability_score = db.Column(db.Float)
    recommended_roles = db.Column(db.JSON, default=list)
    skill_gaps = db.Column(db.JSON, default=list)
    
    status = db.Column(db.String(20), default='pending')
    error_message = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, user_id=None, filename=None, file_path=None, file_size=None,
                 file_type=None, skills=None, education=None, experience=None,
                 projects=None, certifications=None, personal_info=None, links=None,
                 summary=None, achievements=None, publications=None, ats_breakdown=None,
                 employability_score=None, recommended_roles=None, skill_gaps=None,
                 status='pending', error_message=None, **kwargs):
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
        self.personal_info = personal_info if personal_info is not None else {}
        self.links = links if links is not None else {}
        self.summary = summary
        self.achievements = achievements if achievements is not None else []
        self.publications = publications if publications is not None else []
        self.ats_breakdown = ats_breakdown if ats_breakdown is not None else {}
        self.employability_score = employability_score
        self.recommended_roles = recommended_roles if recommended_roles is not None else []
        self.skill_gaps = skill_gaps if skill_gaps is not None else []
        self.status = status
        self.error_message = error_message
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        candidate_name = None
        raw_text = None
        if isinstance(self.experience, dict):
            candidate_name = self.experience.get('candidate_name')
            raw_text = self.experience.get('raw_text')
        if not candidate_name and self.personal_info and self.personal_info.get('candidate_name'):
            candidate_name = self.personal_info.get('candidate_name')
        if not candidate_name and self.user:
            candidate_name = self.user.full_name

        return {
            'id': self.id,
            'user_id': self.user_id,
            'candidate_name': candidate_name,
            'user_email': self.user.email if self.user else None,
            'filename': self.filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'personal_info': self.personal_info or {},
            'links': self.links or {},
            'summary': self.summary or '',
            'skills': self.skills or [],
            'education': self.education or [],
            'experience': self.experience or {},
            'projects': self.projects or [],
            'certifications': self.certifications or [],
            'achievements': self.achievements or [],
            'publications': self.publications or [],
            'ats_breakdown': self.ats_breakdown or {},
            'employability_score': self.employability_score,
            'recommended_roles': self.recommended_roles or [],
            'skill_gaps': self.skill_gaps or [],
            'raw_text': raw_text,
            'status': self.status,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def to_summary_dict(self):
        """Optimization 3: Lightweight representation for resume list cards (85% smaller payload)"""
        candidate_name = None
        if isinstance(self.experience, dict) and self.experience.get('candidate_name'):
            candidate_name = self.experience.get('candidate_name')
        elif self.personal_info and self.personal_info.get('candidate_name'):
            candidate_name = self.personal_info.get('candidate_name')
        elif self.user:
            candidate_name = self.user.full_name

        return {
            'id': self.id,
            'user_id': self.user_id,
            'candidate_name': candidate_name,
            'filename': self.filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'status': self.status,
            'employability_score': self.employability_score,
            'skills': self.skills or [],
            'recommended_roles': self.recommended_roles or [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
