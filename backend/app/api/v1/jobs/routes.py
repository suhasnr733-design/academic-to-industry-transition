from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Job, JobInterest, User, MentorshipRequest
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
    location = request.args.get('location')
    job_type = request.args.get('job_type')
    search = request.args.get('search')
    source = request.args.get('source')
    
    query = Job.query.filter_by(is_active=True)
    
    if domain:
        query = query.filter(Job.domain == domain)
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if job_type:
        query = query.filter(Job.job_type == job_type)
    if source and source != 'all':
        query = query.filter(Job.source == source)
    if search:
        search_terms = [t.strip() for t in search.strip().split() if t.strip()]
        for term in search_terms:
            term_pat = f"%{term}%"
            query = query.filter(
                db.or_(
                    Job.title.ilike(term_pat),
                    Job.company.ilike(term_pat),
                    Job.location.ilike(term_pat),
                    Job.domain.ilike(term_pat),
                    Job.description.ilike(term_pat),
                    db.cast(Job.required_skills, db.String).ilike(term_pat)
                )
            )
    
    pagination = query.order_by(Job.posted_date.desc()).paginate(page=page, per_page=per_page)
    
    # Compute aggregate campus interest counts for this page batch
    job_ids = [j.id for j in pagination.items if j.id]
    interest_counts = {}
    if job_ids:
        counts = db.session.query(
            JobInterest.job_id,
            db.func.count(JobInterest.id)
        ).filter(JobInterest.job_id.in_(job_ids)).group_by(JobInterest.job_id).all()
        interest_counts = {cid: cnt for cid, cnt in counts}

    results = []
    for j in pagination.items:
        d = j.to_dict()
        d['campus_interest_count'] = interest_counts.get(j.id, 0)
        results.append(d)

    return jsonify({
        'jobs': results,
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages
    }), 200

@jobs_bp.route('/interested', methods=['GET'])
@jwt_required()
def get_interested_jobs():
    """Get all jobs marked as interested / saved by the authenticated student"""
    current_user_id = int(get_jwt_identity())
    status_filter = request.args.get('status')

    query = JobInterest.query.filter_by(user_id=current_user_id)
    if status_filter:
        query = query.filter_by(status=status_filter)

    interests = query.order_by(JobInterest.created_at.desc()).all()
    return jsonify({
        'status': 'success',
        'count': len(interests),
        'interests': [i.to_dict() for i in interests]
    }), 200

