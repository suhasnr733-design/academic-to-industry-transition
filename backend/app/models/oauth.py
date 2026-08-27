# backend/app/models/oauth.py

from app import db
from datetime import datetime

class OAuth2Client(db.Model):
    """OAuth2 Client Model"""
    __tablename__ = 'oauth2_clients'

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.String(64), unique=True, index=True, nullable=False)
    client_secret = db.Column(db.String(128), nullable=True)
    client_type = db.Column(db.String(20), default='confidential')
    client_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, client_id=None, client_secret=None, client_type='confidential', client_name='API Client', **kwargs):
        super().__init__(**kwargs)
        if client_id is not None:
            self.client_id = client_id
        if client_secret is not None:
            self.client_secret = client_secret
        self.client_type = client_type
        self.client_name = client_name

    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'client_type': self.client_type,
            'client_name': self.client_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
