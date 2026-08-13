# backend/app/api/v1/auth/routes.py

from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from app import db, limiter
from app.models import User
from app.api.v1.auth import auth_bp
from datetime import datetime
import re
import logging

logger = logging.getLogger(__name__)

# ============================================
# REGISTER ENDPOINT
# ============================================
@auth_bp.route('/register', methods=['POST'])
@limiter.limit('5 per minute')
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400
        
        required = ['username', 'email', 'password', 'full_name']
        missing = [field for field in required if not data.get(field)]
        if missing:
            return jsonify({
                'error': 'Missing required fields',
                'missing': missing
            }), 400
        
        if not re.match(r'^[a-zA-Z0-9_]+$', data['username']):
            return jsonify({
                'error': 'Invalid username',
                'message': 'Username can only contain letters, numbers, and underscores'
            }), 400
        
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data['email']):
            return jsonify({
                'error': 'Invalid email',
                'message': 'Please provide a valid email address'
            }), 400
        
        password = data['password']
        if len(password) < 6:
            return jsonify({
                'error': 'Password too short',
                'message': 'Password must be at least 6 characters'
            }), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({
                'error': 'Username already exists',
                'message': f'Username "{data["username"]}" is already taken'
            }), 409
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'error': 'Email already registered',
                'message': f'Email "{data["email"]}" is already registered'
            }), 409
        
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            department=data.get('department'),
            year_of_study=data.get('year_of_study'),
            college=data.get('college'),
            role='student'
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        logger.info(f"New user registered: {user.username} (ID: {user.id})")
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        db.session.rollback()
        return jsonify({
            'error': 'Registration failed',
            'message': str(e)
        }), 500

# ============================================
# LOGIN ENDPOINT
# ============================================
@auth_bp.route('/login', methods=['POST'])
@limiter.limit('10 per minute')
def login():
    """Login user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400
        
        if not data.get('password'):
            return jsonify({
                'error': 'Password required',
                'message': 'Please provide your password'
            }), 400
        
        login_identifier = data.get('username') or data.get('email') or data.get('login')
        if not login_identifier:
            return jsonify({
                'error': 'Username or email required',
                'message': 'Please provide username or email'
            }), 400
        
        user = User.query.filter(
            (User.username == login_identifier) | (User.email == login_identifier)
        ).first()
        
        if not user or not user.check_password(data['password']):
            logger.warning(f"Failed login attempt for: {data.get('username') or data.get('email')}")
            return jsonify({
                'error': 'Invalid credentials',
                'message': 'Incorrect username/email or password'
            }), 401
        
        if not user.is_active:
            return jsonify({
                'error': 'Account deactivated',
                'message': 'Your account has been deactivated. Please contact support.'
            }), 403
        
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        logger.info(f"User logged in: {user.username} (ID: {user.id})")
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({
            'error': 'Login failed',
            'message': str(e)
        }), 500

# ============================================
# REFRESH TOKEN ENDPOINT
# ============================================
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'error': 'User not found or inactive',
                'message': 'Please login again'
            }), 404
        
        new_access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'access_token': new_access_token
        }), 200
        
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return jsonify({
            'error': 'Token refresh failed',
            'message': str(e)
        }), 500

# ============================================
# GET PROFILE ENDPOINT
# ============================================
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = int(get_jwt_identity())
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User no longer exists'
            }), 404
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Profile fetch error: {e}")
        return jsonify({
            'error': 'Failed to fetch profile',
            'message': str(e)
        }), 500

# ============================================
# UPDATE PROFILE ENDPOINT
# ============================================
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User no longer exists'
            }), 404
        
        data = request.get_json() or {}
        allowed_fields = ['full_name', 'department', 'year_of_study', 'college', 'phone', 'bio']
        
        updated_fields = []
        for field in allowed_fields:
            if field in data:
                if field == 'year_of_study' and data[field] is not None:
                    if not 1 <= int(data[field]) <= 6:
                        return jsonify({
                            'error': 'Invalid year of study',
                            'message': 'Year of study must be between 1 and 6'
                        }), 400
                setattr(user, field, data[field])
                updated_fields.append(field)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'updated_fields': updated_fields,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        db.session.rollback()
        return jsonify({
            'error': 'Failed to update profile',
            'message': str(e)
        }), 500

# ============================================
# CHANGE PASSWORD ENDPOINT
# ============================================
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User no longer exists'
            }), 404
        
        data = request.get_json() or {}
        if not data.get('old_password') or not data.get('new_password'):
            return jsonify({
                'error': 'Missing fields',
                'message': 'Old password and new password are required'
            }), 400
        
        if not user.check_password(data['old_password']):
            return jsonify({
                'error': 'Invalid current password',
                'message': 'Your current password is incorrect'
            }), 401
        
        new_password = data['new_password']
        if len(new_password) < 6:
            return jsonify({
                'error': 'Password too short',
                'message': 'Password must be at least 6 characters'
            }), 400
        
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Password change error: {e}")
        db.session.rollback()
        return jsonify({
            'error': 'Failed to change password',
            'message': str(e)
        }), 500

# ============================================
# LOGOUT ENDPOINT
# ============================================
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user"""
    return jsonify({'message': 'Logged out successfully'}), 200

# ============================================
# DELETE ACCOUNT ENDPOINT
# ============================================
@auth_bp.route('/delete-account', methods=['DELETE'])
@jwt_required()
def delete_account():
    """Delete user account"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json() or {}
        if not data.get('password'):
            return jsonify({'error': 'Password required'}), 400
        
        if not user.check_password(data['password']):
            return jsonify({'error': 'Invalid password'}), 401
        
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
