# backend/app/services/model_monitor.py

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any
import json
import logging
from app.extensions import redis_client

logger = logging.getLogger(__name__)

class ModelMonitor:
    """Model performance monitoring and drift detection"""
    
    def __init__(self):
        self.metrics = {
            'predictions': [],
            'feature_distributions': [],
            'performance_metrics': []
        }
        self.drift_threshold = 0.15  # 15% drift threshold
    
    def log_prediction(self, features: Dict, prediction: Dict, actual: Any = None):
        """Log a prediction for monitoring"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'features': features,
            'prediction': prediction,
            'actual': actual
        }
        
        # Store in Redis if available
        if redis_client:
            key = f"model_predictions:{datetime.now().strftime('%Y%m%d')}"
            redis_client.lpush(key, json.dumps(log_entry))
            redis_client.ltrim(key, 0, 9999)
        
        self.metrics['predictions'].append(log_entry)
    
    def compute_feature_drift(self, baseline_features: pd.DataFrame, 
                             current_features: pd.DataFrame) -> Dict[str, float]:
        """Compute feature drift using Kolmogorov-Smirnov test"""
        from scipy import stats
        
        drift_results = {}
        
        for col in baseline_features.columns:
            if col in current_features.columns:
                # KS test for drift
                ks_stat, p_value = stats.ks_2samp(
                    baseline_features[col].dropna(),
                    current_features[col].dropna()
                )
                
                drift_results[col] = {
                    'ks_statistic': ks_stat,
                    'p_value': p_value,
                    'drift_detected': ks_stat > self.drift_threshold
                }
        
        return drift_results
    
    def detect_model_drift(self, recent_predictions: List[Dict], 
                          training_data: pd.DataFrame) -> Dict[str, Any]:
        """Detect model drift"""
        # Convert recent predictions to DataFrame
        recent_df = pd.DataFrame([p['features'] for p in recent_predictions])
        
        # Compute drift
        drift_results = self.compute_feature_drift(training_data, recent_df)
        
        # Calculate overall drift score
        drift_score = np.mean([r['ks_statistic'] for r in drift_results.values()])
        
        return {
            'drift_score': drift_score,
            'drift_detected': drift_score > self.drift_threshold,
            'feature_drift': drift_results,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_performance_summary(self, days: int = 7) -> Dict[str, Any]:
        """Get performance summary"""
        cutoff = datetime.now() - timedelta(days=days)
        
        # Get predictions from Redis
        predictions = []
        if redis_client:
            for i in range(days):
                date = (datetime.now() - timedelta(days=i)).strftime('%Y%m%d')
                key = f"model_predictions:{date}"
                items = redis_client.lrange(key, 0, -1)
                for item in items:
                    predictions.append(json.loads(item))
        
        if not predictions:
            return {'error': 'No prediction data available'}
        
        # Calculate metrics
        total = len(predictions)
        successful = sum(1 for p in predictions if p.get('prediction') is not None)
        
        return {
            'total_predictions': total,
            'successful_predictions': successful,
            'success_rate': (successful / total) * 100 if total > 0 else 0,
            'unique_users': len(set(p.get('features', {}).get('user_id') for p in predictions)),
            'period': f'last_{days}_days'
        }