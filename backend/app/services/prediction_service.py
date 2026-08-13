# backend/app/services/prediction_service.py

import os
import requests
import joblib
import numpy as np
import logging

logger = logging.getLogger(__name__)

class PredictionService:
    """Prediction service supporting both microservice call and direct local ensemble model inference"""
    
    def __init__(self):
        self.ml_service_url = os.environ.get('ML_SERVICE_URL', 'http://localhost:8000')
        self.model = None
        self.scaler = None
        self.features = None
        self._load_local_model()
    
    def _load_local_model(self):
        try:
            import sys
            # Handle scikit-learn cross-version module path alias for _loss
            try:
                import sklearn.ensemble._gb_losses as _gb_losses
                sys.modules['_loss'] = _gb_losses
                sys.modules['sklearn.ensemble._loss'] = _gb_losses
            except Exception:
                pass

            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            model_path = os.path.join(base_dir, 'data/models/ensemble_model.pkl')
            scaler_path = os.path.join(base_dir, 'data/models/scaler.pkl')
            features_path = os.path.join(base_dir, 'data/models/feature_columns.pkl')
            
            if os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(features_path):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                self.features = joblib.load(features_path)
                logger.info("Local ML ensemble model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load local ML model: {e}")
    
    def predict_employability(self, student_data):
        """Predict employability score using ML microservice or local model fallback"""
        try:
            response = requests.post(
                f'{self.ml_service_url}/predict',
                json=student_data,
                timeout=2
            )
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
        
        # Fallback to local model inference if microservice is offline
        if self.model and self.scaler and self.features:
            try:
                import pandas as pd
                X_df = pd.DataFrame([[student_data.get(f, 0) for f in self.features]], columns=self.features)
                X_scaled = self.scaler.transform(X_df)
                pred = self.model.predict(X_scaled)[0]
                proba = self.model.predict_proba(X_scaled)[0]
                confidence = float(max(proba) * 100)
                
                return {
                    'employable': bool(pred),
                    'confidence': round(confidence, 2),
                    'probabilities': {
                        'not_employable': round(float(proba[0]), 4),
                        'employable': round(float(proba[1]), 4)
                    }
                }
            except Exception as e:
                logger.error(f"Local inference failed: {e}")
        
        # Heuristic fallback if model unavailable
        cgpa = student_data.get('cgpa', 7.0)
        skills = student_data.get('skill_count', 3)
        confidence = min(40.0 + cgpa * 4.0 + skills * 3.0, 95.0)
        return {
            'employable': confidence >= 60.0,
            'confidence': round(confidence, 2),
            'probabilities': {
                'not_employable': round((100.0 - confidence) / 100.0, 4),
                'employable': round(confidence / 100.0, 4)
            }
        }