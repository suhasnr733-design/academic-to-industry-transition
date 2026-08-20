from flask import Blueprint

notifications_bp = Blueprint('notifications', __name__)

from app.api.v1.notifications import routes
