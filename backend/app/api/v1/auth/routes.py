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
                'error': 'Email not registered',
                'message': 'No account found with that email address. Please check your email or sign up.'
            }), 404
        
        from datetime import timedelta
        reset_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(minutes=15),
            additional_claims={'type': 'password_reset'}
        )
        
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"

        # Send Real Email via Flask-Mail
        email_sent = False
        try:
            from app import mail
            from flask_mail import Message
            
            msg = Message(
                subject="Password Reset Request - TransitionalAI",
                recipients=[user.email],
                body=f"Hello {user.username},\n\nWe received a request to reset your password. Click the link below to reset your password:\n\n{reset_link}\n\nThis link will expire in 15 minutes.\n\nBest regards,\nTransitionalAI Team"
            )
            mail.send(msg)
            email_sent = True
            logger.info(f"Password reset email sent to: {user.email}")
        except Exception as mail_err:
            logger.warning(f"SMTP send notice: {mail_err}")

        return jsonify({
            'message': 'Password reset link sent to your email inbox.' if email_sent else 'Password reset token generated successfully.',
            'reset_token': reset_token,
            'reset_url': f"/reset-password?token={reset_token}"
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

def find_or_create_oauth_user(provider, provider_id, email, full_name, picture=None):
    """Find existing user by OAuth ID or email, or create a new student account."""
    if not email:
        raise ValueError("OAuth provider did not return a valid email address.")

    # 1. Check existing user by provider & provider_id
    user = User.query.filter_by(oauth_provider=provider, oauth_provider_id=str(provider_id)).first()
    if user:
        user.last_login = datetime.utcnow()
        if picture and not user.profile_picture:
            user.profile_picture = picture
        db.session.commit()
        return user

    # 2. Check existing user by email -> safely link account
    user = User.query.filter_by(email=email).first()
    if user:
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
        role='student',
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
    """Initiate Google OAuth authentication flow"""
    client_id = current_app.config.get('GOOGLE_CLIENT_ID')
    redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI')
    frontend_url = current_app.config.get('FRONTEND_URL')

    if not client_id or not current_app.config.get('GOOGLE_CLIENT_SECRET'):
        logger.warning("Google OAuth credentials missing in configuration.")
        return redirect(f"{frontend_url}/auth/callback?error=google_oauth_not_configured")

    state = secrets.token_urlsafe(16)
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
    frontend_url = current_app.config.get('FRONTEND_URL')
    error = request.args.get('error')
    code = request.args.get('code')

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

        user = find_or_create_oauth_user('google', sub, email, name, picture)

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
    """Initiate LinkedIn OAuth OpenID Connect flow"""
    client_id = current_app.config.get('LINKEDIN_CLIENT_ID')
    redirect_uri = current_app.config.get('LINKEDIN_REDIRECT_URI')
    frontend_url = current_app.config.get('FRONTEND_URL')

    if not client_id or not current_app.config.get('LINKEDIN_CLIENT_SECRET'):
        logger.warning("LinkedIn OAuth credentials missing in configuration.")
        return redirect(f"{frontend_url}/auth/callback?error=linkedin_oauth_not_configured")

    state = secrets.token_urlsafe(16)
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
    frontend_url = current_app.config.get('FRONTEND_URL')
    error = request.args.get('error')
    code = request.args.get('code')

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

        user = find_or_create_oauth_user('linkedin', sub, email, name, picture)

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
