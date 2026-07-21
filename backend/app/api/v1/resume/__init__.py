from flask import Blueprint
resume_bp = Blueprint('resume', __name__)
from app.api.v1.resume import routes