@jobs_bp.route('/interested', methods=['POST'])
@jwt_required()
def add_or_toggle_job_interest():
    """Save or toggle student interest in a job (internal or external)"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    job_id = data.get('job_id')
    external_job_id = data.get('external_job_id')
    job_title = data.get('job_title') or data.get('title')
    company = data.get('company')
    job_data = data.get('job_data') or data
    status = data.get('status', 'interested')
    notes = data.get('notes')

    # If internal job_id provided, fetch details from DB
    if job_id:
        job = db.session.get(Job, job_id)
        if job:
            job_title = job_title or job.title
            company = company or job.company
            job_data = job.to_dict()

    if not job_title or not company:
        return jsonify({'error': 'Job title and company are required'}), 400

    # Check if existing interest exists
    existing = None
    if job_id:
        existing = JobInterest.query.filter_by(user_id=current_user_id, job_id=job_id).first()
    elif external_job_id:
        existing = JobInterest.query.filter_by(user_id=current_user_id, external_job_id=external_job_id).first()
    else:
        existing = JobInterest.query.filter_by(user_id=current_user_id, job_title=job_title, company=company).first()

    if existing:
        # Toggle: remove if already interested or update status
        action = data.get('action')
        if action == 'remove':
            db.session.delete(existing)
            db.session.commit()
            return jsonify({'message': 'Job interest removed', 'is_interested': False, 'id': existing.id}), 200
        
        # Update existing
        if 'status' in data:
            existing.status = status
        if notes is not None:
            existing.notes = notes
        db.session.commit()
        return jsonify({
            'message': 'Job interest updated',
            'is_interested': True,
            'interest': existing.to_dict()
        }), 200

    new_interest = JobInterest(
        user_id=current_user_id,
        job_id=job_id,
        external_job_id=external_job_id,
        job_title=job_title,
        company=company,
        job_data=job_data,
        status=status,
        notes=notes
    )
    db.session.add(new_interest)
    db.session.commit()

    return jsonify({
        'message': 'Job saved to Campus Board',
        'is_interested': True,
        'interest': new_interest.to_dict()
    }), 201

@jobs_bp.route('/interested/<int:interest_id>', methods=['DELETE'])
@jwt_required()
def delete_job_interest(interest_id):
    """Delete a saved job interest"""
    current_user_id = int(get_jwt_identity())
    interest = JobInterest.query.filter_by(id=interest_id, user_id=current_user_id).first()
    if not interest:
        return jsonify({'error': 'Job interest record not found'}), 404

    db.session.delete(interest)
    db.session.commit()
    return jsonify({'message': 'Job interest removed successfully', 'id': interest_id}), 200

@jobs_bp.route('/interested/<int:interest_id>/status', methods=['PATCH'])
@jwt_required()
def update_interest_status(interest_id):
    """Update pipeline application status (interested, applied, interviewing, shortlisted, offer)"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    new_status = data.get('status')
    notes = data.get('notes')

    interest = JobInterest.query.filter_by(id=interest_id, user_id=current_user_id).first()
    if not interest:
        return jsonify({'error': 'Job interest record not found'}), 404

    if new_status:
        valid_statuses = ['interested', 'applied', 'interviewing', 'shortlisted', 'rejected', 'offer']
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Allowed: {valid_statuses}'}), 400
        interest.status = new_status

    if notes is not None:
        interest.notes = notes

    db.session.commit()
    return jsonify({
        'message': 'Status updated successfully',
        'interest': interest.to_dict()
    }), 200

@jobs_bp.route('/campus-board', methods=['GET'])
def get_campus_board():
    """Get aggregated campus board opportunities with student interest counts"""
    # 1. Fetch campus jobs
    campus_jobs = Job.query.filter_by(is_active=True).order_by(Job.posted_date.desc()).limit(50).all()
    
    # 2. Compute interest count per job
    job_ids = [j.id for j in campus_jobs]
    interest_counts = {}
    if job_ids:
        counts = db.session.query(
            JobInterest.job_id,
            db.func.count(JobInterest.id)
        ).filter(JobInterest.job_id.in_(job_ids)).group_by(JobInterest.job_id).all()
        interest_counts = {cid: cnt for cid, cnt in counts}

    results = []
    for j in campus_jobs:
        d = j.to_dict()
        d['campus_interest_count'] = interest_counts.get(j.id, 0)
        results.append(d)

    return jsonify({
        'status': 'success',
        'total': len(results),
        'campus_jobs': results
    }), 200

