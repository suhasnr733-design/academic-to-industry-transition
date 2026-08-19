# backend/app/models/assessment.py

from app import db
from datetime import datetime

class AssessmentResult(db.Model):
    __tablename__ = 'assessment_results'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assessment_type = db.Column(db.String(50))  # quiz, coding, aptitude
    score = db.Column(db.Float)
    total_questions = db.Column(db.Integer)
    correct_answers = db.Column(db.Integer)
    time_taken = db.Column(db.Integer)  # in seconds
    responses = db.Column(db.JSON)  # Store user responses
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'assessment_type': self.assessment_type,
            'score': self.score,
            'total_questions': self.total_questions,
            'correct_answers': self.correct_answers,
            'time_taken': self.time_taken,
            'percentage': round((self.correct_answers / self.total_questions) * 100, 2) if self.total_questions else 0,
            'created_at': self.created_at.isoformat()
        }