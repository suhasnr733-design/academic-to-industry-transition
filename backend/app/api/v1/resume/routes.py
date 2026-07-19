import os
import uuid
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models import User, Resume
from app.api.v1.resume import resume_bp

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
# backend/app/api/v1/resume/routes.py (Update)

@resume_bp.route('/batch-process', methods=['POST'])
@jwt_required()
def batch_process_resumes():
    """Process multiple resumes in batch"""
    current_user_id = get_jwt_identity()
    
    data = request.get_json()
    if not data or 'resume_ids' not in data:
        return jsonify({'error': 'resume_ids required'}), 400
    
    resume_ids = data['resume_ids']
    
    # Verify all resumes belong to user
    resumes = Resume.query.filter(
        Resume.id.in_(resume_ids),
        Resume.user_id == current_user_id
    ).all()
    
    if len(resumes) != len(resume_ids):
        return jsonify({'error': 'Some resumes not found'}), 404
    
    from app.services.resume_processor import ResumeProcessor
    processor = ResumeProcessor()
    
    result = processor.process_batch(resume_ids)
    
    return jsonify({
        'message': f'Processing {result["processed"]} resumes',
        'processed': result['processed']
    }), 202

@resume_bp.route('/<int:resume_id>/reprocess', methods=['POST'])
@jwt_required()
def reprocess_resume(resume_id):
    """Reprocess an existing resume"""
    current_user_id = get_jwt_identity()
    
    resume = Resume.query.filter_by(
        id=resume_id,
        user_id=current_user_id
    ).first()
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    # Reset status
    resume.status = 'pending'
    resume.skills = []
    resume.employability_score = None
    resume.skill_gaps = []
    db.session.commit()
    
    from app.services.resume_processor import ResumeProcessor
    processor = ResumeProcessor()
    processor.process_resume_async(resume_id)
    
    return jsonify({
        'message': 'Resume reprocessing started',
        'resume_id': resume_id
    }), 202    
