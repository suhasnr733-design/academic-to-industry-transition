# backend/app/models/mentorship.py

from app import db
from datetime import datetime

class MentorshipRequest(db.Model):
    """Mentorship and Faculty Advisor assignment request model"""
    __tablename__ = 'mentorship_requests'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    status = db.Column(db.String(20), default='pending', nullable=False)  # pending, accepted, rejected, cancelled
    message = db.Column(db.Text, nullable=True)
    response_note = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    student = db.relationship('User', foreign_keys=[student_id], backref=db.backref('mentorship_sent', lazy='dynamic'))
    faculty = db.relationship('User', foreign_keys=[faculty_id], backref=db.backref('mentorship_received', lazy='dynamic'))

    __table_args__ = (
        db.UniqueConstraint('student_id', 'faculty_id', name='uq_student_faculty_mentorship'),
    )

    def __init__(self, student_id=None, faculty_id=None, status='pending', message=None, response_note=None, **kwargs):
        super().__init__(**kwargs)
        if student_id is not None:
            self.student_id = student_id
        if faculty_id is not None:
            self.faculty_id = faculty_id
        self.status = status
        self.message = message
        self.response_note = response_note

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'faculty_id': self.faculty_id,
            'status': self.status,
            'message': self.message,
            'response_note': self.response_note,
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
                'department': self.faculty.department,
                'college': self.faculty.college
            } if self.faculty else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
