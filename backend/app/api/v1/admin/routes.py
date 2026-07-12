from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, Resume, Job
from app.api.v1.admin import admin_bp

def is_admin():
    user = User.query.get(get_jwt_identity())
    return user and user.role == 'admin'

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    users = User.query.all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    return jsonify({
        'total_users': User.query.count(),
        'total_resumes': Resume.query.count(),
        'total_jobs': Job.query.count(),
        'active_users': User.query.filter_by(is_active=True).count()
    }), 200
