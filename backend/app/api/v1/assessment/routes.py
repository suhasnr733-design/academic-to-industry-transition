# backend/app/api/v1/assessment/routes.py

import json
import time
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import defer
from app import db
from app.api.v1.assessment import assessment_bp
from app.models import Resume, AssessmentResult, User
from app.services.assessment_service import AssessmentService

# Optimization 1: In-memory cache for user's latest assessment result
# Structure: { user_id: {'data': dict, 'timestamp': float} }
_latest_assessment_cache = {}
ASSESSMENT_CACHE_TTL = 600  # 10 minutes lifespan

def invalidate_assessment_cache(user_id=None):
    """Invalidate cached assessment results for a specific user or all users."""
    global _latest_assessment_cache
    if user_id is not None:
        _latest_assessment_cache.pop(user_id, None)
    else:
        _latest_assessment_cache.clear()


@assessment_bp.route('/start', methods=['GET'])
@jwt_required()
def start_assessment():
    """
    Generate a dynamic progressive skill assessment based strictly on skills extracted from the user's uploaded resumes.
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Strictly fetch the single most recently uploaded resume for the user
        # Optimization 4: Defer heavy unneeded JSON and text columns
        latest_resume = Resume.query.options(
            defer(Resume.summary),
            defer(Resume.ats_breakdown),
            defer(Resume.personal_info),
            defer(Resume.links),
            defer(Resume.education),
            defer(Resume.experience),
            defer(Resume.projects),
            defer(Resume.certifications),
            defer(Resume.achievements),
            defer(Resume.publications),
            defer(Resume.error_message)
        ).filter_by(user_id=user_id).order_by(Resume.created_at.desc()).first()
        
        if not latest_resume or not latest_resume.skills or len(latest_resume.skills) == 0:
            return jsonify({
                'success': False,
                'requires_resume': True,
                'error': 'No resume with extracted skills found. Please upload and analyze your resume first before taking the skill assessment.'
            }), 400

        extracted_skills = [s for s in latest_resume.skills if s and isinstance(s, str)]

        assessment_session = AssessmentService.generate_assessment(extracted_skills)
        if not assessment_session.get('success'):
            return jsonify(assessment_session), 400
        
        return jsonify({
            'success': True,
            'requires_resume': False,
            'session': assessment_session
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'requires_resume': False,
            'error': str(e)
        }), 500

@assessment_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_assessment():
    """
    Evaluate user assessment submission and persist results to the database.
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        answers = data.get('answers', {})
        time_taken = int(data.get('time_taken', 0))
        
        evaluation = AssessmentService.evaluate_submission(answers, time_taken_seconds=time_taken)
        
        # Save to database
        result_record = AssessmentResult(
            user_id=user_id,
            assessment_type='skill_assessment',
            score=evaluation['score'],
            total_questions=evaluation['total_questions'],
            correct_answers=evaluation['correct_answers'],
            time_taken=time_taken,
            responses=evaluation
        )
        
        db.session.add(result_record)
        db.session.commit()
        
        # Optimization 1: Invalidate cache so new attempt is reflected immediately
        invalidate_assessment_cache(user_id)
        
        return jsonify({
            'success': True,
            'result_id': result_record.id,
            'result': {
                'id': result_record.id,
                **evaluation,
                'created_at': result_record.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@assessment_bp.route('/latest', methods=['GET'])
@jwt_required()
def get_latest_assessment():
    """
    Fetch the authenticated user's most recent assessment attempt.
    """
    try:
        user_id = int(get_jwt_identity())
        now = time.time()

        # Optimization 1: Check in-memory cache for instant 0.0ms response
        if user_id in _latest_assessment_cache:
            entry = _latest_assessment_cache[user_id]
            if now - entry['timestamp'] < ASSESSMENT_CACHE_TTL:
                cached_data = dict(entry['data'])
                cached_data['cached'] = True
                return jsonify(cached_data), 200

        latest = AssessmentResult.query.filter_by(user_id=user_id)\
            .order_by(AssessmentResult.created_at.desc())\
            .first()
            
        if not latest:
            response_data = {
                'has_assessment': False,
                'result': None
            }
        else:
            response_data = {
                'has_assessment': True,
                'result': {
                    'id': latest.id,
                    'score': latest.score,
                    'percentage': latest.score,
                    'total_questions': latest.total_questions,
                    'correct_answers': latest.correct_answers,
                    'time_taken': latest.time_taken,
                    'created_at': latest.created_at.isoformat(),
                    'details': latest.responses if isinstance(latest.responses, dict) else {}
                }
            }

        # Optimization 1: Store in-memory cache
        _latest_assessment_cache[user_id] = {
            'data': response_data,
            'timestamp': now
        }

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@assessment_bp.route('/history', methods=['GET'])
@jwt_required()
def get_assessment_history():
    """
    Retrieve all historical assessment records for the authenticated user.
    """
    try:
        user_id = int(get_jwt_identity())
        results = AssessmentResult.query.filter_by(user_id=user_id)\
            .order_by(AssessmentResult.created_at.desc())\
            .all()
            
        return jsonify({
            'success': True,
            'count': len(results),
            'history': [r.to_dict() for r in results]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
