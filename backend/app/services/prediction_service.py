# backend/app/services/prediction_service.py

import joblib
import numpy as np
import pandas as pd
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class PredictionService:
    """Employability prediction service"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.features = None
        self.load_model()
    
    def load_model(self):
        """Load trained model and artifacts"""
        try:
            self.model = joblib.load('data/models/ensemble_model.pkl')
            self.scaler = joblib.load('data/models/scaler.pkl')
            self.features = joblib.load('data/models/feature_columns.pkl')
            logger.info("✅ Model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Error loading model: {e}")
    
    def predict_employability(self, student_data):
        """Predict employability for a student"""
        try:
            # Prepare features
            features = {f: student_data.get(f, 0) for f in self.features}
            X = np.array([features[f] for f in self.features]).reshape(1, -1)
            X_scaled = self.scaler.transform(X)
            
            # Predict
            prediction = self.model.predict(X_scaled)[0]
            probability = self.model.predict_proba(X_scaled)[0]
            
            return {
                'employable': bool(prediction),
                'confidence': round(max(probability) * 100, 2),
                'probability': {
                    'not_employable': round(probability[0] * 100, 2),
                    'employable': round(probability[1] * 100, 2)
                }
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {'error': str(e)}