# backend/app/api/v1/resume/routes.py

import os
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models import User, Resume
from app.api.v1.resume import resume_bp
from app.services.resume_processor import ResumeProcessor
import logging

logger = logging.getLogger(__name__)

def allowed_file(filename):
    allowed = current_app.config.get('ALLOWED_EXTENSIONS', {'pdf', 'docx', 'doc', 'txt'})
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed

@resume_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_resume():
    """Upload a resume file"""
    try:
        current_user_id = int(get_jwt_identity())
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Allowed types: pdf, docx, doc, txt'}), 400
        
        filename = secure_filename(file.filename)
        upload_folder = current_app.config.get('UPLOAD_FOLDER')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, f"{current_user_id}_{filename}")
        file.save(file_path)
        
        file_size = os.path.getsize(file_path)
        file_type = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        
        resume = Resume(
            user_id=current_user_id,
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            file_type=file_type,
            status='pending'
        )
        
        db.session.add(resume)
        db.session.commit()
        
        return jsonify({
            'message': 'Resume uploaded successfully',
            'resume_id': resume.id,
            'filename': resume.filename,
            'file_size': resume.file_size,
            'file_type': resume.file_type,
            'status': resume.status,
            'created_at': resume.created_at.isoformat()
        }), 201
        
    except Exception as e:
        logger.error(f"Resume upload error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Upload failed', 'message': str(e)}), 500

@resume_bp.route('/list', methods=['GET'])
@jwt_required()
def list_resumes():
    """List all resumes for current user"""
    try:
        current_user_id = int(get_jwt_identity())
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = Resume.query.filter_by(user_id=current_user_id)
        if status:
            query = query.filter_by(status=status)
            
        pagination = query.order_by(Resume.created_at.desc()).paginate(page=page, per_page=per_page)
        
        return jsonify({
            'resumes': [r.to_dict() for r in pagination.items],
            'total': pagination.total,
            'page': page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        logger.error(f"Resume list error: {e}")
        return jsonify({'error': 'Failed to fetch resumes', 'message': str(e)}), 500

@resume_bp.route('/<int:resume_id>', methods=['GET'])
@jwt_required()
def get_resume(resume_id):
    """Get resume details by ID"""
    try:
        current_user_id = int(get_jwt_identity())
        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        return jsonify(resume.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/<int:resume_id>', methods=['DELETE'])
@jwt_required()
def delete_resume(resume_id):
    """Delete a resume"""
    try:
        current_user_id = int(get_jwt_identity())
        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        if os.path.exists(resume.file_path):
            try:
                os.remove(resume.file_path)
            except Exception as e:
                logger.warning(f"Could not remove file {resume.file_path}: {e}")
        
        db.session.delete(resume)
        db.session.commit()
        
        return jsonify({'message': 'Resume deleted successfully', 'deleted_id': resume_id}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/<int:resume_id>/process', methods=['POST'])
@jwt_required()
def process_resume(resume_id):
    """Start background processing for resume"""
    try:
        current_user_id = int(get_jwt_identity())
        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        processor = ResumeProcessor()
        processor.process_resume_async(resume_id)
        
        return jsonify({
            'message': 'Resume processing started',
            'resume_id': resume_id,
            'status': 'processing'
        }), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/<int:resume_id>/status', methods=['GET'])
@jwt_required()
def get_processing_status(resume_id):
    """Get resume processing status"""
    try:
        current_user_id = int(get_jwt_identity())
        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        progress = 100 if resume.status == 'completed' else (50 if resume.status == 'processing' else 0)
        
        return jsonify({
            'resume_id': resume.id,
            'filename': resume.filename,
            'status': resume.status,
            'progress': progress,
            'employability_score': resume.employability_score,
            'error_message': resume.error_message,
            'created_at': resume.created_at.isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/<int:resume_id>/data', methods=['GET'])
@jwt_required()
def get_resume_data(resume_id):
    """Get parsed resume data"""
    try:
        current_user_id = int(get_jwt_identity())
        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        return jsonify({
            'skills': resume.skills or [],
            'education': resume.education or [],
            'experience': resume.experience or {},
            'projects': resume.projects or [],
            'certifications': resume.certifications or [],
            'employability_score': resume.employability_score,
            'recommended_roles': resume.recommended_roles or [],
            'skill_gaps': resume.skill_gaps or []
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
