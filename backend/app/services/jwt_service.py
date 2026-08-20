# backend/app/services/jwt_service.py

import jwt
from datetime import datetime, timedelta
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class JWTService:
    """JWT token management"""
    
    @staticmethod
    def generate_tokens(user_id):
        access_token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
        
        refresh_token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': 3600
        }
    
    @staticmethod
    def validate_token(token):
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            return {'valid': True, 'payload': payload}
        except jwt.ExpiredSignatureError:
            return {'valid': False, 'error': 'Token expired'}
        except jwt.InvalidTokenError:
            return {'valid': False, 'error': 'Invalid token'}
    
    @staticmethod
    def refresh_access_token(refresh_token):
        result = JWTService.validate_token(refresh_token)
        if not result['valid']:
            return {'error': result['error']}
        
        user_id = result['payload']['user_id']
        return JWTService.generate_tokens(user_id)