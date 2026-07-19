# backend/app/api/v1/prediction/routes.py

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Resume, User
from app.api.v1.prediction import prediction_bp
from app.services.prediction_service import PredictionService
from app.services.recommendation_service import RecommendationService
from app.services.cache_service import CacheService

prediction_service = PredictionService()
rec_service = RecommendationService()

@prediction_bp.route('/employability/<int:resume_id>', methods=['GET'])
@jwt_required()
def predict_employability(resume_id):
    """Predict employability from resume"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        resume = Resume.query.filter_by(
            id=resume_id,
            user_id=current_user_id
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Check cache first
        cached_result = CacheService.get_cached_prediction(resume_id)
        if cached_result:
            return jsonify(cached_result), 200
        
        # Prepare student data
        student_data = {
            'cgpa': 7.5,  # Default value
            'skill_count': len(resume.skills) if resume.skills else 0,
            'internship_months': len(resume.experience.get('companies', [])) * 3 if resume.experience else 0,
            'projects': len(resume.projects) if resume.projects else 0,
            'certifications': len(resume.certifications) if resume.certifications else 0,
            'workshops': 0,
            'skill_diversity': len(set(resume.skills)) if resume.skills else 0,
            'department_encoded': 0,
            'cgpa_normalized': 7.5 / 10,
            'total_experience': 0,
            'certification_score': 0,
            'skill_cgpa_ratio': 0,
            'exp_skill_ratio': 0
        }
        
        # Get prediction
        prediction = prediction_service.predict_employability(student_data)
        
        if 'error' in prediction:
            return jsonify({'error': prediction['error']}), 500
        
        result = {
            'resume_id': resume_id,
            'employability_score': resume.employability_score or 50,
            'prediction': prediction
        }
        
        # Cache the result
        CacheService.cache_prediction(resume_id, result)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@prediction_bp.route('/recommendations/<int:resume_id>', methods=['GET'])
@jwt_required()
def get_recommendations(resume_id):
    """Get course and job recommendations"""
    try:
        current_user_id = get_jwt_identity()
        
        resume = Resume.query.filter_by(
            id=resume_id,
            user_id=current_user_id
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        skills = resume.skills or []
        
        # Get recommendations
        courses = rec_service.recommend_courses(skills, limit=5)
        jobs = rec_service.recommend_jobs(skills, limit=5)
        
        return jsonify({
            'courses': courses,
            'jobs': jobs,
            'skill_count': len(skills)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500