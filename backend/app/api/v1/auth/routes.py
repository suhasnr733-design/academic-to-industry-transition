# backend/app/api/v1/auth/routes.py

from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    decode_token
)
from app import db, limiter
from app.models import User
from app.api.v1.auth import auth_bp
from datetime import datetime, timedelta
import re
import logging
import io
import base64
import json
import secrets
import pyotp
import qrcode

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
        
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            role_label = "Student" if existing_user.role == "student" else "Faculty"
            return jsonify({
                'error': 'Username already exists',
                'message': f'The username "{data["username"]}" is already registered to an existing {role_label} account. Please sign in or choose another username.'
            }), 409
        
        existing_email = User.query.filter_by(email=data['email']).first()
        if existing_email:
            role_label = "Student" if existing_email.role == "student" else "Faculty"
            return jsonify({
                'error': 'Email already registered',
                'message': f'The email "{data["email"]}" is already registered to an existing {role_label} account. Please sign in.'
            }), 409
        
        requested_role = data.get('role', 'student')
        role = requested_role if requested_role in ['student', 'faculty'] else 'student'

        # Faculty accounts require administrator approval before activation
        is_active_on_register = role != 'faculty'

        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            department=data.get('department'),
            year_of_study=data.get('year_of_study'),
            college=data.get('college'),
            role=role,
            is_active=is_active_on_register,
            is_email_verified=is_active_on_register
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()

        # Faculty: return 202 Accepted (pending), not 201 Created with tokens
        if role == 'faculty':
            logger.info(f"Faculty registration pending approval: {user.username} (ID: {user.id})")
            return jsonify({
                'message': 'Faculty registration submitted for review.',
                'detail': 'Your account is pending administrator approval. You will be notified once your account is activated.',
                'pending': True
            }), 202
        
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
            if user.role == 'faculty':
                return jsonify({
                    'error': 'Account pending approval',
                    'message': 'Your Faculty account is pending administrator approval. Please check back later or contact your institution\'s placement office.'
                }), 403
            return jsonify({
                'error': 'Account deactivated',
                'message': 'Your account has been deactivated. Please contact support.'
            }), 403
        
        # Check if Two-Factor Authentication is enabled
        if user.two_factor_enabled:
            temp_token = create_access_token(
                identity=str(user.id),
                expires_delta=timedelta(minutes=5),
                additional_claims={'is_2fa_pending': True}
            )
            logger.info(f"2FA challenge issued for user: {user.username} (ID: {user.id})")
            return jsonify({
                'requires_2fa': True,
                'temp_token': temp_token,
                'message': 'Two-Factor Authentication code required'
            }), 200

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
# IN-MEMORY USER PROFILE CACHE (Optimization 1)
# ============================================
_user_profile_cache = {}
USER_PROFILE_CACHE_TTL = 600  # 10 minutes TTL

def invalidate_profile_cache(user_id=None):
    """Evict user from profile cache when updated or password changed"""
    global _user_profile_cache
    if user_id is not None:
        _user_profile_cache.pop(int(user_id), None)
    else:
        _user_profile_cache.clear()

