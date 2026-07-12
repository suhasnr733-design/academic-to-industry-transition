from flask import Blueprint
jobs_bp = Blueprint('jobs', __name__)
from app.api.v1.jobs import routes
