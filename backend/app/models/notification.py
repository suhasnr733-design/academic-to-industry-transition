# backend/app/models/notification.py

from app import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), default='info')
    link = db.Column(db.String(555), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('notifications', lazy=True))
    
    def __init__(self, user_id=None, title=None, message=None, notification_type='info', link=None, is_read=False, **kwargs):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        self.title = title
        self.message = message
        self.notification_type = notification_type
        self.link = link
        self.is_read = is_read

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.notification_type,
            'link': self.link,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