@jobs_bp.route('/live', methods=['GET'])
def get_live_jobs():
    """Fetch live real-time jobs on-demand from Remotive, Arbeitnow, and JSearch"""
    search = request.args.get('search', 'Software Engineer')
    location = request.args.get('location')
    page = request.args.get('page', 1, type=int)
    if not page or page < 1:
        page = 1
    limit = request.args.get('limit', 25, type=int)
    sources = request.args.getlist('source') or ['all']

    aggregator = JobAggregatorService()
    live_jobs = aggregator.search_all_jobs(
        query=search,
        location=location,
        sources=sources,
        total_limit=limit,
        page=page
    )

    return jsonify({
        'status': 'success',
        'count': len(live_jobs),
        'page': page,
        'has_more': len(live_jobs) >= limit,
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

@jobs_bp.route('/<string:job_id>', methods=['GET'])
def get_job(job_id):
    """Get job details by internal ID, external provider ID, or saved pipeline snapshot"""
    job = None
    if job_id.isdigit():
        job = db.session.get(Job, int(job_id))
    if not job:
        job = Job.query.filter_by(external_id=job_id).first()
    if not job:
        job = Job.query.filter(Job.external_id.ilike(f"%{job_id}%")).first()
    
    if job:
        return jsonify(job.to_dict()), 200

    # Fallback: Check JobInterest pipeline for saved snapshot of this live job
    interest = JobInterest.query.filter(
        (JobInterest.external_job_id == job_id) | (JobInterest.external_job_id.ilike(f"%{job_id}%"))
    ).first()
    if interest and interest.job_data:
        data = dict(interest.job_data)
        data['id'] = job_id
        data['external_id'] = job_id
        data['title'] = interest.job_title
        data['company'] = interest.company
        data['is_live'] = True
        return jsonify(data), 200

    return jsonify({'error': 'Opportunity not found or has expired'}), 404


@jobs_bp.route('/<string:job_id>/interested-mentees', methods=['GET'])
@jwt_required()
def get_job_interested_mentees(job_id):
    """Get accepted mentees of the authenticated faculty member who are interested in this job"""
    try:
        current_user_id = int(get_jwt_identity())
        faculty = db.session.get(User, current_user_id)

        if not faculty or faculty.role not in ['faculty', 'admin']:
            return jsonify({'error': 'Faculty access required'}), 403

        job = None
        if job_id.isdigit():
            job = db.session.get(Job, int(job_id))
        if not job:
            job = Job.query.filter_by(external_id=job_id).first()
        if not job:
            return jsonify({'error': 'Job not found'}), 404

        # Query accepted mentees of this faculty who marked interest in this job or company/title
        query = (
            db.session.query(User, JobInterest)
            .join(MentorshipRequest, MentorshipRequest.student_id == User.id)
            .join(JobInterest, JobInterest.user_id == User.id)
            .filter(
                MentorshipRequest.faculty_id == faculty.id,
                MentorshipRequest.status == 'accepted',
                (
                    (JobInterest.job_id == job_id) |
                    ((JobInterest.company.ilike(job.company)) & (JobInterest.job_title.ilike(job.title)))
                )
            )
            .order_by(JobInterest.created_at.desc())
        )

        results = []
        for student, interest in query.all():
            results.append({
                'student_id': student.id,
                'full_name': student.full_name,
                'username': student.username,
                'email': student.email,
                'department': student.department,
                'year_of_study': student.year_of_study,
                'placement_status': student.placement_status,
                'placed_company': student.placed_company,
                'interest_status': interest.status,
                'interest_id': interest.id,
                'notes': interest.notes,
                'created_at': interest.created_at.isoformat() if interest.created_at else None
            })

        return jsonify({
            'status': 'success',
            'job_id': job_id,
            'job_title': job.title,
            'company': job.company,
            'total_mentees': len(results),
            'mentees': results
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch interested mentees', 'message': str(e)}), 500


@jobs_bp.route('/company/<string:company_name>/interested-mentees', methods=['GET'])
@jwt_required()
def get_company_interested_mentees(company_name):
    """Get accepted mentees of the authenticated faculty member interested in a company"""
    try:
        current_user_id = int(get_jwt_identity())
        faculty = db.session.get(User, current_user_id)

        if not faculty or faculty.role not in ['faculty', 'admin']:
            return jsonify({'error': 'Faculty access required'}), 403

        query = (
            db.session.query(User, JobInterest)
            .join(MentorshipRequest, MentorshipRequest.student_id == User.id)
            .join(JobInterest, JobInterest.user_id == User.id)
            .filter(
                MentorshipRequest.faculty_id == faculty.id,
                MentorshipRequest.status == 'accepted',
                JobInterest.company.ilike(f"%{company_name}%")
            )
            .order_by(JobInterest.created_at.desc())
        )

        results = []
        for student, interest in query.all():
            results.append({
                'student_id': student.id,
                'full_name': student.full_name,
                'username': student.username,
                'email': student.email,
                'department': student.department,
                'year_of_study': student.year_of_study,
                'placement_status': student.placement_status,
                'job_title': interest.job_title,
                'company': interest.company,
                'interest_status': interest.status,
                'interest_id': interest.id,
                'notes': interest.notes,
                'created_at': interest.created_at.isoformat() if interest.created_at else None
            })

        return jsonify({
            'status': 'success',
            'company': company_name,
            'total_mentees': len(results),
            'mentees': results
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch company interested mentees', 'message': str(e)}), 500


