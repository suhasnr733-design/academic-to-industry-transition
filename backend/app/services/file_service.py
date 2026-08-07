# backend/app/services/file_service.py

import os
import uuid
import hashlib
from werkzeug.utils import secure_filename
from flask import current_app
import mimetypes
import magic
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class FileService:
    """File upload and validation service"""
    
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
    ALLOWED_MIME_TYPES = {
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
    }
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    MAX_FILES_PER_USER = 10
    
    @staticmethod
    def validate_file(file):
        """Validate uploaded file"""
        errors = []
        
        # Check if file exists
        if not file:
            errors.append('No file provided')
            return False, errors
        
        # Check filename
        if file.filename == '':
            errors.append('No file selected')
            return False, errors
        
        # Check extension
        filename = secure_filename(file.filename)
        extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        if extension not in FileService.ALLOWED_EXTENSIONS:
            errors.append(f'Invalid file type. Allowed: {", ".join(FileService.ALLOWED_EXTENSIONS)}')
            return False, errors
        
        # Check MIME type
        file_content = file.read(1024)
        file.seek(0)
        mime_type = magic.from_buffer(file_content, mime=True)
        if mime_type not in FileService.ALLOWED_MIME_TYPES:
            errors.append(f'Invalid file format: {mime_type}')
            return False, errors
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > FileService.MAX_FILE_SIZE:
            errors.append(f'File too large. Maximum size: {FileService.MAX_FILE_SIZE / 1024 / 1024} MB')
            return False, errors
        
        return True, errors
    
    @staticmethod
    def save_file(file, user_id: int):
        """Save uploaded file"""
        # Validate
        is_valid, errors = FileService.validate_file(file)
        if not is_valid:
            return None, errors
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
        
        # Save file
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Get file info
        file_size = os.path.getsize(file_path)
        file_hash = FileService._compute_hash(file_path)
        
        return {
            'filename': original_filename,
            'file_path': file_path,
            'file_size': file_size,
            'file_type': file_extension,
            'file_hash': file_hash
        }, None
    
    @staticmethod
    def _compute_hash(file_path: str) -> str:
        """Compute file hash"""
        sha256_hash = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for byte_block in iter(lambda: f.read(4096), b''):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    @staticmethod
    def delete_file(file_path: str):
        """Delete file from system"""
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    
    @staticmethod
    def check_duplicate(user_id: int, file_hash: str):
        """Check if file already exists for user"""
        from app.models import Resume
        duplicate = Resume.query.filter_by(
            user_id=user_id,
            file_hash=file_hash
        ).first()
        return duplicate is not None