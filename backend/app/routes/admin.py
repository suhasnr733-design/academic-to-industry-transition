# backend/app/routes/admin.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import User
from app.decorators import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """Get all users (admin only)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = User.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'users': [user.to_dict() for user in pagination.items],
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages
    }), 200

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
@admin_required
def update_user_role(user_id):
    """Update user role (admin only)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if 'role' not in data:
        return jsonify({'error': 'Role required'}), 400
    
    valid_roles = ['student', 'faculty', 'admin']
    if data['role'] not in valid_roles:
        return jsonify({'error': f'Invalid role. Must be one of: {valid_roles}'}), 400
    
    user.role = data['role']
    db.session.commit()
    
    return jsonify({
        'message': 'Role updated successfully',
        'user': user.to_dict()
    }), 200

@admin_bp.route('/users/<int:user_id>/status', methods=['PATCH'])
@jwt_required()
@admin_required
def toggle_user_status(user_id):
    """Activate/deactivate user (admin only)"""
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