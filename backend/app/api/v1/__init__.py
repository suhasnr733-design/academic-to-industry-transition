# backend/app/api/v1/__init__.py

from flask import Blueprint, jsonify

api_v1_bp = Blueprint('api_v1', __name__, url_prefix='/v1')

from app.api.v1.auth import auth_bp
from app.api.v1.resume import resume_bp
from app.api.v1.jobs import jobs_bp
from app.api.v1.prediction import prediction_bp
from app.api.v1.admin import admin_bp
from app.api.v1.notifications import notifications_bp
from app.api.v1.graphql import graphql_bp
from app.api.v1.analytics import analytics_bp

api_v1_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_v1_bp.register_blueprint(resume_bp, url_prefix='/resume')
api_v1_bp.register_blueprint(jobs_bp, url_prefix='/jobs')
api_v1_bp.register_blueprint(prediction_bp, url_prefix='/prediction')
api_v1_bp.register_blueprint(admin_bp, url_prefix='/admin')
api_v1_bp.register_blueprint(notifications_bp, url_prefix='/notifications')
api_v1_bp.register_blueprint(graphql_bp, url_prefix='/graphql')
api_v1_bp.register_blueprint(analytics_bp, url_prefix='/analytics')

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
            '/admin/*',
            '/notifications/*',
            '/graphql',
            '/analytics/*'
        ],
        'deprecated': [],
        'documentation': '/api/docs'
    })