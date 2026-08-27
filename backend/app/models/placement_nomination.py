# backend/app/models/placement_nomination.py

from app import db
from datetime import datetime

class PlacementNomination(db.Model):
    """Company nomination and selection request model for students"""
    __tablename__ = 'placement_nominations'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    company_name = db.Column(db.String(150), nullable=False)
    job_role = db.Column(db.String(150), default='Software Engineer', nullable=True)
    package_lpa = db.Column(db.Float, nullable=True)
    
    # Status lifecycle: 'pending', 'accepted', 'rejected', 'revoked'
    status = db.Column(db.String(20), default='pending', nullable=False)
    faculty_notes = db.Column(db.Text, nullable=True)
    student_response_note = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    student = db.relationship('User', foreign_keys=[student_id], backref=db.backref('company_nominations', lazy='dynamic'))
    faculty = db.relationship('User', foreign_keys=[faculty_id], backref=db.backref('nominations_issued', lazy='dynamic'))

    def __init__(self, student_id=None, faculty_id=None, company_name=None,
                 job_role='Software Engineer', package_lpa=None, status='pending',
                 faculty_notes=None, student_response_note=None, **kwargs):
        super().__init__(**kwargs)
        if student_id is not None:
            self.student_id = student_id
        if faculty_id is not None:
            self.faculty_id = faculty_id
        self.company_name = company_name
        self.job_role = job_role
        self.package_lpa = package_lpa
        self.status = status
        self.faculty_notes = faculty_notes
        self.student_response_note = student_response_note

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'faculty_id': self.faculty_id,
            'company_name': self.company_name,
            'job_role': self.job_role,
            'package_lpa': self.package_lpa,
            'status': self.status,
            'faculty_notes': self.faculty_notes,
            'student_response_note': self.student_response_note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'student': {
                'id': self.student.id,
                'full_name': self.student.full_name,
                'username': self.student.username,
                'email': self.student.email,
                'department': self.student.department,
                'year_of_study': self.student.year_of_study,
                'placement_status': self.student.placement_status
            } if self.student else None,
            'faculty': {
                'id': self.faculty.id,
                'full_name': self.faculty.full_name,
                'username': self.faculty.username,
                'email': self.faculty.email,
                'department': self.faculty.department
            } if self.faculty else None
        }
