# data_pipeline/mlflow/monitoring.py

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List
import mlflow
import json
import logging
from data_pipeline.monitoring.alert_system import AlertSystem

logger = logging.getLogger(__name__)

class ModelMonitoring:
    """ML model monitoring and alerting"""
    
    def __init__(self):
        self.alert_system = AlertSystem()
        self.monitoring_window = 7  # days
    
    def check_model_performance(self, model_name: str) -> Dict[str, Any]:
        """Check model performance metrics"""
        try:
            # Get recent predictions
            predictions = self.get_recent_predictions(model_name, self.monitoring_window)
            
            if not predictions:
                return {'error': 'No predictions available'}
            
            # Calculate metrics
            metrics = {
                'total_predictions': len(predictions),
                'avg_confidence': np.mean([p.get('confidence', 0) for p in predictions]),
                'success_rate': sum(1 for p in predictions if p.get('success', False)) / len(predictions),
                'avg_latency': np.mean([p.get('latency', 0) for p in predictions]),
                'timestamp': datetime.now().isoformat()
            }
            
            # Check for alerts
            self._check_alerts(metrics)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error checking model performance: {e}")
            return {'error': str(e)}
    
    def get_recent_predictions(self, model_name: str, days: int) -> List[Dict]:
        """Get recent predictions"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # In production, this would come from a database
        # For now, return sample data
        return [
            {
                'timestamp': (datetime.now() - timedelta(hours=i)).isoformat(),
                'confidence': np.random.random(),
                'success': np.random.random() > 0.1,
                'latency': np.random.randint(50, 200)
            }
            for i in range(100)
        ]
    
    def _check_alerts(self, metrics: Dict):
        """Check for alerts"""
        alerts = []
        
        if metrics.get('success_rate', 1) < 0.8:
            alerts.append(f"Low success rate: {metrics['success_rate']:.2%}")
        
        if metrics.get('avg_latency', 0) > 500:
            alerts.append(f"High latency: {metrics['avg_latency']:.2f}ms")
        
        if metrics.get('total_predictions', 0) < 10:
            alerts.append(f"Low prediction volume: {metrics['total_predictions']}")
        
        for alert in alerts:
            self.alert_system.trigger_alert(
                'model_performance',
                alert,
                'warning' if 'latency' in alert else 'info'
            )
    
    def log_model_metrics(self, model_name: str, metrics: Dict):
        """Log model metrics to MLflow"""
        with mlflow.start_run(run_name=f"{model_name}_monitoring") as run:
            for key, value in metrics.items():
                if isinstance(value, (int, float)):
                    mlflow.log_metric(f"monitoring_{key}", value)
                elif isinstance(value, dict):
                    mlflow.log_params({f"monitoring_{k}": v for k, v in value.items()})
    
    def generate_monitoring_report(self, model_name: str) -> str:
        """Generate HTML monitoring report"""
        metrics = self.check_model_performance(model_name)
        
        html = f"""
        <html>
        <head>
            <title>Model Performance Report - {model_name}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .metric {{ display: inline-block; margin: 20px; padding: 20px; 
                          background: #f5f5f5; border-radius: 10px; }}
                .value {{ font-size: 24px; font-weight: bold; }}
                .status-good {{ color: #10b981; }}
                .status-warning {{ color: #f59e0b; }}
                .status-danger {{ color: #ef4444; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>Model Performance Report</h1>
            <p>Model: <strong>{model_name}</strong></p>
            <p>Generated: {datetime.now().isoformat()}</p>
            
            <div>
                <div class="metric">
                    <div>Total Predictions</div>
                    <div class="value">{metrics.get('total_predictions', 0)}</div>
                </div>
                <div class="metric">
                    <div>Success Rate</div>
                    <div class="value status-{'good' if metrics.get('success_rate', 0) > 0.8 else 'warning'}">
                        {metrics.get('success_rate', 0):.1%}
                    </div>
                </div>
                <div class="metric">
                    <div>Avg Confidence</div>
                    <div class="value">{metrics.get('avg_confidence', 0):.1%}</div>
                </div>
                <div class="metric">
                    <div>Avg Latency</div>
                    <div class="value">{metrics.get('avg_latency', 0):.1f}ms</div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html