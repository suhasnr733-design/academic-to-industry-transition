# backend/ml_models/production_optimizer.py

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import os
import logging

logger = logging.getLogger(__name__)

class ProductionOptimizer:
    def __init__(self):
        self.models_dir = 'data/models/production/'
        os.makedirs(self.models_dir, exist_ok=True)
    
    def optimize_for_production(self, model_path):
        """Optimize model for production"""
        model = joblib.load(model_path)
        
        # Reduce model size if RandomForest
        if isinstance(model, RandomForestClassifier):
            optimized = self._optimize_random_forest(model)
        else:
            optimized = model
        
        # Save optimized model
        optimized_path = f"{self.models_dir}/model_production.pkl"
        joblib.dump(optimized, optimized_path, compress=5)
        
        # Get size info
        original_size = os.path.getsize(model_path) / (1024 * 1024)
        optimized_size = os.path.getsize(optimized_path) / (1024 * 1024)
        
        return {
            'path': optimized_path,
            'original_size_mb': original_size,
            'optimized_size_mb': optimized_size,
            'reduction': (1 - optimized_size/original_size) * 100 if original_size > 0 else 0
        }
    
    def _optimize_random_forest(self, model):
        """Optimize Random Forest model"""
        # Reduce estimators
        n_estimators = min(100, len(model.estimators_))
        optimized = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=model.max_depth,
            min_samples_split=model.min_samples_split,
            random_state=model.random_state
        )
        
        # Transfer feature importances
        if hasattr(model, 'feature_importances_'):
            optimized.feature_importances_ = model.feature_importances_
        
        return optimized

production_optimizer = ProductionOptimizer()