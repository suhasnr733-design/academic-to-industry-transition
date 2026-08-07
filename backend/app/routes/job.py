# backend/app/routes/job.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Job
from datetime import datetime

job_bp = Blueprint('job', __name__)

@job_bp.route('', methods=['GET'])
def get_jobs():
    """Get jobs with filtering"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    domain = request.args.get('domain')
    job_type = request.args.get('job_type')
    search = request.args.get('search')
    
    query = Job.query
    
    if domain:
        query = query.filter(Job.domain == domain)
    if job_type:
        query = query.filter(Job.job_type == job_type)
    if search:
        query = query.filter(
            Job.title.contains(search) | 
            Job.company.contains(search)
        )
    
    pagination = query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'jobs': [j.to_dict() for j in pagination.items],
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages
    }), 200

@job_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get job details"""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(job.to_dict()), 200

@job_bp.route('/domains', methods=['GET'])
def get_domains():
    """Get all job domains"""
    domains = db.session.query(Job.domain).distinct().all()
    return jsonify({
        'domains': [d[0] for d in domains if d[0]]
    }), 200
# backend/app/routes/job.py (continued)

@job_bp.route('/import', methods=['POST'])
@jwt_required()
def import_jobs():
    """Import jobs from JSON data"""
    data = request.get_json()
    
    if 'jobs' not in data:
        return jsonify({'error': 'Jobs data required'}), 400
    
    imported = 0
    for job_data in data['jobs']:
        # Check if job already exists
        existing = Job.query.filter_by(
            title=job_data.get('title'),
            company=job_data.get('company')
        ).first()
        
        if existing:
            continue
        
        job = Job(
            title=job_data.get('title'),
            company=job_data.get('company'),
            description=job_data.get('description'),
            required_skills=job_data.get('required_skills', []),
            experience_required=job_data.get('experience_required'),
            location=job_data.get('location'),
            salary_range=job_data.get('salary_range'),
            job_type=job_data.get('job_type'),
            domain=job_data.get('domain'),
            source=job_data.get('source'),
            source_url=job_data.get('source_url'),
            posted_date=datetime.fromisoformat(job_data['posted_date']) 
                if job_data.get('posted_date') 
                else datetime.utcnow()
        )
        db.session.add(job)
        imported += 1
    
    db.session.commit()
    
    return jsonify({
        'message': f'Imported {imported} jobs successfully',
        'imported': imported
    }), 201