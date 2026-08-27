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
from app.api.v1.pipeline import pipeline_bp
from app.api.v1.models import models_bp
from app.api.v1.assessment import assessment_bp
from app.api.v1.mentorship import mentorship_bp
from app.api.v1.placement import placement_bp
from app.api.v1.learning import learning_bp

api_v1_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_v1_bp.register_blueprint(resume_bp, url_prefix='/resume')
api_v1_bp.register_blueprint(jobs_bp, url_prefix='/jobs')
api_v1_bp.register_blueprint(prediction_bp, url_prefix='/prediction')
api_v1_bp.register_blueprint(notifications_bp, url_prefix='/notifications')
api_v1_bp.register_blueprint(analytics_bp, url_prefix='/analytics')
api_v1_bp.register_blueprint(pipeline_bp, url_prefix='/pipeline')
api_v1_bp.register_blueprint(models_bp, url_prefix='/models')
api_v1_bp.register_blueprint(assessment_bp, url_prefix='/assessment')
api_v1_bp.register_blueprint(mentorship_bp, url_prefix='/mentorship')
api_v1_bp.register_blueprint(placement_bp, url_prefix='/placement')
api_v1_bp.register_blueprint(learning_bp, url_prefix='/learning')

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
            '/pipeline/*',
            '/models/*',
            '/assessment/*',
            '/mentorship/*',
            '/placement/*',
            '/learning/*'
        ],
        'status': 'healthy'
    })