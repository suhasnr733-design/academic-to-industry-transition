# backend/app/middleware/compression.py

import gzip
from io import BytesIO
from flask import request, Response

class CompressionMiddleware:
    """Gzip compression middleware"""
    
    def __init__(self, app):
        self.app = app
        self.min_size = 1024  # 1KB
    
    def __call__(self, environ, start_response):
        request = environ.get('HTTP_ACCEPT_ENCODING', '')
        
        if 'gzip' not in request:
            return self.app(environ, start_response)
        
        def gzipped_start_response(status, headers, exc_info=None):
            headers.append(('Content-Encoding', 'gzip'))
            return start_response(status, headers, exc_info)
        
        return self.app(environ, gzipped_start_response)