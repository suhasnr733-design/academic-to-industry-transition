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
        # ✅ COMBINED thresholds from both branches
        self.thresholds = {
            'error_rate': 0.1,  # 10% (from main - better)
            'response_time': 5.0,  # 5 seconds (from main)
            'cpu_usage': 80,  # 80% (from main)
            'memory_usage': 80,  # 80% (from main)
            'concurrent_users': 100  # 100 users (from feature branch)
        }
    
    def check_alerts(self, metrics):
        """Check metrics against thresholds"""
        alerts = []
        
        # ✅ Combined checks from both branches
        if metrics.get('error_rate', 0) > self.thresholds['error_rate']:
            alerts.append(f"High error rate: {metrics['error_rate']:.2%}")
        
        if metrics.get('avg_latency', 0) > self.thresholds['response_time']:
            alerts.append(f"High response time: {metrics['avg_latency']:.2f}ms")
        
        if metrics.get('cpu_percent', 0) > self.thresholds['cpu_usage']:
            alerts.append(f"High CPU usage: {metrics['cpu_percent']}%")
        
        if metrics.get('memory_mb', 0) > self.thresholds['memory_usage']:
            alerts.append(f"High memory usage: {metrics['memory_mb']}MB")
        
        if metrics.get('concurrent_users', 0) > self.thresholds['concurrent_users']:
            alerts.append(f"High concurrent users: {metrics['concurrent_users']}")
        
        for alert in alerts:
            self.trigger_alert(alert)
        
        return alerts
    
    def trigger_alert(self, message, severity='warning'):
        """Trigger an alert"""
        alert = {
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'severity': severity
        }
        self.alerts.append(alert)
        logger.warning(f"🚨 ALERT: {message}")
        
        # ✅ Send email (from main)
        self.send_email_alert(message)
    
    def send_email_alert(self, message):
        """Send email alert"""
        try:
            # Email configuration
            smtp_server = "smtp.gmail.com"
            smtp_port = 587
            sender_email = "your-email@gmail.com"
            sender_password = "your-password"
            
            msg = MIMEText(f"Alert: {message}\nTime: {datetime.now()}")
            msg['Subject'] = f"🚨 Alert: {message[:50]}..."
            msg['From'] = sender_email
            msg['To'] = "admin@your-project.com"
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)
            
            logger.info(f"📧 Email alert sent: {message}")
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
    
    def send_slack_alert(self, message):
        """Send Slack alert"""
        try:
            webhook_url = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
            payload = {"text": f"🚨 Alert: {message}"}
            
            response = requests.post(webhook_url, json=payload)
            if response.status_code == 200:
                logger.info(f"💬 Slack alert sent: {message}")
            else:
                logger.error(f"Slack alert failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")
    
    def get_alerts(self, hours=24):
        """Get recent alerts"""
        cutoff = datetime.now() - timedelta(hours=hours)
        return [a for a in self.alerts 
                if datetime.fromisoformat(a['timestamp']) > cutoff]
    
    def clear_alerts(self):
        """Clear all alerts"""
        self.alerts = []
        logger.info("Alerts cleared")
    
    def get_alert_summary(self):
        """Get alert summary statistics"""
        total = len(self.alerts)
        if total == 0:
            return {"total": 0, "by_severity": {}}
        
        severity_counts = {}
        for alert in self.alerts:
            severity = alert.get('severity', 'warning')
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        return {
            "total": total,
            "by_severity": severity_counts,
            "latest": self.alerts[-1] if self.alerts else None
        }

# ✅ Create global instance
alert_system = AlertSystem()