from flask import Blueprint
admin_bp = Blueprint('admin', __name__)
from app.api.v1.admin import routes
