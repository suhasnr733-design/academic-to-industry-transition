# backend/app/models/user.py

from app import db, bcrypt
from datetime import datetime

class User(db.Model):
    """User model representing students, faculty, and admins"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='student', nullable=False)  # student, faculty, admin
    department = db.Column(db.String(100), nullable=True)
    year_of_study = db.Column(db.Integer, nullable=True)
    college = db.Column(db.String(150), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    placement_status = db.Column(db.String(20), default='seeking', nullable=False)  # seeking, placed, higher_studies, opted_out
    placed_company = db.Column(db.String(100), nullable=True)
    package_lpa = db.Column(db.Float, nullable=True)

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_email_verified = db.Column(db.Boolean, default=False, nullable=False)
    oauth_provider = db.Column(db.String(30), nullable=True)
    oauth_provider_id = db.Column(db.String(100), nullable=True, index=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)

    # Relationships
    resumes = db.relationship('Resume', backref='user', lazy=True, cascade='all, delete-orphan')

    def __init__(self, username=None, email=None, password_hash=None, full_name=None,
                 role='student', department=None, year_of_study=None, college=None,
                 phone=None, bio=None, placement_status='seeking', placed_company=None,
                 package_lpa=None, is_active=True, is_email_verified=False,
                 oauth_provider=None, oauth_provider_id=None, profile_picture=None,
                 **kwargs):
        super().__init__(**kwargs)
        if username is not None:
            self.username = username
        if email is not None:
            self.email = email
        if password_hash is not None:
            self.password_hash = password_hash
        if full_name is not None:
            self.full_name = full_name
        self.role = role
        self.department = department
        self.year_of_study = year_of_study
        self.college = college
        self.phone = phone
        self.bio = bio
        self.placement_status = placement_status
        self.placed_company = placed_company
        self.package_lpa = package_lpa
        self.is_active = is_active
        self.is_email_verified = is_email_verified
        self.oauth_provider = oauth_provider
        self.oauth_provider_id = oauth_provider_id
        self.profile_picture = profile_picture
        for k, v in kwargs.items():
            setattr(self, k, v)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'department': self.department,
            'year_of_study': self.year_of_study,
            'college': self.college,
            'phone': self.phone,
            'bio': self.bio,
            'placement_status': self.placement_status or 'seeking',
            'placed_company': self.placed_company,
            'package_lpa': self.package_lpa,
            'is_active': self.is_active,
            'is_email_verified': self.is_email_verified,
            'oauth_provider': self.oauth_provider,
            'profile_picture': self.profile_picture,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class AuditLog(db.Model):
    """Audit log model for security tracking"""
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
