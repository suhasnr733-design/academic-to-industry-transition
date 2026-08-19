# backend/app/services/audit_log.py

from app.extensions import db
from app.models import AuditLog
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class AuditLogger:
    """Audit logging for compliance"""
    
    @staticmethod
    def log_event(user_id, action, resource_type, resource_id, data=None):
        """Log an event for audit"""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                data=data,
                ip_address=request.remote_addr if request else None,
                user_agent=request.headers.get('User-Agent') if request else None,
                created_at=datetime.utcnow()
            )
            db.session.add(audit_log)
            db.session.commit()
        except Exception as e:
            logger.error(f"Audit log error: {e}")
    
    @staticmethod
    def get_user_audit_logs(user_id, limit=100):
        """Get audit logs for user"""
        return AuditLog.query.filter_by(user_id=user_id)\
            .order_by(AuditLog.created_at.desc())\
            .limit(limit)\
            .all()
    
    @staticmethod
    def get_resource_audit_logs(resource_type, resource_id, limit=100):
        """Get audit logs for resource"""
        return AuditLog.query.filter_by(
            resource_type=resource_type,
            resource_id=resource_id
        ).order_by(AuditLog.created_at.desc())\
         .limit(limit)\
         .all()

class DataPrivacy:
    """Data privacy and compliance"""
    
    @staticmethod
    def anonymize_user_data(user):
        """Anonymize user data for privacy"""
        user.full_name = "Anonymous User"
        user.email = f"anonymous_{user.id}@example.com"
        user.phone = None
        user.bio = None
        user.is_active = False
        db.session.commit()
    
    @staticmethod
    def export_user_data(user):
        """Export user data (GDPR compliance)"""
        return {
            'user': user.to_dict(),
            'resumes': [r.to_dict() for r in user.resumes],
            'assessments': [a.to_dict() for a in user.assessments],
            'created_at': user.created_at.isoformat()
        }
    
    @staticmethod
    def delete_user_data(user):
        """Delete user data (Right to be forgotten)"""
        # Anonymize first
        DataPrivacy.anonymize_user_data(user)
        
        # Delete sensitive data
        for resume in user.resumes:
            resume.skills = []
            resume.education = []
            resume.experience = {}
            resume.projects = []
            resume.certifications = []
        
        db.session.commit()