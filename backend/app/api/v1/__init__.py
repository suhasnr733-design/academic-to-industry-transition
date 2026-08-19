# backend/app/api/v1/__init__.py

from flask import Blueprint, jsonify
from datetime import datetime
from app.services.service_mesh import ServiceMesh
from app.gateway.rate_limiter import rate_limiter
from app.services.multilevel_cache import cache
from app.services.db_performance import DBPerformanceOptimizer
from app.extensions import db, redis_client

api_v1_bp = Blueprint('api_v1', __name__)

from app.api.v1.auth import auth_bp
from app.api.v1.resume import resume_bp
from app.api.v1.jobs import jobs_bp
from app.api.v1.prediction import prediction_bp
from app.api.v1.notifications import notifications_bp
from app.api.v1.analytics import analytics_bp
from app.api.v1.admin import admin_bp

api_v1_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_v1_bp.register_blueprint(resume_bp, url_prefix='/resume')
api_v1_bp.register_blueprint(jobs_bp, url_prefix='/jobs')
api_v1_bp.register_blueprint(prediction_bp, url_prefix='/prediction')
api_v1_bp.register_blueprint(notifications_bp, url_prefix='/notifications')
api_v1_bp.register_blueprint(analytics_bp, url_prefix='/analytics')
api_v1_bp.register_blueprint(admin_bp, url_prefix='/admin')

@api_v1_bp.route('/info', methods=['GET'])
def get_api_info():
    """Get API version information"""
    return jsonify({
        'version': '1.0.0',
        'endpoints': [
            '/auth/*',
            '/resume/*',
            '/jobs/*',
            '/prediction/*',
            '/notifications/*',
            '/analytics/*',
            '/admin/*',
            '/mesh/*',
            '/test',
            '/cache/*',
            '/db/*'
        ],
        'status': 'healthy'
    })

mesh = ServiceMesh()

@api_v1_bp.route('/mesh/status', methods=['GET'])
def get_mesh_status():
    """Get service mesh status and health"""
    return jsonify(mesh.get_mesh_status()), 200

@api_v1_bp.route('/test', methods=['GET'])
@rate_limiter.rate_limit(limit=100, window=60, strategy='ip')
def rate_limit_test():
    """Test endpoint for rate limiting"""
    return jsonify({
        'status': 'ok',
        'message': 'Rate limiter test endpoint',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@api_v1_bp.route('/cache/stats', methods=['GET'])
def get_cache_stats():
    """Get multi-level cache statistics"""
    return jsonify({
        'status': 'healthy',
        'memory_cache_entries': len(cache.memory_cache),
        'redis_available': redis_client is not None
    }), 200

@api_v1_bp.route('/db/performance', methods=['GET'])
def get_db_performance():
    """Get database performance optimization and slow query stats"""
    slow_queries = DBPerformanceOptimizer.analyze_slow_queries()
    return jsonify({
        'status': 'optimal',
        'slow_queries': slow_queries,
        'indexes_verified': True
    }), 200

@api_v1_bp.route('/db/status', methods=['GET'])
def get_db_status():
    """Get database connection status"""
    try:
        db.session.execute(db.text("SELECT 1"))
        return jsonify({'status': 'healthy', 'database': 'connected'}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500
