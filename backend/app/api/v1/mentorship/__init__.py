# backend/app/api/v1/mentorship/__init__.py

from flask import Blueprint

mentorship_bp = Blueprint('mentorship', __name__)

from app.api.v1.mentorship import routes
