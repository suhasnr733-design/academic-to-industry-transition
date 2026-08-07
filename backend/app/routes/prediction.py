# backend/app/routes/prediction.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Resume, Job
from app.services.skill_analyzer import SkillAnalyzer

prediction_bp = Blueprint('prediction', __name__)

@prediction_bp.route('/resume/<int:resume_id>/gap', methods=['GET'])
@jwt_required()
def analyze_skill_gap(resume_id):
    """Analyze skill gaps for a resume"""
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
    
    target_role = request.args.get('target_role')
    domain = request.args.get('domain')
    
    analyzer = SkillAnalyzer()
    gap_analysis = analyzer.analyze_gaps(
        current_skills=resume.skills or [],
        target_role=target_role,
        domain=domain
    )
    
    return jsonify(gap_analysis), 200
# backend/app/routes/prediction.py (continued)

@prediction_bp.route('/resume/<int:resume_id>/match', methods=['GET'])
@jwt_required()
def match_resume_to_jobs(resume_id):
    """Match a resume to job listings"""
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
    
    # Get jobs
    domain = request.args.get('domain')
    query = Job.query
    if domain:
        query = query.filter(Job.domain == domain)
    jobs = query.all()
    
    if not jobs:
        return jsonify({
            'message': 'No jobs found',
            'matches': [],
            'total_matches': 0
        }), 200
    
    # Match
    from app.services.job_matcher import JobMatcher
    matcher = JobMatcher()
    
    matches = matcher.match_jobs(
        student_data={'skills': resume.skills or []},
        jobs_data=[j.to_dict() for j in jobs]
    )
    
    return jsonify({
        'matches': matches[:20],
        'total_matches': len(matches)
    }), 200
# backend/app/routes/prediction.py (continued)

@prediction_bp.route('/resume/<int:resume_id>/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations(resume_id):
    """Get course and learning recommendations"""
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
    
    # Get skill gaps from resume or analyze
    gaps = resume.skill_gaps or []
    
    # If no gaps stored, analyze
    if not gaps:
        analyzer = SkillAnalyzer()
        # Get target skills
        target_role = request.args.get('target_role', 'Software Engineer')
        analysis = analyzer.analyze_gaps(
            current_skills=resume.skills or [],
            target_role=target_role
        )
        gaps = analysis.get('missing_skills', [])
    
    analyzer = SkillAnalyzer()
    recommendations = analyzer.get_recommendations(
        skills=resume.skills or [],
        gaps=gaps
    )
    
    return jsonify(recommendations), 200