# backend/app/services/auto_retrain.py

import schedule
import time
import logging
from datetime import datetime
from app.services.model_retraining import ModelRetraining
from app.services.model_monitor import ModelPerformanceMonitor

logger = logging.getLogger(__name__)

class AutoRetrain:
    def __init__(self):
        self.retrainer = ModelRetraining()
        self.monitor = ModelPerformanceMonitor()
        self.is_running = False
    
    def start(self):
        self.is_running = True
        schedule.every().day.at("02:00").do(self.retrain_if_needed)
        schedule.every().hour.do(self.check_performance)
        logger.info("✅ Auto-retrain scheduler started")
    
    def retrain_if_needed(self):
        logger.info("🔄 Checking if retraining needed...")
        metrics = self.monitor.get_metrics(24)
        
        if metrics.get('error_rate', 0) > 0.05:
            logger.info("⚠️ High error rate detected. Starting retraining...")
            result = self.retrainer.retrain()
            logger.info(f"Retraining result: {result}")
    
    def check_performance(self):
        metrics = self.monitor.get_metrics(1)
        logger.info(f"📊 Performance: {metrics}")
    
    def stop(self):
        self.is_running = False
        logger.info("Auto-retrain scheduler stopped")
