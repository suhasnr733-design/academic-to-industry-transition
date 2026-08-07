# backend/app/tasks/celery_tasks.py

from app.extensions import celery
from app.services.resume_processor import ResumeProcessor
from app.services.notification_service import NotificationService
from app.services.websocket import send_notification
from app.models import User, Resume
from app.extensions import db
import logging

logger = logging.getLogger(__name__)

@celery.task(bind=True)
def process_resume_task(self, resume_id, user_id):
    """Celery task for resume processing"""
    try:
        # Update task progress
        self.update_state(state='PROGRESS', meta={'current': 0, 'total': 100})
        
        # Process resume
        processor = ResumeProcessor()
        result = processor.process_resume(resume_id)
        
        self.update_state(state='PROGRESS', meta={'current': 100, 'total': 100})
        
        # Send notification
        NotificationService.send_resume_processed_notification(user_id, resume_id)
        
        # Send WebSocket notification
        send_notification(user_id, {
            'type': 'resume_processed',
            'resume_id': resume_id,
            'status': 'completed'
        })
        
        return {'status': 'completed', 'resume_id': resume_id}
        
    except Exception as e:
        logger.error(f"Task failed: {e}")
        return {'status': 'failed', 'error': str(e)}

@celery.task
def send_bulk_notifications(user_ids, title, message, notification_type='info'):
    """Send notifications in bulk"""
    for user_id in user_ids:
        NotificationService.send_in_app_notification(
            user_id, title, message, notification_type
        )

@celery.task
def schedule_daily_job_matching():
    """Schedule daily job matching"""
    users = User.query.filter_by(role='student', is_active=True).all()
    
    for user in users:
        resumes = Resume.query.filter_by(user_id=user.id, status='completed').all()
        for resume in resumes:
            # Match jobs for each resume
            pass

@celery.task
def cleanup_old_data():
    """Cleanup old data (runs weekly)"""
    # Delete old notifications
    # Delete unverified users
    # Archive old logs
    pass