# backend/app/api/v1/jobs/routes.py

from flask import request, jsonify
from app import db
from app.models import Job
from app.api.v1.jobs import jobs_bp
from app.services.multilevel_cache import cache
from app.services.job_aggregator import JobAggregatorService
from app.tasks.job_sync_task import sync_live_jobs_to_db

@jobs_bp.route('', methods=['GET'])
@cache.cache(ttl=60, key_prefix='jobs_list')
def get_jobs():
    """Get list of active jobs with pagination and filtering"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    domain = request.args.get('domain')
    job_type = request.args.get('job_type')
    search = request.args.get('search')
    source = request.args.get('source')
    
    query = Job.query.filter_by(is_active=True)
    
    if domain:
        query = query.filter(Job.domain == domain)
    if job_type:
        query = query.filter(Job.job_type == job_type)
    if source and source != 'all':
        query = query.filter(Job.source == source)
    if search:
        query = query.filter(
            Job.title.contains(search) | 
            Job.company.contains(search)
        )
    
    pagination = query.order_by(Job.posted_date.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'jobs': [j.to_dict() for j in pagination.items],
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages
    }), 200

@jobs_bp.route('/live', methods=['GET'])
def get_live_jobs():
    """Fetch live real-time jobs on-demand from Remotive, Arbeitnow, and JSearch"""
    search = request.args.get('search', 'Software Engineer')
    location = request.args.get('location')
    limit = request.args.get('limit', 20, type=int)
    sources = request.args.getlist('source') or ['all']

    aggregator = JobAggregatorService()
    live_jobs = aggregator.search_all_jobs(
        query=search,
        location=location,
        sources=sources,
        total_limit=limit
    )

    return jsonify({
        'status': 'success',
        'count': len(live_jobs),
        'is_live': True,
        'jobs': live_jobs
    }), 200

@jobs_bp.route('/live/match', methods=['GET', 'POST'])
def match_live_jobs():
    """Match live real-time jobs with student skills or resume ID"""
    data = request.get_json(silent=True) or {}
    
    resume_id = request.args.get('resume_id', type=int) or data.get('resume_id')
    skills = data.get('skills') or request.args.getlist('skill') or []
    domain = request.args.get('domain') or data.get('domain')
    location = request.args.get('location') or data.get('location')
    limit = request.args.get('limit', 15, type=int)

    aggregator = JobAggregatorService()

    if resume_id:
        matches = aggregator.match_live_jobs_for_resume(
            resume_id=resume_id,
            location=location,
            limit=limit
        )
    else:
        matches = aggregator.match_live_jobs_with_student(
            student_skills=skills,
            domain=domain,
            location=location,
            limit=limit
        )

    return jsonify({
        'status': 'success',
        'count': len(matches),
        'is_live': True,
        'matches': matches
    }), 200

@jobs_bp.route('/sync', methods=['POST'])
def trigger_job_sync():
    """Manually trigger background sync of external live jobs into the database"""
    summary = sync_live_jobs_to_db()
    return jsonify({
        'status': 'success',
        'message': 'Live jobs synchronized into database',
        'summary': summary
    }), 200

@jobs_bp.route('/domains', methods=['GET'])
def get_domains():
    """Get all distinct job domains"""
    domains = db.session.query(Job.domain).distinct().all()
    return jsonify({
        'domains': [d[0] for d in domains if d[0]]
    }), 200

@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get job details by ID"""
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(job.to_dict()), 200
