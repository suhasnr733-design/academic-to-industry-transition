from app import db, mail
try:
    from flask_mail import Message
except ImportError:
    Message = None
from flask import current_app, render_template
import logging
from datetime import datetime
from app.models import Notification, User

logger = logging.getLogger(__name__)

class NotificationService:
    """Notification service for emails, in-app notifications, and activity digests"""
    
    @staticmethod
    def send_email(to_email: str, subject: str, template: str, user=None, **kwargs):
        """Send email with user preference checking, HTML rendering, and safe plain-text fallback"""
        try:
            # 1. Check user preference if user object provided
            if user and hasattr(user, 'email_alerts_enabled') and not user.email_alerts_enabled:
                logger.info(f"User {user.id} has disabled email alerts. Skipping email delivery.")
                return False

            sender = (
                current_app.config.get('MAIL_DEFAULT_SENDER') or 
                current_app.config.get('MAIL_USERNAME') or 
                'noreply@transitionai.com'
            )
            frontend_url = current_app.config.get('FRONTEND_URL') or 'http://localhost:5173'

            if not Message:
                logger.warning("Flask-Mail Message class not available. Skipping email.")
                return False

            msg = Message(
                subject=subject,
                sender=sender,
                recipients=[to_email]
            )

            # 2. Render HTML template with fallback
            try:
                msg.html = render_template(
                    f'emails/{template}.html',
                    user=user,
                    frontend_url=frontend_url,
                    **kwargs
                )
            except Exception as tmpl_err:
                logger.warning(f"Could not render HTML template '{template}': {tmpl_err}. Using plain body fallback.")
                msg.body = f"Hello,\n\n{subject}\n\nPlease visit {frontend_url} to view details."

            mail.send(msg)
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Email error when sending to {to_email}: {e}")
            return False
    
    @staticmethod
    def send_in_app_notification(user_id: int, title: str, message: str, 
                                  notification_type: str = 'info', link: str = None):
        """Send in-app notification"""
        try:
            user = User.query.get(user_id)
            if user and hasattr(user, 'notifications_enabled') and not user.notifications_enabled:
                logger.info(f"User {user_id} has disabled in-app notifications. Skipping.")
                return False

            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                link=link,
                created_at=datetime.utcnow()
            )
            db.session.add(notification)
            db.session.commit()
            logger.info(f"Notification sent to user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Notification error: {e}")
            return False
    
    @staticmethod
    def send_resume_processed_notification(user_id: int, resume_id: int):
        """Send resume processed notification (in-app and email)"""
        user = User.query.get(user_id)
        if not user:
            return

        title = "Resume Processed Successfully"
        message = "Your resume has been analyzed. Check your dashboard for insights."
        link = f"/resume/{resume_id}"
        
        # 1. In-App Alert
        NotificationService.send_in_app_notification(
            user_id=user.id, title=title, message=message, notification_type='success', link=link
        )
        
        # 2. Activity Email Alert (respects user.email_alerts_enabled)
        if user.email and getattr(user, 'email_alerts_enabled', True):
            NotificationService.send_email(
                to_email=user.email,
                subject="Resume Analysis Complete - TransitionAI",
                template="resume_processed",
                user=user,
                resume_id=resume_id
            )
    
    @staticmethod
    def send_job_match_notification(user_id: int, job_id: int, match_score: float):
        """Send job match notification"""
        title = f"New Job Match! {match_score}% Match"
        message = f"A new job has been found matching your profile with {match_score}% match."
        link = f"/jobs/{job_id}"
        
        NotificationService.send_in_app_notification(
            user_id, title, message, 'info', link
        )
    
    @staticmethod
    def send_skill_gap_notification(user_id: int, skill_gaps: list):
        """Send skill gap notification"""
        if not skill_gaps:
            return
        
        top_gaps = skill_gaps[:3]
        title = "Skill Gaps Identified"
        message = f"Consider learning: {', '.join(top_gaps)}"
        link = "/skills"
        
        NotificationService.send_in_app_notification(
            user_id, title, message, 'warning', link
        )
    
    @staticmethod
    def get_user_notifications(user_id: int, limit: int = 20):
        """Get user notifications"""
        notifications = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).order_by(Notification.created_at.desc()).limit(limit).all()
        
        return [n.to_dict() for n in notifications]
    
    @staticmethod
    def mark_notification_read(notification_id: int, user_id: int):
        """Mark notification as read"""
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()
        
        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def mark_all_read(user_id: int):
        """Mark all notifications as read"""
        Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).update({'is_read': True, 'read_at': datetime.utcnow()})
        db.session.commit()
        return True