# ============================================
# GET PROFILE ENDPOINT
# ============================================
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = int(get_jwt_identity())

        # Optimization 1: Serve warm profile from in-memory cache (0.0ms)
        cached_entry = _user_profile_cache.get(current_user_id)
        if cached_entry:
            age = (datetime.utcnow() - cached_entry['timestamp']).total_seconds()
            if age < USER_PROFILE_CACHE_TTL:
                data = dict(cached_entry['data'])
                data['cached'] = True
                return jsonify(data), 200

        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User no longer exists'
            }), 404
        
        user_dict = user.to_dict()
        _user_profile_cache[current_user_id] = {
            'data': user_dict,
            'timestamp': datetime.utcnow()
        }

        resp_data = dict(user_dict)
        resp_data['cached'] = False
        return jsonify(resp_data), 200
        
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
        allowed_fields = [
            'full_name', 'email', 'department', 'year_of_study', 
            'college', 'phone', 'bio', 'notifications_enabled', 'email_alerts_enabled'
        ]
        
        # Validate email if provided and changed
        if 'email' in data:
            new_email = str(data.get('email', '')).strip().lower()
            if not new_email:
                return jsonify({
                    'error': 'Invalid email',
                    'message': 'Email cannot be empty'
                }), 400
                
            email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
            if not re.match(email_pattern, new_email):
                return jsonify({
                    'error': 'Invalid email',
                    'message': 'Please enter a valid email address'
                }), 400
                
            if new_email != (user.email or '').lower():
                existing_user = User.query.filter(User.email == new_email, User.id != current_user_id).first()
                if existing_user:
                    return jsonify({
                        'error': 'Email already in use',
                        'message': 'This email is already registered to another account'
                    }), 400
                user.email = new_email

        updated_fields = []
        for field in allowed_fields:
            if field == 'email':
                if 'email' in data:
                    updated_fields.append('email')
                continue
                
            if field in data:
                if field in ('notifications_enabled', 'email_alerts_enabled'):
                    val = bool(data[field])
                    setattr(user, field, val)
                    updated_fields.append(field)
                    continue
                if field == 'year_of_study':
                    val = data.get('year_of_study')
                    if val is None or str(val).strip() == '':
                        setattr(user, field, None)
                        updated_fields.append(field)
                        continue
                    try:
                        int_val = int(val)
                        if not 1 <= int_val <= 6:
                            return jsonify({
                                'error': 'Invalid year of study',
                                'message': 'Year of study must be between 1 and 6'
                            }), 400
                        setattr(user, field, int_val)
                        updated_fields.append(field)
                    except (ValueError, TypeError):
                        return jsonify({
                            'error': 'Invalid year of study',
                            'message': 'Year of study must be a valid number'
                        }), 400
                    continue
                setattr(user, field, data[field])
                updated_fields.append(field)
        
        db.session.commit()
        
        # Optimization 1: Invalidate profile cache upon update and repopulate fresh state
        invalidate_profile_cache(current_user_id)
        user_data = user.to_dict()
        _user_profile_cache[current_user_id] = {
            'data': user_data,
            'timestamp': datetime.utcnow()
        }

        return jsonify({
            'message': 'Profile updated successfully',
            'updated_fields': updated_fields,
            'user': user_data
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
        
        # Optimization 1: Invalidate profile cache upon password change
        invalidate_profile_cache(current_user_id)

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
# FORGOT PASSWORD ENDPOINT
# ============================================
@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit('5 per minute')
def forgot_password():
    """Generate password reset token and send/return instructions"""
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip()
        
        if not email:
            return jsonify({
                'error': 'Email required',
                'message': 'Please provide your email address'
            }), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({
                'error': 'Account not registered',
                'message': 'This email is not registered with us. Please check your email or sign up first.'
            }), 404

        if not user.is_active:
            return jsonify({
                'error': 'Account inactive',
                'message': 'Your account is currently inactive. Please contact support.'
            }), 403

        from datetime import timedelta
        reset_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(minutes=10),
            additional_claims={'type': 'password_reset'}
        )
        
        from flask import current_app
        raw_origin = request.headers.get('Origin') or request.headers.get('Referer', '')
        # Clean up referer if it has path like /forgot-password
        if raw_origin:
            from urllib.parse import urlparse
            parsed = urlparse(raw_origin)
            if parsed.scheme and parsed.netloc:
                caller_origin = f"{parsed.scheme}://{parsed.netloc}"
            else:
                caller_origin = raw_origin.rstrip('/')
        else:
            caller_origin = None

        frontend_url = caller_origin or current_app.config.get('FRONTEND_URL') or 'http://localhost:5173'
        reset_link = f"{frontend_url}/reset-password?token={reset_token}&role={user.role}"
        
        # Print to dev console for easy testing (ASCII-safe for Windows terminals)
        logger.info(f"Password reset link generated for {user.email}: {reset_link}")
        print(f"\n[PASSWORD RESET LINK for {user.email}]: {reset_link}\n", flush=True)

        try:
            from app import mail
            from flask_mail import Message
            
            sender_email = (
                current_app.config.get('MAIL_DEFAULT_SENDER') or 
                current_app.config.get('MAIL_USERNAME') or 
                'noreply@transitionai.com'
            )
            
            display_name = user.full_name or user.username
            
            msg = Message(
                subject="Password Reset Request - TransitionAI",
                sender=sender_email,
                recipients=[user.email],
                body=(
                    f"Hello {display_name},\n\n"
                    f"We received a request to reset your password. Click the link below to reset your password:\n\n"
                    f"{reset_link}\n\n"
                    f"This link will expire in 10 minutes.\n\n"
                    f"If you did not request this, please ignore this email.\n\n"
                    f"Best regards,\nTransitionAI Team"
                ),
                html=f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                Transition<span style="color: #2563eb;">AI</span>
            </h1>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 13px; font-weight: 500;">
                Intelligent Career & Skill Matching Platform
            </p>
        </div>
        
        <h2 style="margin: 20px 0 8px; font-size: 18px; font-weight: 700; color: #0f172a; text-align: center;">
            Reset Your Password
        </h2>
        
        <p style="font-size: 14px; line-height: 22px; color: #334155; margin-bottom: 12px;">
            Hello <strong>{display_name}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 22px; color: #334155; margin-bottom: 24px;">
            We received a request to reset your password. Click the button below to set a new password:
        </p>
        
        <div style="text-align: center; margin: 28px 0;">
            <a href="{reset_link}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
                Reset Password
            </a>
        </div>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 500;">
                ⚠️ <strong>Security Notice:</strong> This link will expire in <strong>10 minutes</strong>.
            </p>
        </div>
        
        <p style="font-size: 13px; line-height: 20px; color: #64748b; margin-bottom: 20px;">
            If you did not request this password reset, no action is needed. Your account remains secure.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
            Best regards,<br>
            <strong style="color: #475569;">TransitionAI Team</strong>
        </p>
    </div>
</body>
</html>"""
            )
            mail.send(msg)
            logger.info(f"Password reset email sent to: {user.email}")
        except Exception as mail_err:
            logger.warning(f"SMTP send notice (Brevo/Mail configuration): {mail_err}")

        return jsonify({
            'message': f'Password reset link has been sent to {user.email}. Please check your inbox.'
        }), 200
        
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return jsonify({
            'error': 'Failed to process forgot password request',
            'message': str(e)
        }), 500

# ============================================
# RESET PASSWORD ENDPOINT
# ============================================
@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit('5 per minute')
def reset_password():
    """Reset user password using token"""
    try:
        data = request.get_json() or {}
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'Reset token and new password are required'
            }), 400
        
        if len(new_password) < 6:
            return jsonify({
                'error': 'Password too short',
                'message': 'Password must be at least 6 characters'
            }), 400
        
        try:
            from flask_jwt_extended import decode_token
            decoded = decode_token(token)
            if decoded.get('type') != 'password_reset':
                return jsonify({
                    'error': 'Invalid token type',
                    'message': 'Token provided is not a valid password reset token'
                }), 400
            user_id = int(decoded.get('sub'))
        except Exception:
            return jsonify({
                'error': 'Invalid or expired token',
                'message': 'The reset token is invalid or has expired. Please request a new one.'
            }), 400
        
        user = db.session.get(User, user_id)
        if not user or not user.is_active:
            return jsonify({
                'error': 'User not found',
                'message': 'User no longer exists or is inactive'
            }), 404
        
        user.set_password(new_password)
        db.session.commit()
        
        # Optimization 1: Invalidate profile cache upon password reset
        invalidate_profile_cache(user_id)

        logger.info(f"Password successfully reset for user: {user.username}")
        
        return jsonify({
            'message': 'Password reset successful. You can now log in with your new password.'
        }), 200
        
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        db.session.rollback()
        return jsonify({
            'error': 'Failed to reset password',
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

# ============================================
# OAUTH HELPER
# ============================================
import os
import secrets
import urllib.parse
import requests
from flask import current_app, redirect

def find_or_create_oauth_user(provider, provider_id, email, full_name, picture=None, requested_role='student'):
    """Find existing user by OAuth ID or email, or create a new user with requested role."""
    if not email:
        raise ValueError("OAuth provider did not return a valid email address.")

    target_role = requested_role if requested_role in ['student', 'faculty', 'admin'] else 'student'

    # 1. Check existing user by provider & provider_id
    user = User.query.filter_by(oauth_provider=provider, oauth_provider_id=str(provider_id)).first()
    if user:
        if target_role == 'faculty' and user.role == 'student':
            user.role = 'faculty'
        user.last_login = datetime.utcnow()
        if picture and not user.profile_picture:
            user.profile_picture = picture
        db.session.commit()
        return user

    # 2. Check existing user by email -> safely link account
    user = User.query.filter_by(email=email).first()
    if user:
        if target_role == 'faculty' and user.role == 'student':
            user.role = 'faculty'
        user.oauth_provider = provider
        user.oauth_provider_id = str(provider_id)
        user.is_email_verified = True
        user.last_login = datetime.utcnow()
        if picture and not user.profile_picture:
            user.profile_picture = picture
        db.session.commit()
        return user

    # 3. Create new OAuth user
    base_username = email.split('@')[0]
    base_username = re.sub(r'[^a-zA-Z0-9_]', '', base_username) or 'user'
    username = base_username
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{base_username}_{counter}"
        counter += 1

    random_password = os.urandom(24).hex()
    user = User(
        username=username,
        email=email,
        full_name=full_name or username,
        role=target_role,
        is_active=True,
        is_email_verified=True,
        oauth_provider=provider,
        oauth_provider_id=str(provider_id),
        profile_picture=picture,
        last_login=datetime.utcnow()
    )
    user.set_password(random_password)
    db.session.add(user)
    db.session.commit()
    return user

# ============================================
# GOOGLE OAUTH ENDPOINTS
# ============================================
@auth_bp.route('/google', methods=['GET'])
def google_auth():
    """Initiate Google OAuth authentication flow with role context"""
    client_id = current_app.config.get('GOOGLE_CLIENT_ID')
    redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI')
    frontend_url = current_app.config.get('FRONTEND_URL') or 'http://localhost:5173'

    if not client_id or not current_app.config.get('GOOGLE_CLIENT_SECRET'):
        logger.warning("Google OAuth credentials missing in configuration.")
        return redirect(f"{frontend_url}/auth/callback?error=google_oauth_not_configured")

    role = request.args.get('role', 'student')
    state = f"{secrets.token_urlsafe(16)}--{role}"
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state,
        'access_type': 'online'
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return redirect(auth_url)

@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Google OAuth callback handler"""
    frontend_url = current_app.config.get('FRONTEND_URL') or 'http://localhost:5173'
    error = request.args.get('error')
    code = request.args.get('code')
    state = request.args.get('state', '')

    requested_role = 'student'
    if '--' in state:
        parts = state.split('--')
        if len(parts) > 1 and parts[1] in ['student', 'faculty']:
            requested_role = parts[1]

    if error or not code:
        logger.error(f"Google OAuth error: {error}")
        return redirect(f"{frontend_url}/auth/callback?error={error or 'google_code_missing'}")

    client_id = current_app.config.get('GOOGLE_CLIENT_ID')
    client_secret = current_app.config.get('GOOGLE_CLIENT_SECRET')
    redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI')

    if not client_id or not client_secret:
        return redirect(f"{frontend_url}/auth/callback?error=google_oauth_not_configured")

    try:
        # Exchange code for tokens
        token_resp = requests.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }, timeout=10)
        
        if token_resp.status_code != 200:
            logger.error(f"Google token exchange failed: {token_resp.text}")
            return redirect(f"{frontend_url}/auth/callback?error=google_token_failed")

        token_data = token_resp.json()
        access_token_val = token_data.get('access_token')

        # Fetch Google user profile
        userinfo_resp = requests.get('https://www.googleapis.com/oauth2/v3/userinfo', headers={
            'Authorization': f'Bearer {access_token_val}'
        }, timeout=10)

        if userinfo_resp.status_code != 200:
            logger.error(f"Google userinfo failed: {userinfo_resp.text}")
            return redirect(f"{frontend_url}/auth/callback?error=google_userinfo_failed")

        user_info = userinfo_resp.json()
        email = user_info.get('email')
        sub = user_info.get('sub')
        name = user_info.get('name')
        picture = user_info.get('picture')

        user = find_or_create_oauth_user('google', sub, email, name, picture, requested_role=requested_role)

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        params = urllib.parse.urlencode({
            'token': access_token,
            'refresh_token': refresh_token
        })
        return redirect(f"{frontend_url}/auth/callback?{params}")

    except Exception as e:
        logger.error(f"Google callback exception: {e}")
        return redirect(f"{frontend_url}/auth/callback?error=google_callback_exception")

