from flask import Blueprint

analytics_bp = Blueprint('analytics', __name__)

from app.api.v1.analytics import routes
