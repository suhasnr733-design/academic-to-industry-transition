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