# ============================================
# LINKEDIN OAUTH ENDPOINTS
# ============================================
@auth_bp.route('/linkedin', methods=['GET'])
def linkedin_auth():
    """Initiate LinkedIn OAuth OpenID Connect flow with role context"""
    client_id = current_app.config.get('LINKEDIN_CLIENT_ID')
    redirect_uri = current_app.config.get('LINKEDIN_REDIRECT_URI')
    frontend_url = current_app.config.get('FRONTEND_URL') or 'http://localhost:5173'

    if not client_id or not current_app.config.get('LINKEDIN_CLIENT_SECRET'):
        logger.warning("LinkedIn OAuth credentials missing in configuration.")
        return redirect(f"{frontend_url}/auth/callback?error=linkedin_oauth_not_configured")

    role = request.args.get('role', 'student')
    state = f"{secrets.token_urlsafe(16)}--{role}"
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid profile email',
        'state': state
    }
    auth_url = f"https://www.linkedin.com/oauth/v2/authorization?{urllib.parse.urlencode(params)}"
    return redirect(auth_url)

@auth_bp.route('/linkedin/callback', methods=['GET'])
def linkedin_callback():
    """LinkedIn OAuth callback handler"""
    frontend_url = current_app.config.get('FRONTEND_URL') or 'http://localhost:5173'
    error = request.args.get('error')
    code = request.args.get('code')
    state = request.args.get('state', '')

    requested_role = 'student'
    if '--' in state:
        parts = state.split('--')
        if len(parts) > 1 and parts[1] in ['student', 'faculty']:
            requested_role = parts[1]

    if error or not code:
        logger.error(f"LinkedIn OAuth error: {error}")
        return redirect(f"{frontend_url}/auth/callback?error={error or 'linkedin_code_missing'}")

    client_id = current_app.config.get('LINKEDIN_CLIENT_ID')
    client_secret = current_app.config.get('LINKEDIN_CLIENT_SECRET')
    redirect_uri = current_app.config.get('LINKEDIN_REDIRECT_URI')

    if not client_id or not client_secret:
        return redirect(f"{frontend_url}/auth/callback?error=linkedin_oauth_not_configured")

    try:
        # Exchange code for tokens
        token_resp = requests.post('https://www.linkedin.com/oauth/v2/accessToken', data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': client_id,
            'client_secret': client_secret
        }, headers={'Content-Type': 'application/x-www-form-urlencoded'}, timeout=10)

        if token_resp.status_code != 200:
            logger.error(f"LinkedIn token exchange failed: {token_resp.text}")
            return redirect(f"{frontend_url}/auth/callback?error=linkedin_token_failed")

        token_data = token_resp.json()
        access_token_val = token_data.get('access_token')

        # Fetch LinkedIn Userinfo (OpenID Connect standard)
        userinfo_resp = requests.get('https://api.linkedin.com/v2/userinfo', headers={
            'Authorization': f'Bearer {access_token_val}'
        }, timeout=10)

        if userinfo_resp.status_code != 200:
            logger.error(f"LinkedIn userinfo failed: {userinfo_resp.text}")
            return redirect(f"{frontend_url}/auth/callback?error=linkedin_userinfo_failed")

        user_info = userinfo_resp.json()
        email = user_info.get('email')
        sub = user_info.get('sub')
        name = user_info.get('name') or f"{user_info.get('given_name', '')} {user_info.get('family_name', '')}".strip()
        picture = user_info.get('picture')

        user = find_or_create_oauth_user('linkedin', sub, email, name, picture, requested_role=requested_role)

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        params = urllib.parse.urlencode({
            'token': access_token,
            'refresh_token': refresh_token
        })
        return redirect(f"{frontend_url}/auth/callback?{params}")

    except Exception as e:
        logger.error(f"LinkedIn callback exception: {e}")
        return redirect(f"{frontend_url}/auth/callback?error=linkedin_callback_exception")

