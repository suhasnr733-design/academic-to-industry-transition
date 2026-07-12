from flask import Blueprint

api_v1_bp = Blueprint('api_v1', __name__)

from app.api.v1.auth import auth_bp
from app.api.v1.resume import resume_bp
from app.api.v1.jobs import jobs_bp
from app.api.v1.prediction import prediction_bp
from app.api.v1.admin import admin_bp

api_v1_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_v1_bp.register_blueprint(resume_bp, url_prefix='/resume')
api_v1_bp.register_blueprint(jobs_bp, url_prefix='/jobs')
api_v1_bp.register_blueprint(prediction_bp, url_prefix='/prediction')
api_v1_bp.register_blueprint(admin_bp, url_prefix='/admin')
