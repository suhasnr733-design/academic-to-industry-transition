# backend/app/api/v1/notifications/routes.py

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
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