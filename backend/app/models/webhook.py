# backend/app/models/webhook.py

from app.extensions import db
from datetime import datetime

class Webhook(db.Model):
    __tablename__ = 'webhooks'
    
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    secret = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WebhookEvent(db.Model):
    __tablename__ = 'webhook_events'
    
    id = db.Column(db.Integer, primary_key=True)
    webhook_id = db.Column(db.Integer, db.ForeignKey('webhooks.id'))
    event_type = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(db.Integer)
    payload = db.Column(db.JSON)
    status = db.Column(db.String(20), default='pending')
    response_code = db.Column(db.Integer)
    response_body = db.Column(db.Text)
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    delivered_at = db.Column(db.DateTime)