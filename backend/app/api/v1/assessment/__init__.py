# backend/app/api/v1/assessment/__init__.py

from flask import Blueprint

assessment_bp = Blueprint('assessment', __name__)

from app.api.v1.assessment import routes
