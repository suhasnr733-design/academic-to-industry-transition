# backend/app/services/model_validation.py

import numpy as np
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
import joblib
import logging

logger = logging.getLogger(__name__)

class ModelValidation:
    def validate_model(self, model_path, test_data):
        """Validate model performance"""
        model = joblib.load(model_path)
        
        X_test = test_data['features']
        y_test = test_data['labels']
        
        y_pred = model.predict(X_test)
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred)
        }
        
        logger.info(f"Model validation: {metrics}")
        return metrics
    
    def compare_models(self, new_model_path, current_model_path, test_data):
        """Compare new model with current model"""
        new_metrics = self.validate_model(new_model_path, test_data)
        current_metrics = self.validate_model(current_model_path, test_data)
        
        comparison = {
            'new_model': new_metrics,
            'current_model': current_metrics,
            'improvement': {
                key: new_metrics[key] - current_metrics[key]
                for key in new_metrics
            }
        }
        
        return comparison
