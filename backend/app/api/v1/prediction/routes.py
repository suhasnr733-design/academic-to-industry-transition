# backend/app/api/v1/prediction/routes.py

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Resume, User, Job
from app.api.v1.prediction import prediction_bp
from app.services.prediction_service import PredictionService
from app.services.recommendation_service import RecommendationService

prediction_service = PredictionService()
rec_service = RecommendationService()

@prediction_bp.route('/employability/<int:resume_id>', methods=['GET'])
@jwt_required()
def predict_employability(resume_id):
    """Predict employability score and model details for a resume"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        skills = resume.skills or []
        skill_count = len(skills)
        skill_diversity = len(set(skills))
        projects_count = len(resume.projects) if resume.projects else 0
        certifications_count = len(resume.certifications) if resume.certifications else 0
        
        student_data = {
            'cgpa': 7.5,
            'skill_count': skill_count,
            'skill_diversity': skill_diversity,
            'internship_months': 3 if resume.experience else 0,
            'projects': projects_count,
            'certifications': certifications_count,
            'workshops': 1,
            'total_experience': 3 + projects_count * 2,
            'cgpa_normalized': 0.75,
            'certification_score': certifications_count * 2 + 1,
            'skill_cgpa_ratio': skill_count / 8.5,
            'exp_skill_ratio': (3 + projects_count * 2) / (skill_count + 1),
            'department_encoded': 0
        }
        
        prediction = prediction_service.predict_employability(student_data)
        
        if 'confidence' in prediction:
            score = round(prediction['confidence'], 2)
        else:
            score = min(round(50 + skill_count * 5 + projects_count * 5, 2), 98.0)
            prediction = {
                'employable': score >= 60,
                'confidence': score,
                'probabilities': {
                    'not_employable': round((100 - score) / 100, 2),
                    'employable': round(score / 100, 2)
                }
            }
        
        resume.employability_score = score
        db.session.commit()
        
        return jsonify({
            'resume_id': resume_id,
            'employability_score': score,
            'prediction': prediction
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@prediction_bp.route('/recommendations/<int:resume_id>', methods=['GET'])
@prediction_bp.route('/resume/<int:resume_id>/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations(resume_id):
    """Get course and job recommendations for a resume"""
    try:
        current_user_id = int(get_jwt_identity())
        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        skills = resume.skills or []
        courses = rec_service.recommend_courses(skills, limit=5)
        jobs = rec_service.recommend_jobs(skills, limit=5)
        
        return jsonify({
            'courses': courses,
            'jobs': jobs,
            'recommendations': courses,
            'total_recommendations': len(courses),
            'skill_count': len(skills)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@prediction_bp.route('/resume/<int:resume_id>/gap', methods=['GET'])
@jwt_required()
def get_skill_gap(resume_id):
    """Get skill gap analysis for a target role"""
    try:
        current_user_id = int(get_jwt_identity())
        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        target_role = request.args.get('target_role', 'Software Engineer')
        current_skills = resume.skills or ['Python', 'SQL', 'Git']
        target_skills = ['Python', 'Machine Learning', 'SQL', 'Docker', 'AWS']
        missing_skills = [s for s in target_skills if s not in current_skills]
        
        return jsonify({
            'target_role': target_role,
            'current_skills': current_skills,
            'target_skills': target_skills,
            'missing_skills': missing_skills,
            'match_percentage': round(((len(target_skills) - len(missing_skills)) / len(target_skills)) * 100, 2)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@prediction_bp.route('/resume/<int:resume_id>/match', methods=['GET'])
@jwt_required()
def match_jobs(resume_id):
    """Get matching jobs for a resume"""
    try:
        current_user_id = int(get_jwt_identity())
        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        jobs = Job.query.filter_by(is_active=True).all()
        matches = [job.to_dict() for job in jobs]
        
        return jsonify({
            'matches': matches,
            'total_matches': len(matches)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
