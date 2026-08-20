# backend/app/services/rbac.py

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models import User

class RBACService:
    """Role-Based Access Control"""
    
    def has_permission(self, user_id, resource, action):
        user = User.query.get(user_id)
        if not user:
            return False
        if user.role == 'admin':
            return True
        return user.role == 'faculty' and resource in ['students', 'resumes']

def require_permission(resource, action):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            rbac = RBACService()
            if not rbac.has_permission(user_id, resource, action):
                return jsonify({
                    'error': 'Permission denied',
                    'message': f'You need {action} permission on {resource}'
                }), 403
            return func(*args, **kwargs)
        return wrapper
    return decorator