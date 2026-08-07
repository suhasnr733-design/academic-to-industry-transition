# data_pipeline/analytics/realtime_analytics.py

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List
import json
import logging
from collections import Counter

logger = logging.getLogger(__name__)

class RealTimeAnalytics:
    """Real-time analytics engine"""
    
    def __init__(self):
        self.metrics = {}
        self.historical_data = []
        self.cache = {}
        self.last_update = None
    
    def update_metrics(self, events: List[Dict[str, Any]]):
        """Update metrics from events"""
        if not events:
            return
        
        df = pd.DataFrame(events)
        
        # Compute metrics
        metrics = {
            'total_events': len(events),
            'unique_users': df['user_id'].nunique() if 'user_id' in df else 0,
            'event_types': df['event_type'].value_counts().to_dict() if 'event_type' in df else {},
            'average_value': df['value'].mean() if 'value' in df else 0,
            'max_value': df['value'].max() if 'value' in df else 0,
            'min_value': df['value'].min() if 'value' in df else 0,
            'timestamp': datetime.now().isoformat()
        }
        
        self.metrics = metrics
        self.last_update = datetime.now()
    
    def get_realtime_dashboard(self) -> Dict[str, Any]:
        """Get real-time dashboard data"""
        return {
            'metrics': self.metrics,
            'last_update': self.last_update.isoformat() if self.last_update else None,
            'window_size': '60 seconds',
            'status': 'active' if self.last_update and (datetime.now() - self.last_update).seconds < 120 else 'inactive'
        }
    
    def compute_trends(self, data: List[Dict], period: str = 'hourly') -> Dict[str, Any]:
        """Compute trends over time"""
        if not data:
            return {'error': 'No data available'}
        
        df = pd.DataFrame(data)
        if 'timestamp' not in df:
            return {'error': 'No timestamp column'}
        
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df.set_index('timestamp', inplace=True)
        
        # Resample based on period
        if period == 'hourly':
            resampled = df.resample('H').size()
        elif period == 'daily':
            resampled = df.resample('D').size()
        else:
            resampled = df.resample('10min').size()
        
        return {
            'period': period,
            'timestamps': resampled.index.strftime('%Y-%m-%d %H:%M:%S').tolist(),
            'values': resampled.values.tolist(),
            'total': int(resampled.sum())
        }
    
    def detect_anomalies(self, data: List[Dict], threshold: float = 2.0) -> List[Dict]:
        """Detect anomalies in data"""
        if not data:
            return []
        
        df = pd.DataFrame(data)
        if 'value' not in df:
            return []
        
        # Calculate z-scores
        mean = df['value'].mean()
        std = df['value'].std()
        
        anomalies = []
        for _, row in df.iterrows():
            z_score = (row['value'] - mean) / std if std > 0 else 0
            if abs(z_score) > threshold:
                anomalies.append({
                    'timestamp': row.get('timestamp'),
                    'value': row['value'],
                    'z_score': z_score,
                    'severity': 'high' if abs(z_score) > 3 else 'medium'
                })
        
        return anomalies
    
    def get_forecast(self, data: List[Dict], periods: int = 10) -> Dict[str, Any]:
        """Simple forecasting using moving average"""
        if not data:
            return {'error': 'No data available'}
        
        df = pd.DataFrame(data)
        if 'value' not in df:
            return {'error': 'No value column'}
        
        # Simple moving average forecast
        window = min(5, len(df))
        ma = df['value'].rolling(window=window).mean()
        
        last_ma = ma.iloc[-1] if not ma.empty else df['value'].mean()
        
        # Forecast future values
        forecast = []
        current = last_ma
        for i in range(periods):
            # Add some randomness
            current = current * (1 + np.random.normal(0, 0.02))
            forecast.append({
                'period': i + 1,
                'forecast': current,
                'upper_bound': current * 1.1,
                'lower_bound': current * 0.9
            })
        
        return {
            'method': 'moving_average',
            'window': window,
            'forecast': forecast
        }