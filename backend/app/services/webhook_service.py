# backend/app/services/webhook_service.py

import json
import requests
from datetime import datetime
from app.extensions import db
from app.models import Webhook, WebhookEvent
import logging

logger = logging.getLogger(__name__)

class WebhookService:
    """Webhook notification service"""
    
    @staticmethod
    def trigger_webhook(event_type: str, data: dict, resource_id: int = None):
        """Trigger webhook for an event"""
        # Get all active webhooks for this event type
        webhooks = Webhook.query.filter_by(
            event_type=event_type,
            is_active=True
        ).all()
        
        if not webhooks:
            return
        
        # Create event record
        event = WebhookEvent(
            event_type=event_type,
            resource_id=resource_id,
            payload=data,
            created_at=datetime.utcnow()
        )
        db.session.add(event)
        db.session.commit()
        
        # Send to each webhook
        for webhook in webhooks:
            WebhookService._send_webhook(webhook, event)
    
    @staticmethod
    def _send_webhook(webhook, event):
        """Send webhook request"""
        try:
            payload = {
                'event': webhook.event_type,
                'timestamp': event.created_at.isoformat(),
                'data': event.payload,
                'webhook_id': webhook.id
            }
            
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Academic-to-Industry-Webhook/1.0'
            }
            
            if webhook.secret:
                headers['X-Webhook-Signature'] = WebhookService._generate_signature(
                    payload, webhook.secret
                )
            
            response = requests.post(
                webhook.url,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            # Update event status
            event.status = 'sent' if response.status_code < 400 else 'failed'
            event.response_code = response.status_code
            event.response_body = response.text[:500]
            db.session.commit()
            
            logger.info(f"Webhook {webhook.id} sent: {response.status_code}")
            
        except Exception as e:
            event.status = 'failed'
            event.error_message = str(e)
            db.session.commit()
            logger.error(f"Webhook {webhook.id} error: {e}")
    
    @staticmethod
    def _generate_signature(payload: dict, secret: str) -> str:
        """Generate webhook signature"""
        import hmac
        import hashlib
        message = json.dumps(payload, sort_keys=True)
        signature = hmac.new(
            secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"