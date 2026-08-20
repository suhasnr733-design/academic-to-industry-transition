# backend/app/api/v1/health/advanced.py

from flask import jsonify
from app.extensions import db, redis_client
from datetime import datetime
import psutil

def get_health_status():
    """Get comprehensive health status"""
    health = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {},
        'system': {}
    }
    
    # Database health
    try:
        db.session.execute('SELECT 1')
        health['services']['database'] = {'status': 'healthy'}
    except Exception as e:
        health['services']['database'] = {'status': 'unhealthy', 'error': str(e)}
        health['status'] = 'degraded'
    
    # Redis health
    try:
        if redis_client:
            redis_client.ping()
            health['services']['redis'] = {'status': 'healthy'}
        else:
            health['services']['redis'] = {'status': 'not_configured'}
    except Exception as e:
        health['services']['redis'] = {'status': 'unhealthy', 'error': str(e)}
        health['status'] = 'degraded'
    
    # System resources
    health['system'] = {
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_percent': psutil.disk_usage('/').percent
    }
    
    return health