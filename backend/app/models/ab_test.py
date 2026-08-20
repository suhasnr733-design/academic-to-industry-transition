# backend/app/models/ab_test.py

from app import db
from datetime import datetime

class ABTest(db.Model):
    """A/B Test definition"""
    __tablename__ = 'ab_tests'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    variants = db.relationship('ABTestVariant', backref='ab_test', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'variants': [v.to_dict() for v in self.variants]
        }

class ABTestVariant(db.Model):
    """A/B Test Variant definition"""
    __tablename__ = 'ab_test_variants'

    id = db.Column(db.Integer, primary_key=True)
    ab_test_id = db.Column(db.Integer, db.ForeignKey('ab_tests.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    model_version = db.Column(db.String(50), nullable=False)
    traffic_percentage = db.Column(db.Float, default=50.0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'model_version': self.model_version,
            'traffic_percentage': self.traffic_percentage
        }
