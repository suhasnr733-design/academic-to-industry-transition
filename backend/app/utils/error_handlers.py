# backend/app/utils/error_handlers.py

from flask import jsonify, request
from app.extensions import db
import traceback
import logging

logger = logging.getLogger(__name__)

def register_error_handlers(app):
    """Register custom error handlers"""
    
    @app.errorhandler(400)
    def bad_request(error):
        logger.warning(f"Bad request: {error}")
        return jsonify({
            'error': 'Bad Request',
            'message': str(error),
            'status_code': 400
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required',
            'status_code': 401
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'error': 'Forbidden',
            'message': 'You do not have permission',
            'status_code': 403
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found',
            'status_code': 404
        }), 404
    
    @app.errorhandler(409)
    def conflict(error):
        return jsonify({
            'error': 'Conflict',
            'message': str(error),
            'status_code': 409
        }), 409
    
    @app.errorhandler(422)
    def unprocessable(error):
        return jsonify({
            'error': 'Unprocessable Entity',
            'message': str(error),
            'status_code': 422
        }), 422
    
    @app.errorhandler(429)
    def too_many_requests(error):
        return jsonify({
            'error': 'Too Many Requests',
            'message': 'Rate limit exceeded. Please try again later.',
            'status_code': 429
        }), 429
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        logger.error(traceback.format_exc())
        
        # Rollback database session
        db.session.rollback()
        
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'status_code': 500
        }), 500
    
    @app.errorhandler(Exception)
    def handle_unhandled_error(error):
        logger.error(f"Unhandled error: {error}")
        logger.error(traceback.format_exc())
        
        db.session.rollback()
        
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'status_code': 500
        }), 500

# Custom exception classes
class APIError(Exception):
    """Base API exception"""
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class ValidationError(APIError):
    """Validation error"""
    def __init__(self, message):
        super().__init__(message, 400)

class AuthenticationError(APIError):
    """Authentication error"""
    def __init__(self, message):
        super().__init__(message, 401)

class AuthorizationError(APIError):
    """Authorization error"""
    def __init__(self, message):
        super().__init__(message, 403)

class ResourceNotFoundError(APIError):
    """Resource not found error"""
    def __init__(self, message):
        super().__init__(message, 404)

class ConflictError(APIError):
    """Conflict error"""
    def __init__(self, message):
        super().__init__(message, 409)