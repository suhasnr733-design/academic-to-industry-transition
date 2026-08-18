# backend/app/api/v1/health/routes.py

from flask import jsonify
from datetime import datetime
from app.api.v1.health import health_bp
from app.extensions import db
from app.services.model_monitor import ModelPerformanceMonitor

@health_bp.route('', methods=['GET'])
def health_check():
    """Complete system health check"""
    health = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'components': {}
    }
    
    # Check database
    try:
        db.session.execute('SELECT 1')
        health['components']['database'] = 'ok'
    except:
        health['components']['database'] = 'error'
        health['status'] = 'degraded'
    
    # Check model
    monitor = ModelPerformanceMonitor()
    metrics = monitor.get_metrics(1)
    if metrics.get('error_rate', 0) < 0.1:
        health['components']['model'] = 'ok'
    else:
        health['components']['model'] = 'degraded'
        health['status'] = 'degraded'
    
    return jsonify(health), 200

@health_bp.route('/ready', methods=['GET'])
def readiness_check():
    """Readiness check for k8s"""
    return jsonify({'status': 'ready'}), 200

@health_bp.route('/live', methods=['GET'])
def liveness_check():
    """Liveness check for k8s"""
    return jsonify({'status': 'alive'}), 200
