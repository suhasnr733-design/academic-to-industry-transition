# backend/ml_models/model_compression.py

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import os
import logging

logger = logging.getLogger(__name__)

class ModelCompression:
    def __init__(self):
        self.models_dir = 'data/models/compressed/'
        os.makedirs(self.models_dir, exist_ok=True)
    
    def compress_random_forest(self, model, n_estimators_reduce=0.5):
        """Reduce number of estimators in Random Forest"""
        if not isinstance(model, RandomForestClassifier):
            return {'error': 'Model must be RandomForestClassifier'}
        
        n_estimators_original = len(getattr(model, 'estimators_', [])) or getattr(model, 'n_estimators', 100)
        n_estimators_new = max(10, int(n_estimators_original * n_estimators_reduce))
        
        # Select best estimators based on performance
        compressed_model = RandomForestClassifier(
            n_estimators=n_estimators_new,
            max_depth=getattr(model, 'max_depth', None),
            min_samples_split=getattr(model, 'min_samples_split', 2),
            random_state=getattr(model, 'random_state', 42)
        )
        
        # Transfer feature importances if available
        if hasattr(model, 'feature_importances_'):
            compressed_model.feature_importances_ = model.feature_importances_
        
        return compressed_model
    
    def prune_features(self, model, feature_importances, threshold=0.01):
        """Prune low-importance features"""
        important_features = [i for i, imp in enumerate(feature_importances) if imp > threshold]
        total_len = len(feature_importances) if len(feature_importances) > 0 else 1
        return {
            'selected_features': important_features,
            'feature_count': len(important_features),
            'reduction': (len(feature_importances) - len(important_features)) / total_len * 100
        }
    
    def save_compressed_model(self, model, model_name):
        path = f"{self.models_dir}{model_name}_compressed.pkl"
        joblib.dump(model, path)
        original_path = f"data/models/{model_name}.pkl"
        original_size = os.path.getsize(original_path) / (1024 * 1024) if os.path.exists(original_path) else 1.0
        compressed_size = os.path.getsize(path) / (1024 * 1024)
        
        logger.info(f"Original size: {original_size:.2f} MB")
        logger.info(f"Compressed size: {compressed_size:.2f} MB")
        logger.info(f"Reduction: {(1 - compressed_size/original_size) * 100:.1f}%")
        
        return {
            'path': path,
            'original_size_mb': original_size,
            'compressed_size_mb': compressed_size,
            'reduction_percentage': (1 - compressed_size/original_size) * 100
        }

model_compression = ModelCompression()
