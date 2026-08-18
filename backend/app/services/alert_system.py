# backend/app/services/alert_system.py

import smtplib
from email.mime.text import MIMEText
import requests
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AlertSystem:
    def __init__(self):
        self.alerts = []
        self.thresholds = {
            'error_rate': 10,  # 10%
            'response_time': 500,  # 500ms
            'concurrent_users': 100  # 100 users
        }
    
    def check_alerts(self, metrics):
        alerts = []
        
        if metrics.get('error_rate', 0) > self.thresholds['error_rate']:
            alerts.append(f"High error rate: {metrics['error_rate']:.1f}%")
        
        if metrics.get('avg_latency', 0) > self.thresholds['response_time']:
            alerts.append(f"High response time: {metrics['avg_latency']:.2f}ms")
        
        for alert in alerts:
            self.trigger_alert(alert)
        
        return alerts
    
    def trigger_alert(self, message, severity='warning'):
        alert = {
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'severity': severity
        }
        self.alerts.append(alert)
        logger.warning(f"🚨 ALERT: {message}")
    
    def send_email_alert(self, message):
        # Send email alert
        pass
    
    def send_slack_alert(self, message):
        # Send Slack alert
        pass
    
    def get_alerts(self, hours=24):
        cutoff = datetime.now() - timedelta(hours=hours)
        return [a for a in self.alerts 
                if datetime.fromisoformat(a['timestamp']) > cutoff]
    
    def clear_alerts(self):
        self.alerts = []
        logger.info("Alerts cleared")

alert_system = AlertSystem()