# ============================================
# TWO-FACTOR AUTHENTICATION (2FA) ENDPOINTS
# ============================================

@auth_bp.route('/2fa/setup', methods=['POST'])
@jwt_required()
def setup_two_factor():
    """Generate a TOTP secret and QR code for the authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id)) if current_user_id else None
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.two_factor_enabled:
            return jsonify({'error': 'Two-Factor Authentication is already enabled on your account'}), 400

        # 1. Generate a 32-character base32 secret
        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        db.session.commit()

        # 2. Construct standard TOTP URI
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name="CareerPortal"
        )

        # 3. Render QR Code image into memory as Base64 data URL
        qr_img = qrcode.make(provisioning_uri)
        buf = io.BytesIO()
        qr_img.save(buf, format='PNG')
        buf.seek(0)
        qr_base64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')

        return jsonify({
            'secret': secret,
            'qr_code': qr_base64,
            'message': 'Scan this QR code with Google Authenticator or Microsoft Authenticator'
        }), 200

    except Exception as e:
        logger.error(f"Error initiating 2FA setup: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to initiate 2FA setup', 'details': str(e)}), 500


@auth_bp.route('/2fa/verify-setup', methods=['POST'])
@jwt_required()
def verify_two_factor_setup():
    """Verify the 6-digit code and officially activate 2FA"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id)) if current_user_id else None
        
        if not user or not user.two_factor_secret:
            return jsonify({'error': 'Please initiate 2FA setup first'}), 400

        data = request.get_json() or {}
        code = str(data.get('code', '')).strip()

        if not code:
            return jsonify({'error': '6-digit verification code is required'}), 400

        # Verify code using pyotp (valid_window=1 accommodates +-30s clock drift)
        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(code, valid_window=1):
            return jsonify({'error': 'Invalid or expired 6-digit code. Please try again.'}), 400

        # Generate 8 random one-time backup recovery codes (e.g. 'a8b2-4f1c')
        backup_codes = [f"{secrets.token_hex(2)}-{secrets.token_hex(2)}" for _ in range(8)]
        
        # Enable 2FA on the user
        user.two_factor_enabled = True
        user.two_factor_backup_codes = json.dumps(backup_codes)
        db.session.commit()

        return jsonify({
            'message': 'Two-Factor Authentication successfully enabled!',
            'backup_codes': backup_codes,
            'two_factor_enabled': True
        }), 200

    except Exception as e:
        logger.error(f"Error verifying 2FA setup: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to verify 2FA code', 'details': str(e)}), 500


@auth_bp.route('/2fa/disable', methods=['POST'])
@jwt_required()
def disable_two_factor():
    """Disable Two-Factor Authentication with password verification"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id)) if current_user_id else None
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json() or {}
        password = data.get('password')

        if not password:
            return jsonify({'error': 'Password is required to disable 2FA'}), 400

        # Confirm user password before disabling security layer
        if not user.check_password(password):
            return jsonify({'error': 'Incorrect password'}), 401

        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.two_factor_backup_codes = None
        db.session.commit()

        return jsonify({
            'message': 'Two-Factor Authentication has been successfully disabled',
            'two_factor_enabled': False
        }), 200

    except Exception as e:
        logger.error(f"Error disabling 2FA: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to disable 2FA', 'details': str(e)}), 500


@auth_bp.route('/2fa/validate-login', methods=['POST'])
@limiter.limit('10 per minute')
def validate_two_factor_login():
    """Verify 2FA code during login and return full session tokens"""
    try:
        data = request.get_json() or {}
        temp_token = data.get('temp_token')
        code = str(data.get('code', '')).strip()

        if not temp_token or not code:
            return jsonify({'error': 'Temporary token and 2FA code are required'}), 400

        # 1. Decode and validate the temporary 2FA token
        try:
            decoded = decode_token(temp_token)
        except Exception as te:
            logger.warning(f"Invalid or expired 2FA token submitted: {te}")
            return jsonify({'error': 'Invalid or expired 2FA session. Please log in again.'}), 401

        if not decoded.get('is_2fa_pending'):
            return jsonify({'error': 'Invalid token type for 2FA validation'}), 401

        user_id = decoded.get('sub')
        user = User.query.get(int(user_id)) if user_id else None

        if not user or not user.is_active:
            return jsonify({'error': 'User not found or account inactive'}), 404

        # 2. Verify with TOTP authenticator
        is_valid = False
        if user.two_factor_secret:
            totp = pyotp.TOTP(user.two_factor_secret)
            is_valid = totp.verify(code, valid_window=1)

        # 3. Fallback: Check one-time backup recovery codes
        if not is_valid and user.two_factor_backup_codes:
            try:
                backup_codes = json.loads(user.two_factor_backup_codes)
                if code in backup_codes:
                    is_valid = True
                    backup_codes.remove(code)
                    user.two_factor_backup_codes = json.dumps(backup_codes)
                    logger.info(f"User {user.username} logged in with backup code. {len(backup_codes)} codes left.")
            except Exception as e:
                logger.error(f"Error parsing backup codes for user {user.username}: {e}")

        if not is_valid:
            return jsonify({'error': 'Invalid or expired verification code'}), 401

        # 4. Success: Generate complete session tokens
        user.last_login = datetime.utcnow()
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        logger.info(f"User completed 2FA login: {user.username} (ID: {user.id})")

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"2FA login validation exception: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to validate 2FA login', 'details': str(e)}), 500
