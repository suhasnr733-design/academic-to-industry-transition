# backend/app/api/v1/assessment/routes.py

import json
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.api.v1.assessment import assessment_bp
from app.models import Resume, AssessmentResult, User
from app.services.assessment_service import AssessmentService

@assessment_bp.route('/start', methods=['GET'])
@jwt_required()
def start_assessment():
    """
    Generate a dynamic skill assessment based on skills extracted from the user's uploaded resumes.
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Aggregate all unique skills across the user's active resumes
        user_resumes = Resume.query.filter_by(user_id=user_id).order_by(Resume.created_at.desc()).all()
        extracted_skills = []
        for r in user_resumes:
            if r.skills:
                for s in r.skills:
                    if s and s not in extracted_skills:
                        extracted_skills.append(s)

        assessment_session = AssessmentService.generate_assessment(extracted_skills, total_questions=6)
        
        return jsonify({
            'success': True,
            'session': assessment_session
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
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
        latest = AssessmentResult.query.filter_by(user_id=user_id)\
            .order_by(AssessmentResult.created_at.desc())\
            .first()
            
        if not latest:
            return jsonify({
                'has_assessment': False,
                'result': None
            }), 200
            
        return jsonify({
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
        }), 200

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
