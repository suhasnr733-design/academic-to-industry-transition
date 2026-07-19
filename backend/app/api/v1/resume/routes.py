<<<<<<< HEAD
# backend/app/api/v1/resume/routes.py

=======
>>>>>>> 2030d95c258619aabe6b95adc937342934a82c28
import os
import uuid
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models import User, Resume
from app.api.v1.resume import resume_bp
<<<<<<< HEAD
from app.services.resume_processor import ResumeProcessor
from app.services.file_service import FileService
from app.services.cache_service import CacheService
from app.services.rate_limiter import api_rate_limit
from app.services.monitoring import APIMonitor
from app.services.notification_service import NotificationService
from app.services.websocket import send_resume_update
import logging

logger = logging.getLogger(__name__)

# ============================================
# ALLOWED FILE EXTENSIONS
# ============================================
def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

# ============================================
# UPLOAD RESUME ENDPOINT
# ============================================
@resume_bp.route('/upload', methods=['POST'])
@jwt_required()
@api_rate_limit
@APIMonitor.track_request
def upload_resume():
    """
    Upload a resume file
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    parameters:
      - name: file
        in: formData
        type: file
        required: true
        description: Resume file (PDF, DOCX, DOC, TXT)
    responses:
      201:
        description: Resume uploaded successfully
      400:
        description: Invalid file
      404:
        description: User not found
      413:
        description: File too large
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User no longer exists'
            }), 404
        
        # Check if file is provided
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'message': 'Please select a file to upload'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'error': 'No file selected',
                'message': 'Please select a file'
            }), 400
        
        # Validate file
        is_valid, errors = FileService.validate_file(file)
        if not is_valid:
            return jsonify({
                'error': 'Invalid file',
                'message': errors
            }), 400
        
        # Check if user has reached maximum file limit
        existing_resumes = Resume.query.filter_by(user_id=current_user_id).count()
        max_files = current_app.config.get('MAX_FILES_PER_USER', 10)
        if existing_resumes >= max_files:
            return jsonify({
                'error': 'Maximum files limit reached',
                'message': f'You can only upload {max_files} resumes'
            }), 400
        
        # Save file
        save_result, save_errors = FileService.save_file(file, current_user_id)
        if not save_result:
            return jsonify({
                'error': 'File save failed',
                'message': save_errors
            }), 500
        
        # Check for duplicate file
        if FileService.check_duplicate(current_user_id, save_result['file_hash']):
            return jsonify({
                'error': 'Duplicate file',
                'message': 'You have already uploaded this file'
            }), 409
        
        # Create resume record
        resume = Resume(
            user_id=current_user_id,
            filename=save_result['filename'],
            file_path=save_result['file_path'],
            file_size=save_result['file_size'],
            file_type=save_result['file_type'],
            file_hash=save_result['file_hash'],
            status='pending'
        )
        
        db.session.add(resume)
        db.session.commit()
        
        # Clear cache for this user's resumes
        CacheService.clear_pattern(f"resume_list_{current_user_id}")
        
        # Send notification
        try:
            NotificationService.send_in_app_notification(
                current_user_id,
                "Resume Uploaded Successfully",
                f"Your resume '{resume.filename}' has been uploaded and will be processed.",
                'info',
                f'/resume/{resume.id}'
            )
        except Exception as e:
            logger.error(f"Notification error: {e}")
        
        # Send WebSocket update
        try:
            send_resume_update(current_user_id, resume.id, 'uploaded')
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        
        logger.info(f"Resume uploaded: {resume.filename} (ID: {resume.id}) for user {current_user_id}")
        
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
        return jsonify({
            'error': 'Upload failed',
            'message': str(e)
        }), 500

# ============================================
# LIST RESUMES ENDPOINT
# ============================================
@resume_bp.route('/list', methods=['GET'])
@jwt_required()
@APIMonitor.track_request
def list_resumes():
    """
    List all resumes for current user
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 20
      - name: status
        in: query
        type: string
        enum: [pending, processing, completed, failed]
      - name: sort_by
        in: query
        type: string
        default: created_at
        enum: [created_at, filename, file_size, employability_score]
      - name: sort_order
        in: query
        type: string
        default: desc
        enum: [asc, desc]
    responses:
      200:
        description: List of resumes
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Validate pagination
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 20
        
        # Build query
        query = Resume.query.filter_by(user_id=current_user_id)
        
        # Filter by status
        if status:
            query = query.filter_by(status=status)
        
        # Sort
        sort_column = getattr(Resume, sort_by, Resume.created_at)
        if sort_order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page)
        
        # Cache for future requests
        cache_key = CacheService.get_cache_key(
            'resume_list',
            current_user_id,
            page,
            per_page,
            status,
            sort_by,
            sort_order
        )
        CacheService.set(cache_key, [r.to_dict() for r in pagination.items], 300)
        
        return jsonify({
            'resumes': [r.to_dict() for r in pagination.items],
            'total': pagination.total,
            'page': page,
            'pages': pagination.pages,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        logger.error(f"Resume list error: {e}")
        return jsonify({
            'error': 'Failed to fetch resumes',
            'message': str(e)
        }), 500

# ============================================
# GET RESUME DETAILS ENDPOINT
# ============================================
@resume_bp.route('/<int:resume_id>', methods=['GET'])
@jwt_required()
@APIMonitor.track_request
def get_resume(resume_id):
    """
    Get resume details
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    parameters:
      - name: resume_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Resume details
      404:
        description: Resume not found
    """
    try:
        current_user_id = get_jwt_identity()
        
        resume = Resume.query.filter_by(
            id=resume_id,
            user_id=current_user_id
        ).first()
        
        if not resume:
            return jsonify({
                'error': 'Resume not found',
                'message': 'The requested resume does not exist'
            }), 404
        
        # Cache the response
        cache_key = CacheService.get_cache_key('resume_detail', resume_id)
        CacheService.set(cache_key, resume.to_dict(), 300)
        
        return jsonify(resume.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Resume fetch error: {e}")
        return jsonify({
            'error': 'Failed to fetch resume',
            'message': str(e)
        }), 500

# ============================================
# DELETE RESUME ENDPOINT
# ============================================
@resume_bp.route('/<int:resume_id>', methods=['DELETE'])
@jwt_required()
@APIMonitor.track_request
def delete_resume(resume_id):
    """
    Delete a resume
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    parameters:
      - name: resume_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Resume deleted successfully
      404:
        description: Resume not found
    """
    try:
        current_user_id = get_jwt_identity()
        
        resume = Resume.query.filter_by(
            id=resume_id,
            user_id=current_user_id
        ).first()
        
        if not resume:
            return jsonify({
                'error': 'Resume not found',
                'message': 'The requested resume does not exist'
            }), 404
        
        # Delete file from disk
        if os.path.exists(resume.file_path):
            os.remove(resume.file_path)
            logger.info(f"File deleted: {resume.file_path}")
        
        # Delete from database
        db.session.delete(resume)
        db.session.commit()
        
        # Clear cache
        CacheService.clear_pattern(f"resume_{resume_id}")
        CacheService.clear_pattern(f"resume_list_{current_user_id}")
        
        # Send notification
        try:
            NotificationService.send_in_app_notification(
                current_user_id,
                "Resume Deleted",
                f"Your resume '{resume.filename}' has been deleted.",
                'warning',
                '/resume/list'
            )
        except Exception as e:
            logger.error(f"Notification error: {e}")
        
        logger.info(f"Resume deleted: {resume.filename} (ID: {resume_id}) for user {current_user_id}")
        
        return jsonify({
            'message': 'Resume deleted successfully',
            'deleted_id': resume_id
        }), 200
        
    except Exception as e:
        logger.error(f"Resume deletion error: {e}")
        db.session.rollback()
        return jsonify({
            'error': 'Failed to delete resume',
            'message': str(e)
        }), 500

# ============================================
# PROCESS RESUME ENDPOINT
# ============================================
@resume_bp.route('/<int:resume_id>/process', methods=['POST'])
@jwt_required()
@APIMonitor.track_request
def process_resume(resume_id):
    """
    Start processing a resume
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    parameters:
      - name: resume_id
        in: path
        type: integer
        required: true
    responses:
      202:
        description: Processing started
      400:
        description: Already processing or completed
      404:
        description: Resume not found
    """
    try:
        current_user_id = get_jwt_identity()
        
        resume = Resume.query.filter_by(
            id=resume_id,
            user_id=current_user_id
        ).first()
        
        if not resume:
            return jsonify({
                'error': 'Resume not found',
                'message': 'The requested resume does not exist'
            }), 404
        
        # Check current status
        if resume.status == 'processing':
            return jsonify({
                'error': 'Already processing',
                'message': 'This resume is currently being processed'
            }), 400
        
        if resume.status == 'completed':
            return jsonify({
                'error': 'Already processed',
                'message': 'This resume has already been processed'
            }), 400
        
        # Update status to processing
        resume.status = 'processing'
        db.session.commit()
        
        # Send WebSocket update
        try:
            send_resume_update(current_user_id, resume_id, 'processing')
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        
        # Start background processing
        processor = ResumeProcessor()
        processor.process_resume_async(resume_id)
        
        logger.info(f"Resume processing started: {resume_id} for user {current_user_id}")
        
        return jsonify({
            'message': 'Resume processing started',
            'resume_id': resume_id,
            'status': 'processing',
            'estimated_time': '30-60 seconds'
        }), 202
        
    except Exception as e:
        logger.error(f"Resume processing start error: {e}")
        db.session.rollback()
        return jsonify({
            'error': 'Failed to start processing',
            'message': str(e)
        }), 500

# ============================================
# GET PROCESSING STATUS ENDPOINT
# ============================================
@resume_bp.route('/<int:resume_id>/status', methods=['GET'])
@jwt_required()
@APIMonitor.track_request
def get_processing_status(resume_id):
    """
    Get resume processing status
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    parameters:
      - name: resume_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Processing status
      404:
        description: Resume not found
    """
    try:
        current_user_id = get_jwt_identity()
        
        resume = Resume.query.filter_by(
            id=resume_id,
            user_id=current_user_id
        ).first()
        
        if not resume:
            return jsonify({
                'error': 'Resume not found',
                'message': 'The requested resume does not exist'
            }), 404
        
        # Calculate progress based on status
        progress_map = {
            'pending': 0,
            'processing': 50,
            'completed': 100,
            'failed': 0
        }
        
        return jsonify({
            'resume_id': resume.id,
            'filename': resume.filename,
            'status': resume.status,
            'progress': progress_map.get(resume.status, 0),
            'has_skills': bool(resume.skills),
            'skill_count': len(resume.skills) if resume.skills else 0,
            'employability_score': resume.employability_score,
            'error_message': resume.error_message,
            'created_at': resume.created_at.isoformat(),
            'updated_at': resume.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Status fetch error: {e}")
        return jsonify({
            'error': 'Failed to fetch status',
            'message': str(e)
        }), 500

# ============================================
# GET PARSED RESUME DATA ENDPOINT
# ============================================
@resume_bp.route('/<int:resume_id>/data', methods=['GET'])
@jwt_required()
@APIMonitor.track_request
def get_resume_data(resume_id):
    """
    Get parsed resume data
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    parameters:
      - name: resume_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Parsed resume data
      400:
        description: Resume not processed
      404:
        description: Resume not found
    """
    try:
        current_user_id = get_jwt_identity()
        
        resume = Resume.query.filter_by(
            id=resume_id,
            user_id=current_user_id
        ).first()
        
        if not resume:
            return jsonify({
                'error': 'Resume not found',
                'message': 'The requested resume does not exist'
            }), 404
        
        if resume.status != 'completed':
            return jsonify({
                'error': 'Resume not processed',
                'message': f'Resume is currently {resume.status}',
                'status': resume.status
            }), 400
        
        # Cache the data
        cache_key = CacheService.get_cache_key('resume_data', resume_id)
        CacheService.set(cache_key, {
            'skills': resume.skills or [],
            'education': resume.education or [],
            'experience': resume.experience or {},
            'projects': resume.projects or [],
            'certifications': resume.certifications or [],
            'employability_score': resume.employability_score,
            'recommended_roles': resume.recommended_roles or [],
            'skill_gaps': resume.skill_gaps or []
        }, 600)
        
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
        logger.error(f"Resume data fetch error: {e}")
        return jsonify({
            'error': 'Failed to fetch resume data',
            'message': str(e)
        }), 500

# ============================================
# REPROCESS RESUME ENDPOINT
# ============================================
@resume_bp.route('/<int:resume_id>/reprocess', methods=['POST'])
@jwt_required()
@APIMonitor.track_request
def reprocess_resume(resume_id):
    """
    Reprocess an existing resume
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    parameters:
      - name: resume_id
        in: path
        type: integer
        required: true
    responses:
      202:
        description: Reprocessing started
      404:
        description: Resume not found
    """
    try:
        current_user_id = get_jwt_identity()
        
        resume = Resume.query.filter_by(
            id=resume_id,
            user_id=current_user_id
        ).first()
        
        if not resume:
            return jsonify({
                'error': 'Resume not found',
                'message': 'The requested resume does not exist'
            }), 404
        
        # Reset status and clear data
        resume.status = 'pending'
        resume.skills = []
        resume.education = []
        resume.experience = {}
        resume.projects = []
        resume.certifications = []
        resume.employability_score = None
        resume.recommended_roles = []
        resume.skill_gaps = []
        resume.error_message = None
        db.session.commit()
        
        # Start processing
        processor = ResumeProcessor()
        processor.process_resume_async(resume_id)
        
        # Send notification
        try:
            NotificationService.send_in_app_notification(
                current_user_id,
                "Resume Reprocessing Started",
                f"Your resume '{resume.filename}' is being reprocessed.",
                'info',
                f'/resume/{resume.id}'
            )
        except Exception as e:
            logger.error(f"Notification error: {e}")
        
        logger.info(f"Resume reprocessing started: {resume_id}")
        
        return jsonify({
            'message': 'Resume reprocessing started',
            'resume_id': resume_id,
            'status': 'pending'
        }), 202
        
    except Exception as e:
        logger.error(f"Resume reprocessing error: {e}")
        db.session.rollback()
        return jsonify({
            'error': 'Failed to reprocess resume',
            'message': str(e)
        }), 500

# ============================================
# BATCH PROCESS RESUMES ENDPOINT
# ============================================
@resume_bp.route('/batch-process', methods=['POST'])
@jwt_required()
@APIMonitor.track_request
def batch_process_resumes():
    """
    Process multiple resumes in batch
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            resume_ids:
              type: array
              items:
                type: integer
    responses:
      202:
        description: Batch processing started
      400:
        description: Missing resume_ids
      404:
        description: Some resumes not found
    """
    try:
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data or 'resume_ids' not in data:
            return jsonify({
                'error': 'Missing resume_ids',
                'message': 'Please provide a list of resume IDs'
            }), 400
        
        resume_ids = data['resume_ids']
        if not isinstance(resume_ids, list) or not resume_ids:
            return jsonify({
                'error': 'Invalid resume_ids',
                'message': 'resume_ids must be a non-empty list'
            }), 400
        
        # Verify all resumes belong to user
        resumes = Resume.query.filter(
            Resume.id.in_(resume_ids),
            Resume.user_id == current_user_id
        ).all()
        
        if len(resumes) != len(resume_ids):
            return jsonify({
                'error': 'Some resumes not found',
                'message': 'One or more resumes do not exist'
            }), 404
        
        # Start batch processing
        processor = ResumeProcessor()
        result = processor.process_batch(resume_ids)
        
        # Send notification
        try:
            NotificationService.send_in_app_notification(
                current_user_id,
                "Batch Processing Started",
                f"Processing {result['processed']} resumes.",
                'info',
                '/resume/list'
            )
        except Exception as e:
            logger.error(f"Notification error: {e}")
        
        logger.info(f"Batch processing started for {result['processed']} resumes")
        
        return jsonify({
            'message': f'Processing {result["processed"]} resumes',
            'processed': result['processed'],
            'resume_ids': resume_ids,
            'status': 'processing'
        }), 202
        
    except Exception as e:
        logger.error(f"Batch processing error: {e}")
        return jsonify({
            'error': 'Failed to start batch processing',
            'message': str(e)
        }), 500

# ============================================
# GET RESUME STATISTICS ENDPOINT
# ============================================
@resume_bp.route('/stats', methods=['GET'])
@jwt_required()
@APIMonitor.track_request
def get_resume_stats():
    """
    Get resume statistics for current user
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    responses:
      200:
        description: Resume statistics
    """
    try:
        current_user_id = get_jwt_identity()
        
        total = Resume.query.filter_by(user_id=current_user_id).count()
        pending = Resume.query.filter_by(user_id=current_user_id, status='pending').count()
        processing = Resume.query.filter_by(user_id=current_user_id, status='processing').count()
        completed = Resume.query.filter_by(user_id=current_user_id, status='completed').count()
        failed = Resume.query.filter_by(user_id=current_user_id, status='failed').count()
        
        # Average employability score
        avg_score = db.session.query(db.func.avg(Resume.employability_score)).filter(
            Resume.user_id == current_user_id,
            Resume.status == 'completed'
        ).scalar()
        
        return jsonify({
            'total': total,
            'pending': pending,
            'processing': processing,
            'completed': completed,
            'failed': failed,
            'average_employability_score': round(avg_score, 2) if avg_score else None
        }), 200
        
    except Exception as e:
        logger.error(f"Resume stats error: {e}")
        return jsonify({
            'error': 'Failed to fetch statistics',
            'message': str(e)
        }), 500

# ============================================
# DOWNLOAD RESUME ENDPOINT
# ============================================
@resume_bp.route('/<int:resume_id>/download', methods=['GET'])
@jwt_required()
@APIMonitor.track_request
def download_resume(resume_id):
    """
    Download a resume file
    ---
    tags:
      - Resume Management
    security:
      - bearerAuth: []
    parameters:
      - name: resume_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: File download
      404:
        description: Resume not found
    """
    try:
        current_user_id = get_jwt_identity()
        
        resume = Resume.query.filter_by(
            id=resume_id,
            user_id=current_user_id
        ).first()
        
        if not resume:
            return jsonify({
                'error': 'Resume not found',
                'message': 'The requested resume does not exist'
            }), 404
        
        if not os.path.exists(resume.file_path):
            return jsonify({
                'error': 'File not found',
                'message': 'The resume file does not exist on the server'
            }), 404
        
        # Return file
        from flask import send_file
        return send_file(
            resume.file_path,
            as_attachment=True,
            download_name=resume.filename,
            mimetype='application/octet-stream'
        )
        
    except Exception as e:
        logger.error(f"Resume download error: {e}")
        return jsonify({
            'error': 'Failed to download resume',
            'message': str(e)
        }), 500
=======

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@resume_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_resume():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    resume = Resume(
        user_id=user.id,
        filename=original_filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        file_type=file_extension,
        status='pending'
    )
    
    db.session.add(resume)
    db.session.commit()
    
    return jsonify({
        'message': 'Resume uploaded successfully',
        'resume_id': resume.id,
        'filename': resume.filename,
        'status': resume.status
    }), 201

@resume_bp.route('/list', methods=['GET'])
@jwt_required()
def list_resumes():
    resumes = Resume.query.filter_by(user_id=get_jwt_identity()).order_by(Resume.created_at.desc()).all()
    return jsonify({'resumes': [r.to_dict() for r in resumes], 'total': len(resumes)}), 200

@resume_bp.route('/<int:resume_id>', methods=['GET'])
@jwt_required()
def get_resume(resume_id):
    resume = Resume.query.filter_by(id=resume_id, user_id=get_jwt_identity()).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    return jsonify(resume.to_dict()), 200

@resume_bp.route('/<int:resume_id>', methods=['DELETE'])
@jwt_required()
def delete_resume(resume_id):
    resume = Resume.query.filter_by(id=resume_id, user_id=get_jwt_identity()).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    if os.path.exists(resume.file_path):
        os.remove(resume.file_path)
    
    db.session.delete(resume)
    db.session.commit()
    
    return jsonify({'message': 'Resume deleted successfully'}), 200

@resume_bp.route('/<int:resume_id>/process', methods=['POST'])
@jwt_required()
def process_resume(resume_id):
    resume = Resume.query.filter_by(id=resume_id, user_id=get_jwt_identity()).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    # Simple processing simulation
    resume.status = 'processing'
    db.session.commit()
    
    # Simulate processing
    resume.status = 'completed'
    resume.skills = ['Python', 'Java', 'SQL']  # Placeholder
    resume.employability_score = 75.0
    db.session.commit()
    
    return jsonify({
        'message': 'Resume processing completed',
        'resume_id': resume_id,
        'status': 'completed'
    }), 200
>>>>>>> 2030d95c258619aabe6b95adc937342934a82c28
