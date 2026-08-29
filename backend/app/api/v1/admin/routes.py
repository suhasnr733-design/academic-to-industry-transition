from flask import request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models import User, Resume, Job
from app.api.v1.admin import admin_bp
from app.services.rbac import require_permission

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_permission('users', 'read')
def get_all_users():
    """Get all users (RBAC protected: Admin)"""
    users = User.query.all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@require_permission('admin', 'read')
def get_stats():
    """Get platform statistics (RBAC protected: Admin)"""
    return jsonify({
        'total_users': User.query.count(),
        'total_resumes': Resume.query.count(),
        'total_jobs': Job.query.count(),
        'active_users': User.query.filter_by(is_active=True).count()
    }), 200

@admin_bp.route('/users/<int:user_id>/status', methods=['PATCH'])
@jwt_required()
@require_permission('users', 'write')
def toggle_user_status(user_id):
    """Activate/deactivate user (RBAC protected: Admin)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    user.is_active = not user.is_active
    db.session.commit()
    
    status = 'activated' if user.is_active else 'deactivated'
    return jsonify({
        'message': f'User {status} successfully',
        'user': user.to_dict()
    }), 200

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
@require_permission('users', 'write')
def update_user_role(user_id):
    """Update user role (RBAC protected: Admin)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json() or {}
    new_role = data.get('role')
    valid_roles = ['student', 'faculty', 'admin']
    if new_role not in valid_roles:
        return jsonify({'error': f'Invalid role. Must be one of: {valid_roles}'}), 400
        
    user.role = new_role
    db.session.commit()
    
    return jsonify({
        'message': 'Role updated successfully',
        'user': user.to_dict()
    }), 200
