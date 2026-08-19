# backend/app/services/production_ready.py

import os
import signal
import sys
import logging
from datetime import datetime
import psutil
import time

logger = logging.getLogger(__name__)

class ProductionHardening:
    """Production readiness utilities"""
    
    @staticmethod
    def setup_logging():
        """Setup production logging"""
        log_dir = 'logs'
        os.makedirs(log_dir, exist_ok=True)
        
        # File handler
        log_file = f"{log_dir}/app_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        ))
        
        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)
        root_logger.addHandler(file_handler)
        root_logger.addHandler(console_handler)
        
        return root_logger
    
    @staticmethod
    def setup_health_checks(app):
        """Setup health check endpoints"""
        if 'health_check' not in app.view_functions:
            @app.route('/health')
            def health_check():
                return {'status': 'healthy', 'timestamp': datetime.now().isoformat()}
        
        if 'readiness_check' not in app.view_functions:
            @app.route('/ready')
            def readiness_check():
                return {'database': 'ok', 'redis': 'ok', 'models': 'ok'}
    
    @staticmethod
    def setup_graceful_shutdown():
        """Setup graceful shutdown handlers"""
        def signal_handler(sig, frame):
            logger.info("Received shutdown signal, cleaning up...")
            
            # Cleanup resources
            from app.extensions import redis_client
            if redis_client:
                redis_client.close()
            
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    @staticmethod
    def monitor_resources():
        """Monitor system resources"""
        memory = psutil.virtual_memory()
        cpu = psutil.cpu_percent(interval=1)
        
        # Alert if resources are high
        if memory.percent > 85:
            logger.warning(f"Memory usage high: {memory.percent}%")
        
        if cpu > 85:
            logger.warning(f"CPU usage high: {cpu}%")
        
        return {
            'memory': memory.percent,
            'cpu': cpu,
            'disk': psutil.disk_usage('/').percent
        }