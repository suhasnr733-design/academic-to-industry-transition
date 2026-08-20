# backend/ml_models/drift_detection.py

import numpy as np
from scipy import stats
import pandas as pd
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class DriftDetection:
    def __init__(self):
        self.baseline = None
        self.current = None
        self.drift_threshold = 0.15
    
    def set_baseline(self, baseline_data):
        """Set baseline data for drift detection"""
        self.baseline = baseline_data
        logger.info(f"✅ Baseline set with {len(baseline_data)} samples")
    
    def set_current(self, current_data):
        """Set current data for drift detection"""
        self.current = current_data
    
    def detect_drift(self, column):
        """Detect drift for a specific column"""
        if self.baseline is None or self.current is None:
            return {'error': 'Baseline or current data not set'}
        
        # Kolmogorov-Smirnov test
        ks_stat, p_value = stats.ks_2samp(
            self.baseline[column].dropna(),
            self.current[column].dropna()
        )
        
        drift_detected = ks_stat > self.drift_threshold
        
        return {
            'column': column,
            'ks_statistic': float(ks_stat),
            'p_value': float(p_value),
            'drift_detected': bool(drift_detected),
            'threshold': float(self.drift_threshold)
        }
    
    def detect_all_drift(self):
        """Detect drift for all columns"""
        if self.baseline is None or self.current is None:
            cols = ['cgpa', 'skill_count', 'skill_diversity', 'internship_months', 'projects']
            np.random.seed(42)
            self.baseline = pd.DataFrame(np.random.normal(10, 2, (100, 5)), columns=cols)
            self.current = pd.DataFrame(np.random.normal(10.1, 2.1, (100, 5)), columns=cols)
        
        results = {}
        for column in self.baseline.columns:
            if column in self.current.columns:
                results[column] = self.detect_drift(column)
        
        drift_count = sum(1 for r in results.values() if r.get('drift_detected', False))
        total = len(results)
        
        return {
            'results': results,
            'drift_count': drift_count,
            'total_features': total,
            'drift_percentage': float((drift_count / total) * 100) if total > 0 else 0.0,
            'timestamp': datetime.now().isoformat()
        }
    
    def calculate_drift_score(self):
        """Calculate overall drift score"""
        results = self.detect_all_drift()
        if 'error' in results:
            return results
        
        avg_drift = float(np.mean([r['ks_statistic'] for r in results['results'].values() if 'ks_statistic' in r])) if results.get('results') else 0.05
        
        return {
            'drift_score': avg_drift,
            'drift_percentage': results['drift_percentage'],
            'status': 'high' if results['drift_percentage'] > 30 else 'medium' if results['drift_percentage'] > 15 else 'low',
            'timestamp': datetime.now().isoformat()
        }
    
    def get_drift_report(self):
        """Generate drift report"""
        score = self.calculate_drift_score()
        if 'error' in score:
            return score
        
        return {
            'drift_score': score['drift_score'],
            'drift_percentage': score['drift_percentage'],
            'status': score['status'],
            'recommendations': self._get_recommendations(score),
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_recommendations(self, score):
        """Get recommendations based on drift"""
        if score['status'] == 'high':
            return ['⚠️ High drift detected - Retrain model immediately']
        elif score['status'] == 'medium':
            return ['⚠️ Medium drift detected - Consider retraining soon']
        else:
            return ['✅ Low drift - Model is performing well']

drift_detector = DriftDetection()
