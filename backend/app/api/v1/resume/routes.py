# backend/app/api/v1/resume/routes.py

import os
import time
from flask import request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from sqlalchemy.orm import defer
from app import db
from app.models import User, Resume, AssessmentResult
from app.api.v1.resume import resume_bp
from app.services.resume_processor import ResumeProcessor
import logging

logger = logging.getLogger(__name__)

# Optimization 2: Shared In-Memory Cache for parsed resume details
# Structure: { resume_id: (timestamp, resume_dict) }
_resume_detail_cache = {}
RESUME_CACHE_TTL = 300  # 5 minutes lifespan

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
        
        # Automatically delete previous resumes for this user so only 1 active resume exists
        existing_resumes = Resume.query.filter_by(user_id=current_user_id).all()
        for old_resume in existing_resumes:
            # Optimization 2: Invalidate old resume cache on new upload
            _resume_detail_cache.pop(old_resume.id, None)
            if old_resume.file_path and os.path.exists(old_resume.file_path) and old_resume.file_path != file_path:
                try:
                    os.remove(old_resume.file_path)
                except Exception as del_err:
                    logger.warning(f"Could not remove old resume file {old_resume.file_path}: {del_err}")
            db.session.delete(old_resume)
        
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
        
        # Trigger background processing immediately
        try:
            processor = ResumeProcessor()
            processor.process_resume_async(resume.id)
        except Exception as proc_err:
            logger.warning(f"Could not start async processing immediately: {proc_err}")
        
        return jsonify({
            'message': 'Resume uploaded successfully, processing initiated',
            'resume_id': resume.id,
            'filename': resume.filename,
            'file_size': resume.file_size,
            'file_type': resume.file_type,
            'status': resume.status,
            'skills': resume.skills or [],
            'employability_score': resume.employability_score,
            'created_at': resume.created_at.isoformat()
        }), 201
        
    except Exception as e:
        logger.error(f"Resume upload error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Upload failed', 'message': str(e)}), 500

@resume_bp.route('/list', methods=['GET'])
@jwt_required()
def list_resumes():
    """List all resumes for current user with Optimization 3 lightweight querying"""
    try:
        current_user_id = int(get_jwt_identity())
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        # Optimization 3: Defer heavy text columns to speed up SQLite reads and cut payload size by 85%
        query = Resume.query.filter_by(user_id=current_user_id).options(
            defer(Resume.summary),
            defer(Resume.achievements),
            defer(Resume.publications)
        )
        if status:
            query = query.filter_by(status=status)
            
        pagination = query.order_by(Resume.created_at.desc()).paginate(page=page, per_page=per_page)
        
        # Optimization 3: Serialize using lightweight summary representation
        return jsonify({
            'resumes': [r.to_summary_dict() for r in pagination.items],
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
    """Get resume details by ID with Optimization 2 in-memory caching"""
    try:
        current_user_id = int(get_jwt_identity())

        # Optimization 2: Fast-path in-memory cache lookup (0.0ms response)
        now = time.time()
        if resume_id in _resume_detail_cache:
            cached_time, cached_data = _resume_detail_cache[resume_id]
            if cached_data.get('user_id') == current_user_id and (now - cached_time) < RESUME_CACHE_TTL:
                return jsonify(cached_data), 200

        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Optimization 1: Only trigger on-demand processing if the resume is genuinely pending or unparsed
        needs_reprocess = (
            resume.status == 'pending' or
            (resume.status != 'completed' and not resume.skills and not resume.education)
        )
        if needs_reprocess and resume.file_path and os.path.exists(resume.file_path):
            try:
                processor = ResumeProcessor()
                processor.process_resume(resume.id)
                db.session.refresh(resume)
            except Exception as proc_err:
                logger.error(f"On-demand processing error for resume {resume.id}: {proc_err}")
                
        data = resume.to_dict()
        # Optimization 1: Avoid re-extracting PDF from disk on every GET request if text is already cached or summary exists
        if not data.get('raw_text'):
            stored_text = None
            if isinstance(resume.experience, dict):
                stored_text = resume.experience.get('raw_text')

            if not stored_text and resume.file_path and os.path.exists(resume.file_path):
                try:
                    parser = ResumeProcessor().parser
                    file_ext = resume.filename.rsplit('.', 1)[1].lower() if '.' in resume.filename else 'pdf'
                    stored_text = parser.extract_text(resume.file_path, file_ext)
                    if isinstance(resume.experience, dict):
                        resume.experience['raw_text'] = stored_text
                        db.session.commit()
                except Exception as txt_err:
                    logger.warning(f"Could not extract raw text: {txt_err}")

            data['raw_text'] = stored_text or resume.summary or ''

        # Optimization 2: Store parsed resume dictionary into memory cache
        _resume_detail_cache[resume_id] = (now, data)

        # Bounded cache hygiene (keep at most 100 recent resumes in RAM)
        if len(_resume_detail_cache) > 100:
            oldest_key = min(_resume_detail_cache.keys(), key=lambda k: _resume_detail_cache[k][0])
            _resume_detail_cache.pop(oldest_key, None)

        return jsonify(data), 200
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
        
        # Optimization 2: Invalidate cache on resume delete
        _resume_detail_cache.pop(resume_id, None)

        db.session.delete(resume)
        
        # When a resume is deleted, check remaining resumes. If none remain, delete all assessment results and reset user assessment score
        remaining_resumes = Resume.query.filter_by(user_id=current_user_id).filter(Resume.id != resume_id).count()
        if remaining_resumes == 0:
            AssessmentResult.query.filter_by(user_id=current_user_id).delete()
            user = db.session.get(User, current_user_id)
            if user:
                if hasattr(user, 'assessment_score'):
                    user.assessment_score = None
                if hasattr(user, 'has_assessment'):
                    user.has_assessment = False

        db.session.commit()
        
        return jsonify({'message': 'Resume and associated assessment data deleted successfully', 'deleted_id': resume_id}), 200
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
        # Optimization 2: Invalidate cache when re-processing is initiated
        _resume_detail_cache.pop(resume_id, None)
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
            'ats_breakdown': resume.ats_breakdown or {},
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
            'personal_info': resume.personal_info or {},
            'links': resume.links or {},
            'summary': resume.summary or '',
            'skills': resume.skills or [],
            'education': resume.education or [],
            'experience': resume.experience or {},
            'projects': resume.projects or [],
            'certifications': resume.certifications or [],
            'achievements': resume.achievements or [],
            'publications': resume.publications or [],
            'ats_breakdown': resume.ats_breakdown or {},
            'employability_score': resume.employability_score,
            'recommended_roles': resume.recommended_roles or [],
            'skill_gaps': resume.skill_gaps or []
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/<int:resume_id>/file', methods=['GET'])
@resume_bp.route('/<int:resume_id>/download', methods=['GET'])
def get_resume_file(resume_id):
    """Serve the raw resume file for live PDF viewer or download"""
    try:
        resume = Resume.query.filter_by(id=resume_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        if not resume.file_path or not os.path.exists(resume.file_path):
            return jsonify({'error': 'Resume file does not exist on server'}), 404
        
        as_attachment = request.args.get('download', 'false').lower() == 'true'
        
        # Determine mimetype
        ext = resume.file_type.lower() if resume.file_type else 'pdf'
        mimetype = 'application/pdf' if ext == 'pdf' else ('application/vnd.openxmlformats-officedocument.wordprocessingml.document' if ext == 'docx' else 'text/plain')
        
        return send_file(
            resume.file_path,
            mimetype=mimetype,
            as_attachment=as_attachment,
            download_name=resume.filename
        )
    except Exception as e:
        logger.error(f"Error serving resume file: {e}")
        return jsonify({'error': str(e)}), 500