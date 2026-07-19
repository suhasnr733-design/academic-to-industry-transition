<<<<<<< HEAD
﻿# backend/app/api/v1/auth/routes.py

from flask import request, jsonify, current_app
=======
﻿from flask import request, jsonify, current_app
>>>>>>> 2030d95c258619aabe6b95adc937342934a82c28
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required,
<<<<<<< HEAD
    get_jwt_identity,
    get_jwt
=======
    get_jwt_identity
>>>>>>> 2030d95c258619aabe6b95adc937342934a82c28
)
from app.extensions import db, limiter
from app.models import User
from app.api.v1.auth import auth_bp
<<<<<<< HEAD
from app.services.rate_limiter import auth_rate_limit, public_rate_limit
from app.services.notification_service import NotificationService
from app.services.monitoring import APIMonitor
from datetime import datetime
import re
import logging

logger = logging.getLogger(__name__)

# ============================================
# REGISTER ENDPOINT
# ============================================
@auth_bp.route('/register', methods=['POST'])
@public_rate_limit
@APIMonitor.track_request
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
              example: "john_doe"
            email:
              type: string
              example: "john@example.com"
            password:
              type: string
              example: "StrongPass123!"
            full_name:
              type: string
              example: "John Doe"
            department:
              type: string
              example: "Computer Science"
            year_of_study:
              type: integer
              example: 4
            college:
              type: string
              example: "MIT"
    responses:
      201:
        description: User registered successfully
      400:
        description: Validation error
      409:
        description: User already exists
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['username', 'email', 'password', 'full_name']
        missing = [field for field in required if not data.get(field)]
        if missing:
            return jsonify({
                'error': 'Missing required fields',
                'missing': missing
            }), 400
        
        # Validate username
        if not re.match(r'^[a-zA-Z0-9_]+$', data['username']):
            return jsonify({
                'error': 'Invalid username',
                'message': 'Username can only contain letters, numbers, and underscores'
            }), 400
        
        # Validate email
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data['email']):
            return jsonify({
                'error': 'Invalid email',
                'message': 'Please provide a valid email address'
            }), 400
        
        # Validate password strength
        password = data['password']
        if len(password) < 8:
            return jsonify({
                'error': 'Password too short',
                'message': 'Password must be at least 8 characters'
            }), 400
        if not re.search(r'[A-Z]', password):
            return jsonify({
                'error': 'Password too weak',
                'message': 'Password must contain at least one uppercase letter'
            }), 400
        if not re.search(r'[a-z]', password):
            return jsonify({
                'error': 'Password too weak',
                'message': 'Password must contain at least one lowercase letter'
            }), 400
        if not re.search(r'[0-9]', password):
            return jsonify({
                'error': 'Password too weak',
                'message': 'Password must contain at least one number'
            }), 400
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return jsonify({
                'error': 'Password too weak',
                'message': 'Password must contain at least one special character'
            }), 400
        
        # Check if user exists
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
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            department=data.get('department'),
            year_of_study=data.get('year_of_study'),
            college=data.get('college'),
            role='student'  # Default role
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Send welcome notification
        try:
            NotificationService.send_in_app_notification(
                user.id,
                "Welcome to Academic-to-Industry Platform!",
                "Start your journey by uploading your resume.",
                'info',
                '/resume/upload'
            )
        except Exception as e:
            logger.error(f"Welcome notification failed: {e}")
        
        # Log the registration
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
@auth_rate_limit
@APIMonitor.track_request
def login():
    """
    Login user
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
              example: "john_doe"
            email:
              type: string
              example: "john@example.com"
            password:
              type: string
              example: "StrongPass123!"
    responses:
      200:
        description: Login successful
      400:
        description: Missing fields
      401:
        description: Invalid credentials
      403:
        description: Account deactivated
    """
    try:
        data = request.get_json()
        
        if not data.get('password'):
            return jsonify({
                'error': 'Password required',
                'message': 'Please provide your password'
            }), 400
        
        # Find user by username or email
        user = None
        if data.get('username'):
            user = User.query.filter_by(username=data['username']).first()
        elif data.get('email'):
            user = User.query.filter_by(email=data['email']).first()
        else:
            return jsonify({
                'error': 'Username or email required',
                'message': 'Please provide username or email'
            }), 400
        
        # Validate credentials
        if not user:
            return jsonify({
                'error': 'Invalid credentials',
                'message': 'User not found'
            }), 401
        
        if not user.check_password(data['password']):
            # Log failed login attempt
            logger.warning(f"Failed login attempt for: {user.username}")
            return jsonify({
                'error': 'Invalid credentials',
                'message': 'Incorrect password'
            }), 401
        
        if not user.is_active:
            return jsonify({
                'error': 'Account deactivated',
                'message': 'Your account has been deactivated. Please contact support.'
            }), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Log successful login
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
@APIMonitor.track_request
def refresh():
    """
    Refresh access token
    ---
    tags:
      - Authentication
    security:
      - bearerAuth: []
    responses:
      200:
        description: Token refreshed successfully
      401:
        description: Invalid refresh token
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'error': 'User not found or inactive',
                'message': 'Please login again'
            }), 404
        
        new_access_token = create_access_token(identity=user.id)
        
        logger.info(f"Token refreshed for user: {user.username}")
        
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
@APIMonitor.track_request
def get_profile():
    """
    Get current user profile
    ---
    tags:
      - User Profile
    security:
      - bearerAuth: []
    responses:
      200:
        description: Profile retrieved successfully
      404:
        description: User not found
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
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
@APIMonitor.track_request
def update_profile():
    """
    Update user profile
    ---
    tags:
      - User Profile
    security:
      - bearerAuth: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            full_name:
              type: string
            department:
              type: string
            year_of_study:
              type: integer
            college:
              type: string
            phone:
              type: string
            bio:
              type: string
    responses:
      200:
        description: Profile updated successfully
      404:
        description: User not found
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User no longer exists'
            }), 404
        
        data = request.get_json()
        allowed_fields = ['full_name', 'department', 'year_of_study', 'college', 'phone', 'bio']
        
        updated_fields = []
        for field in allowed_fields:
            if field in data:
                # Validate year_of_study
                if field == 'year_of_study' and data[field] is not None:
                    if not 1 <= data[field] <= 6:
                        return jsonify({
                            'error': 'Invalid year of study',
                            'message': 'Year of study must be between 1 and 6'
                        }), 400
                setattr(user, field, data[field])
                updated_fields.append(field)
        
        db.session.commit()
        
        # Send notification for profile update
        if updated_fields:
            try:
                NotificationService.send_in_app_notification(
                    user.id,
                    "Profile Updated",
                    "Your profile has been successfully updated.",
                    'success',
                    '/profile'
                )
            except Exception as e:
                logger.error(f"Profile update notification failed: {e}")
        
        logger.info(f"Profile updated for user: {user.username}")
        
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
@APIMonitor.track_request
def change_password():
    """
    Change user password
    ---
    tags:
      - User Profile
    security:
      - bearerAuth: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            old_password:
              type: string
            new_password:
              type: string
    responses:
      200:
        description: Password changed successfully
      400:
        description: Validation error
      401:
        description: Invalid current password
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User no longer exists'
            }), 404
        
        data = request.get_json()
        
        if not data.get('old_password') or not data.get('new_password'):
            return jsonify({
                'error': 'Missing fields',
                'message': 'Old password and new password are required'
            }), 400
        
        # Validate old password
        if not user.check_password(data['old_password']):
            # Log failed password change attempt
            logger.warning(f"Failed password change for user: {user.username}")
            return jsonify({
                'error': 'Invalid current password',
                'message': 'Your current password is incorrect'
            }), 401
        
        # Validate new password strength
        new_password = data['new_password']
        if len(new_password) < 8:
            return jsonify({
                'error': 'Password too short',
                'message': 'Password must be at least 8 characters'
            }), 400
        if not re.search(r'[A-Z]', new_password):
            return jsonify({
                'error': 'Password too weak',
                'message': 'Password must contain at least one uppercase letter'
            }), 400
        if not re.search(r'[a-z]', new_password):
            return jsonify({
                'error': 'Password too weak',
                'message': 'Password must contain at least one lowercase letter'
            }), 400
        if not re.search(r'[0-9]', new_password):
            return jsonify({
                'error': 'Password too weak',
                'message': 'Password must contain at least one number'
            }), 400
        
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        # Send notification
        try:
            NotificationService.send_in_app_notification(
                user.id,
                "Password Changed",
                "Your password has been successfully changed.",
                'success',
                '/profile'
            )
        except Exception as e:
            logger.error(f"Password change notification failed: {e}")
        
        logger.info(f"Password changed for user: {user.username}")
        
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
@APIMonitor.track_request
def logout():
    """
    Logout user
    ---
    tags:
      - Authentication
    security:
      - bearerAuth: []
    responses:
      200:
        description: Logged out successfully
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user:
            # Add token to blacklist (optional)
            # For now, just client-side token discard
            logger.info(f"User logged out: {user.username}")
        
        return jsonify({
            'message': 'Logged out successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return jsonify({
            'error': 'Logout failed',
            'message': str(e)
        }), 500

# ============================================
# DELETE ACCOUNT ENDPOINT
# ============================================
@auth_bp.route('/delete-account', methods=['DELETE'])
@jwt_required()
@APIMonitor.track_request
def delete_account():
    """
    Delete user account
    ---
    tags:
      - User Profile
    security:
      - bearerAuth: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            password:
              type: string
    responses:
      200:
        description: Account deleted successfully
      400:
        description: Password required
      401:
        description: Invalid password
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User no longer exists'
            }), 404
        
        data = request.get_json()
        if not data.get('password'):
            return jsonify({
                'error': 'Password required',
                'message': 'Please provide your password to confirm deletion'
            }), 400
        
        if not user.check_password(data['password']):
            return jsonify({
                'error': 'Invalid password',
                'message': 'Incorrect password'
            }), 401
        
        # Soft delete - deactivate account
        user.is_active = False
        db.session.commit()
        
        logger.info(f"Account deleted for user: {user.username}")
        
        return jsonify({
            'message': 'Account deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Account deletion error: {e}")
        db.session.rollback()
        return jsonify({
            'error': 'Failed to delete account',
            'message': str(e)
        }), 500
=======
from datetime import datetime

@auth_bp.route('/register', methods=['POST'])
@limiter.limit('5 per minute')
def register():
    data = request.get_json()
    
    if not data.get('username') or not data.get('email') or not data.get('password') or not data.get('full_name'):
        return jsonify({'error': 'All fields are required'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    user = User(
        username=data['username'],
        email=data['email'],
        full_name=data['full_name'],
        department=data.get('department'),
        year_of_study=data.get('year_of_study'),
        college=data.get('college')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'message': 'User registered successfully',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit('10 per minute')
def login():
    data = request.get_json()
    
    if not data.get('password'):
        return jsonify({'error': 'Password required'}), 400
    
    # FIXED: Properly find user by username OR email
    user = None
    if data.get('username'):
        user = User.query.filter_by(username=data['username']).first()
    elif data.get('email'):
        user = User.query.filter_by(email=data['email']).first()
    else:
        return jsonify({'error': 'Username or email required'}), 400
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data.get('old_password') or not data.get('new_password'):
        return jsonify({'error': 'Old and new password required'}), 400
    
    if not user.check_password(data['old_password']):
        return jsonify({'error': 'Invalid current password'}), 401
    
    if len(data['new_password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200
>>>>>>> 2030d95c258619aabe6b95adc937342934a82c28
