from flask import request, jsonify
from app.extensions import db
from app.models import Job
from app.api.v1.jobs import jobs_bp
from app.services.cache_service import cached_response

@jobs_bp.route('', methods=['GET'])
@cached_response(ttl=600, key_prefix='jobs_list')
def get_jobs():
    """Get jobs with caching"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    domain = request.args.get('domain')
    job_type = request.args.get('job_type')
    search = request.args.get('search')
    
    query = Job.query.filter_by(is_active=True)
    
    if domain:
        query = query.filter(Job.domain == domain)
    if job_type:
        query = query.filter(Job.job_type == job_type)
    if search:
        query = query.filter(
            Job.title.contains(search) | 
            Job.company.contains(search)
        )
    
    pagination = query.order_by(Job.posted_date.desc()).paginate(
        page=page, per_page=per_page
    )
    
    return jsonify({
        'jobs': [j.to_dict() for j in pagination.items],
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages
    }), 200

@jobs_bp.route('/domains', methods=['GET'])
@cached_response(ttl=86400, key_prefix='job_domains')
def get_domains():
    """Get all job domains"""
    domains = db.session.query(Job.domain).distinct().all()
    return jsonify({
        'domains': [d[0] for d in domains if d[0]]
    }), 200

@jobs_bp.route('/<int:job_id>', methods=['GET'])
@cached_response(ttl=3600, key_prefix='job_detail')
def get_job(job_id):
    """Get job details"""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(job.to_dict()), 200