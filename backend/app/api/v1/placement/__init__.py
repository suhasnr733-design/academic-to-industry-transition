# backend/app/api/v1/placement/__init__.py

from flask import Blueprint

placement_bp = Blueprint('placement', __name__)

from app.api.v1.placement import routes
