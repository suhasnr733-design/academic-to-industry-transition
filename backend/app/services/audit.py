# backend/app/services/audit.py

from app.extensions import db
from app.models import AuditLog
from datetime import datetime
import json
import logging
from flask import request
from typing import Dict, Any

logger = logging.getLogger(__name__)

class AuditService:
    """Audit logging service for compliance"""
    
    @staticmethod
    def log_action(user_id: int, action: str, resource_type: str, 
                   resource_id: int = None, details: Dict = None,
                   ip_address: str = None, user_agent: str = None):
        """Log an action for audit"""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=details,
                ip_address=ip_address or request.remote_addr,
                user_agent=user_agent or request.headers.get('User-Agent'),
                created_at=datetime.utcnow()
            )
            db.session.add(audit_log)
            db.session.commit()
            logger.info(f"Audit log: {action} by user {user_id} on {resource_type} {resource_id}")
        except Exception as e:
            logger.error(f"Audit log error: {e}")
    
    @staticmethod
    def log_login(user_id: int, success: bool, ip_address: str = None):
        """Log login attempt"""
        action = 'login_success' if success else 'login_failure'
        AuditService.log_action(
            user_id=user_id,
            action=action,
            resource_type='auth',
            details={'success': success},
            ip_address=ip_address
        )
    
    @staticmethod
    def log_resume_action(user_id: int, action: str, resume_id: int, details: Dict = None):
        """Log resume action"""
        AuditService.log_action(
            user_id=user_id,
            action=action,
            resource_type='resume',
            resource_id=resume_id,
            details=details
        )
    
    @staticmethod
    def log_data_export(user_id: int, export_type: str, details: Dict = None):
        """Log data export (GDPR)"""
        AuditService.log_action(
            user_id=user_id,
            action='data_export',
            resource_type='data',
            details={'export_type': export_type, **details}
        )
    
    @staticmethod
    def log_data_deletion(user_id: int, resource_type: str, resource_id: int):
        """Log data deletion (Right to be forgotten)"""
        AuditService.log_action(
            user_id=user_id,
            action='data_deletion',
            resource_type=resource_type,
            resource_id=resource_id,
            details={'deleted_at': datetime.utcnow().isoformat()}
        )
    
    @staticmethod
    def get_user_audit_logs(user_id: int, limit: int = 100, offset: int = 0):
        """Get audit logs for a user"""
        return AuditLog.query.filter_by(user_id=user_id)\
            .order_by(AuditLog.created_at.desc())\
            .limit(limit)\
            .offset(offset)\
            .all()
    
    @staticmethod
    def get_resource_audit_logs(resource_type: str, resource_id: int, limit: int = 100):
        """Get audit logs for a resource"""
        return AuditLog.query.filter_by(
            resource_type=resource_type,
            resource_id=resource_id
        ).order_by(AuditLog.created_at.desc())\
         .limit(limit)\
         .all()

class GDPRCompliance:
    """GDPR compliance utilities"""
    
    @staticmethod
    def anonymize_user(user):
        """Anonymize user data (GDPR)"""
        from app.models import User
        user.full_name = "Anonymous User"
        user.email = f"anonymous_{user.id}@example.com"
        user.phone = None
        user.bio = None
        user.is_active = False
        user.is_email_verified = False
        db.session.commit()
        AuditService.log_action(
            user_id=user.id,
            action='user_anonymized',
            resource_type='user',
            resource_id=user.id,
            details={'timestamp': datetime.utcnow().isoformat()}
        )
    
    @staticmethod
    def export_user_data(user):
        """Export user data (GDPR data portability)"""
        from app.models import User, Resume
        data = {
            'user': user.to_dict(),
            'resumes': [r.to_dict() for r in Resume.query.filter_by(user_id=user.id).all()],
            'audit_logs': [a.to_dict() for a in AuditService.get_user_audit_logs(user.id)],
            'exported_at': datetime.utcnow().isoformat()
        }
        AuditService.log_data_export(user.id, 'user_data', {'export_size': len(str(data))})
        return data
    
    @staticmethod
    def delete_user_data(user):
        """Delete user data (Right to be forgotten)"""
        from app.models import Resume, Notification
        # Anonymize first
        GDPRCompliance.anonymize_user(user)
        
        # Delete sensitive data
        for resume in Resume.query.filter_by(user_id=user.id).all():
            resume.skills = []
            resume.education = []
            resume.experience = {}
            resume.projects = []
            resume.certifications = []
        
        # Delete notifications
        Notification.query.filter_by(user_id=user.id).delete()
        
        db.session.commit()
        AuditService.log_data_deletion(user.id, 'user', user.id)