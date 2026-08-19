from flask import Blueprint
prediction_bp = Blueprint('prediction', __name__)
from app.api.v1.prediction import routes
