# backend/app/services/api_key.py

import secrets
from datetime import datetime
from app.models import APIKey
from app.extensions import db
import logging

logger = logging.getLogger(__name__)

class APIKeyService:
    @staticmethod
    def generate_api_key():
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def create_key(user_id, name, expires_in_days=30):
        key = APIKey(
            user_id=user_id,
            key=APIKeyService.generate_api_key(),
            name=name,
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days)
        )
        db.session.add(key)
        db.session.commit()
        return key
    
    @staticmethod
    def validate_key(key):
        api_key = APIKey.query.filter_by(key=key, is_active=True).first()
        if not api_key:
            return None
        if api_key.expires_at < datetime.utcnow():
            return None
        return api_key
    
    @staticmethod
    def revoke_key(key_id):
        api_key = APIKey.query.get(key_id)
        if api_key:
            api_key.is_active = False
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def list_keys(user_id):
        return APIKey.query.filter_by(user_id=user_id).all()

api_key_service = APIKeyService()