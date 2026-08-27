from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from app.models import User
import re
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    return True, "Valid password"

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password', 'full_name']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({
            'error': f'Missing required fields: {", ".join(missing_fields)}'
        }), 400
    
    # Validate email
    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password
    is_valid, message = validate_password(data['password'])
    if not is_valid:
        return jsonify({'error': message}), 400
    
    # Check if user exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create user
    user = User(
        username=data['username'],
        email=data['email'],
        full_name=data['full_name'],
        role=data.get('role', 'student'),
        department=data.get('department', ''),
        year_of_study=data.get('year_of_study', 1)
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Generate tokens (Casting identity to a string to fix JWT compatibility)
    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(hours=1)
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        expires_delta=timedelta(days=7)
    )
    
    return jsonify({
        'message': 'User registered successfully',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return tokens"""
    data = request.get_json()
    
    # Validate input
    if 'username' not in data and 'email' not in data:
        return jsonify({'error': 'Username or email required'}), 400
    
    if 'password' not in data:
        return jsonify({'error': 'Password required'}), 400
    
    # Find user
    user = None
    if 'username' in data:
        user = User.query.filter_by(username=data['username']).first()
    else:
        user = User.query.filter_by(email=data['email']).first()
    
    # Verify credentials
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    # Generate tokens (Casting identity to a string to fix JWT compatibility)
    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(hours=1)
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        expires_delta=timedelta(days=7)
    )
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    
    user = User.query.get(current_user_id)
    if not user or not user.is_active:
        return jsonify({'error': 'User not found or inactive'}), 404
    
    # Generate fresh access token (Ensuring string type)
    new_access_token = create_access_token(
        identity=str(current_user_id),
        expires_delta=timedelta(hours=1)
    )
    
    return jsonify({'access_token': new_access_token}), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token discard)"""
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json() or {}
    
    # Allowed fields to update
    allowed_fields = ['full_name', 'email', 'department', 'year_of_study', 'college', 'phone', 'bio']
    
    if 'email' in data:
        new_email = str(data.get('email', '')).strip().lower()
        if not new_email or not validate_email(new_email):
            return jsonify({'error': 'Please enter a valid email address'}), 400
        if new_email != (user.email or '').lower():
            existing_user = User.query.filter(User.email == new_email, User.id != current_user_id).first()
            if existing_user:
                return jsonify({'error': 'This email is already registered to another account'}), 400
            user.email = new_email

    for field in allowed_fields:
        if field == 'email':
            continue
        if field in data:
            if field == 'year_of_study':
                val = data.get('year_of_study')
                if val is None or str(val).strip() == '':
                    setattr(user, field, None)
                    continue
                try:
                    setattr(user, field, int(val))
                except (ValueError, TypeError):
                    pass
                continue
            setattr(user, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if 'old_password' not in data or 'new_password' not in data:
        return jsonify({'error': 'Old and new password required'}), 400
    
    # Verify old password
    if not user.check_password(data['old_password']):
        return jsonify({'error': 'Invalid current password'}), 401
    
    # Validate new password
    is_valid, message = validate_password(data['new_password'])
    if not is_valid:
        return jsonify({'error': message}), 400
    
    # Update password
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200