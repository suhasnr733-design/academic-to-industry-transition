
import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models import Resume, User

resume_bp = Blueprint('resume', __name__)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']
# backend/app/routes/resume.py (continued)

@resume_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_resume():
    """Upload a resume file"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if file exists
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'error': f'Invalid file type. Allowed: {", ".join(current_app.config["ALLOWED_EXTENSIONS"])}'
        }), 400
    
    # Generate unique filename
    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    
    # Ensure upload directory exists
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    # Save file
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Create resume record
    resume = Resume(
        user_id=current_user_id,
        filename=original_filename,
        file_path=file_path,
        file_size=file_size,
        status='pending'
    )
    
    db.session.add(resume)
    db.session.commit()
    
    return jsonify({
        'message': 'Resume uploaded successfully',
        'resume_id': resume.id,
        'filename': resume.filename,
        'status': resume.status,
        'file_size': resume.file_size
    }), 201
# backend/app/routes/resume.py (continued)

@resume_bp.route('/list', methods=['GET'])
@jwt_required()
def list_resumes():
    """List all resumes for current user"""
    current_user_id = get_jwt_identity()
    
    resumes = Resume.query.filter_by(user_id=current_user_id)\
        .order_by(Resume.created_at.desc())\
        .all()
    
    return jsonify({
        'resumes': [r.to_dict() for r in resumes],
        'total': len(resumes)
    }), 200
# backend/app/routes/resume.py (continued)

@resume_bp.route('/<int:resume_id>', methods=['GET'])
@jwt_required()
def get_resume(resume_id):
    """Get resume details"""
    current_user_id = get_jwt_identity()
    
    resume = Resume.query.filter_by(
        id=resume_id,
        user_id=current_user_id
    ).first()
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    return jsonify(resume.to_dict()), 200
# backend/app/routes/resume.py (continued)

@resume_bp.route('/<int:resume_id>', methods=['DELETE'])
@jwt_required()
def delete_resume(resume_id):
    """Delete a resume"""
    current_user_id = get_jwt_identity()
    
    resume = Resume.query.filter_by(
        id=resume_id,
        user_id=current_user_id
    ).first()
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    # Delete file from disk
    if os.path.exists(resume.file_path):
        os.remove(resume.file_path)
    
    db.session.delete(resume)
    db.session.commit()
    
    return jsonify({'message': 'Resume deleted successfully'}), 200
# backend/app/routes/resume.py (continued)

@resume_bp.route('/<int:resume_id>/data', methods=['GET'])
@jwt_required()
def get_resume_data(resume_id):
    """Get parsed resume data"""
    current_user_id = get_jwt_identity()
    
    resume = Resume.query.filter_by(
        id=resume_id,
        user_id=current_user_id
    ).first()
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    if resume.status != 'completed':
        return jsonify({
            'error': 'Resume not processed yet',
            'status': resume.status
        }), 400
    
    return jsonify({
        'skills': resume.skills or [],
        'education': resume.education or [],
        'experience': resume.experience or [],
        'projects': resume.projects or [],
        'certifications': resume.certifications or [],
        'employability_score': resume.employability_score,
        'recommended_roles': resume.recommended_roles or [],
        'skill_gaps': resume.skill_gaps or []
    }), 200
# backend/app/routes/resume.py (continued)

@resume_bp.route('/<int:resume_id>/process', methods=['POST'])
@jwt_required()
def process_resume(resume_id):
    """Start processing a resume"""
    current_user_id = get_jwt_identity()
    
    resume = Resume.query.filter_by(
        id=resume_id,
        user_id=current_user_id
    ).first()
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    if resume.status == 'processing':
        return jsonify({'message': 'Resume is already processing'}), 400
    
    if resume.status == 'completed':
        return jsonify({'message': 'Resume is already processed'}), 400
    
    # Start background processing
    from app.services.resume_processor import ResumeProcessor
    processor = ResumeProcessor()
    processor.process_resume_async(resume_id)
    
    return jsonify({
        'message': 'Resume processing started',
        'resume_id': resume_id,
        'status': 'processing'
    }), 202
# backend/app/routes/resume.py (continued)

@resume_bp.route('/<int:resume_id>/status', methods=['GET'])
@jwt_required()
def get_processing_status(resume_id):
    """Get resume processing status"""
    current_user_id = get_jwt_identity()
    
    resume = Resume.query.filter_by(
        id=resume_id,
        user_id=current_user_id
    ).first()
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    return jsonify({
        'resume_id': resume.id,
        'filename': resume.filename,
        'status': resume.status,
        'has_skills': bool(resume.skills),
        'skill_count': len(resume.skills) if resume.skills else 0,
        'employability_score': resume.employability_score,
        'created_at': resume.created_at.isoformat(),
        'updated_at': resume.updated_at.isoformat()
    }), 200
# backend/app/routes/resume.py (continued)

@resume_bp.route('/process-all', methods=['POST'])
@jwt_required()
def process_all_resumes():
    """Process all pending resumes for the user"""
    current_user_id = get_jwt_identity()
    
    pending_resumes = Resume.query.filter_by(
        user_id=current_user_id,
        status='pending'
    ).all()
    
    if not pending_resumes:
        return jsonify({
            'message': 'No pending resumes to process'
        }), 200
    
    from app.services.resume_processor import ResumeProcessor
    processor = ResumeProcessor()
    
    processed_count = 0
    for resume in pending_resumes:
        processor.process_resume_async(resume.id)
        processed_count += 1
    
    return jsonify({
        'message': f'Started processing {processed_count} resumes',
        'processed_count': processed_count,
        'total_pending': len(pending_resumes)
    }), 202
           