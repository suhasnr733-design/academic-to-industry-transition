# backend/app/services/oauth.py

from authlib.integrations.flask_oauth2 import AuthorizationServer
from authlib.oauth2.rfc6749 import grants
from app.models import User, OAuth2Client
from app.extensions import db
import secrets

class OAuth2Service:
    def __init__(self):
        self.setup_oauth2()
    
    def setup_oauth2(self):
        self.server = AuthorizationServer()
        self.server.register_grant(grants.AuthorizationCodeGrant)
        self.server.register_grant(grants.RefreshTokenGrant)
    
    def create_client(self, client_name, client_type='confidential'):
        client = OAuth2Client(
            client_id=secrets.token_urlsafe(16),
            client_secret=secrets.token_urlsafe(32),
            client_type=client_type,
            client_name=client_name
        )
        db.session.add(client)
        db.session.commit()
        return client