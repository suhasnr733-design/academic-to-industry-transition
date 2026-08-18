# backend/app/services/alert_system.py

import smtplib
from email.mime.text import MIMEText
import requests
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AlertSystem:
    def __init__(self):
        self.alerts = []
        self.thresholds = {
            'error_rate': 0.1,  # 10% error rate
            'response_time': 5.0,  # 5 seconds
            'cpu_usage': 80,  # 80%
            'memory_usage': 80  # 80%
        }
    
    def check_alerts(self, metrics):
        alerts = []
        
        if metrics.get('error_rate', 0) > self.thresholds['error_rate']:
            alerts.append(f"High error rate: {metrics['error_rate']:.2%}")
        
        if metrics.get('cpu_percent', 0) > self.thresholds['cpu_usage']:
            alerts.append(f"High CPU usage: {metrics['cpu_percent']}%")
        
        if metrics.get('memory_mb', 0) > self.thresholds['memory_usage']:
            alerts.append(f"High memory usage: {metrics['memory_mb']}MB")
        
        for alert in alerts:
            self.trigger_alert(alert)
        
        return alerts
    
    def trigger_alert(self, message):
        alert = {
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'severity': 'warning'
        }
        self.alerts.append(alert)
        logger.warning(f"🚨 ALERT: {message}")
        self.send_email_alert(message)
    
    def send_email_alert(self, message):
        # Send email alert
        pass

alert_system = AlertSystem()
