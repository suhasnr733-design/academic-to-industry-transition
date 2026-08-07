# backend/app/services/prediction_service.py (Updated)

import requests
import json
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class PredictionService:
    """Prediction service that calls ML microservice"""
    
    def __init__(self):
        self.ml_service_url = 'http://ml-service:8000'
    
    def predict_employability(self, student_data):
        """Call ML service for prediction"""
        try:
            response = requests.post(
                f'{self.ml_service_url}/predict',
                json=student_data,
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"ML service error: {response.text}")
                return {'error': 'ML service unavailable'}
        except requests.exceptions.RequestException as e:
            logger.error(f"ML service connection error: {e}")
            return {'error': 'ML service unreachable'}
    
    def predict_batch(self, students_data):
        """Batch prediction"""
        try:
            response = requests.post(
                f'{self.ml_service_url}/predict/batch',
                json=students_data,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {'error': 'ML service error'}
        except Exception as e:
            return {'error': str(e)}