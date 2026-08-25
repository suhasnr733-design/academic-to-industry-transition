# backend/app/api/v1/learning/__init__.py

from flask import Blueprint

learning_bp = Blueprint('learning', __name__)

from app.api.v1.learning import routes
