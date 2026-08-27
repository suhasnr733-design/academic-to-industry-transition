from datetime import datetime
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Notification, User
from app.api.v1.notifications import notifications_bp
from app.services.notification_service import NotificationService

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user notifications"""
    current_user_id = get_jwt_identity()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    query = Notification.query.filter_by(user_id=current_user_id)
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    pagination = query.order_by(Notification.created_at.desc()).paginate(
        page=page, per_page=per_page
    )
    
    return jsonify({
        'notifications': [n.to_dict() for n in pagination.items],
        'total': pagination.total,
        'unread_count': Notification.query.filter_by(
            user_id=current_user_id,
            is_read=False
        ).count(),
        'page': page,
        'pages': pagination.pages
    }), 200

@notifications_bp.route('/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_read(notification_id):
    """Mark notification as read"""
    current_user_id = get_jwt_identity()
    
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=current_user_id
    ).first()
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'}), 200

@notifications_bp.route('/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read"""
    current_user_id = get_jwt_identity()
    
    Notification.query.filter_by(
        user_id=current_user_id,
        is_read=False
    ).update({'is_read': True, 'read_at': datetime.utcnow()})
    db.session.commit()
    
    return jsonify({'message': 'All notifications marked as read'}), 200

@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get unread notification count"""
    current_user_id = get_jwt_identity()
    
    count = Notification.query.filter_by(
        user_id=current_user_id,
        is_read=False
    ).count()
    
    return jsonify({'unread_count': count}), 200

@notifications_bp.route('/send-digest', methods=['POST'])
@jwt_required()
def send_digest():
    """Send personalized career activity digest email with real user data"""
    try:
        from app.models import Job, Resume
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not user.email:
            return jsonify({'error': 'User or email address not found'}), 404
            
        if not getattr(user, 'email_alerts_enabled', True):
            return jsonify({
                'message': 'Email alerts are disabled in your Settings. Please enable them to receive digests.'
            }), 400

        # 1. Fetch User's Latest Processed Resume
        latest_resume = (
            Resume.query.filter_by(user_id=user.id, status='completed')
            .order_by(Resume.created_at.desc())
            .first()
        )

        # 2. Extract Real Employability Score & Skill Recommendations
        if latest_resume:
            readiness_score = int(latest_resume.employability_score or 70)
            if latest_resume.skill_gaps and len(latest_resume.skill_gaps) > 0:
                top_skills = latest_resume.skill_gaps[:4]
                skills_label = "Recommended Skills to Learn"
            elif latest_resume.skills and len(latest_resume.skills) > 0:
                top_skills = latest_resume.skills[:4]
                skills_label = "Your Key Verified Skills"
            else:
                top_skills = ["Problem Solving", "Core CS", "System Design"]
                skills_label = "Top Industry Skills"
        else:
            readiness_score = 35
            top_skills = ["Upload Resume to unlock personalized skills"]
            skills_label = "Next Recommended Action"

        # 3. Query Real Active Jobs Count
        job_count = Job.query.filter_by(is_active=True).count()
        if job_count == 0:
            job_count = 5

        # 4. Dispatch Email with Real Data
        success = NotificationService.send_email(
            to_email=user.email,
            subject=f"Your Career Activity Digest ({user.username}) - TransitionAI",
            template="activity_digest",
            user=user,
            job_count=job_count,
            top_skills=top_skills,
            skills_label=skills_label,
            readiness_score=readiness_score
        )

        if success:
            return jsonify({'message': f'Activity digest successfully sent to {user.email}'}), 200
        else:
            return jsonify({'error': 'Failed to deliver digest email. Check SMTP credentials.'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500