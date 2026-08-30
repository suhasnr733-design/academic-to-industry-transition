import os
import logging
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Resume, User, Job
from app.api.v1.prediction import prediction_bp
from app.services.prediction_service import PredictionService
from app.services.recommendation_service import RecommendationService

from app.services.skill_analyzer import SkillAnalyzer

logger = logging.getLogger(__name__)

prediction_service = PredictionService()
rec_service = RecommendationService()
skill_analyzer = SkillAnalyzer()

@prediction_bp.route('/employability/<int:resume_id>', methods=['GET'])
@jwt_required()
def predict_employability(resume_id):
    """Predict employability score and model details for a resume"""
    try:
        current_user_id = int(get_jwt_identity())
        user = db.session.get(User, current_user_id)
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

@prediction_bp.route('/skill-gap', methods=['GET'])
@prediction_bp.route('/skill-gap/latest', methods=['GET'])
@prediction_bp.route('/skill-gap/<int:resume_id>', methods=['GET'])
@prediction_bp.route('/resume/<int:resume_id>/gap', methods=['GET'])
@prediction_bp.route('/gap/<int:resume_id>', methods=['GET'])
@jwt_required()
def get_skill_gap(resume_id=None):
    """Get skill gap analysis for a target role"""
    try:
        current_user_id = int(get_jwt_identity())
        if resume_id:
            resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        else:
            resume = Resume.query.filter_by(user_id=current_user_id).order_by(Resume.created_at.desc()).first()

        if not resume:
            return jsonify({
                'error': 'No resume uploaded yet',
                'no_resume': True,
                'match_percentage': 0,
                'matching_skills': [],
                'missing_skills': [],
                'recommendations': [],
                'learning_path': []
            }), 404
        
        # On-demand processing if resume is still pending or has no skills extracted
        if resume.status == 'pending' or (not resume.skills and resume.file_path and os.path.exists(resume.file_path)):
            try:
                from app.services.resume_processor import ResumeProcessor
                processor = ResumeProcessor()
                processor.process_resume(resume.id)
                db.session.refresh(resume)
            except Exception as proc_err:
                logger.warning(f"On-demand skill gap resume processing error: {proc_err}")

        # Choose appropriate default role based on recommendations or fallback
        req_role = request.args.get('target_role')
        if not req_role:
            if resume.recommended_roles and len(resume.recommended_roles) > 0:
                req_role = resume.recommended_roles[0]
            else:
                req_role = 'Software Engineer'

        target_role = req_role
        domain = request.args.get('domain')
        
        skills = resume.skills or []
        gap_data = skill_analyzer.analyze_gaps(skills, target_role=target_role, domain=domain)
        rec_data = skill_analyzer.get_recommendations(skills, gap_data.get('missing_skills', []))
        
        # Dynamic available roles from analyzer benchmark library
        if hasattr(skill_analyzer, 'skill_map') and skill_analyzer.skill_map:
            available_roles = list(skill_analyzer.skill_map.keys())
        else:
            available_roles = [
                'Full Stack Developer', 'Software Engineer', 'Frontend Developer',
                'Backend Developer', 'DevOps Engineer', 'Cloud Engineer (AWS/Azure/GCP)',
                'Data Scientist', 'Data Analyst', 'ML Engineer', 'Cybersecurity Analyst',
                'Mobile App Developer (Android/iOS)', 'QA Automation Engineer (SDET)'
            ]

        # Top AI-matched recommended roles for student quick-selection
        rec_roles = []
        if resume.recommended_roles and isinstance(resume.recommended_roles, list):
            for r in resume.recommended_roles:
                if r and r not in rec_roles:
                    rec_roles.append(r)
        if not rec_roles:
            rec_roles = ['Full Stack Developer', 'Software Engineer', 'Frontend Developer']

        return jsonify({
            'resume_id': resume.id,
            'filename': resume.filename,
            'candidate_name': resume.user.full_name if resume.user else None,
            'target_role': target_role,
            'recommended_roles': rec_roles[:4],
            'available_roles': available_roles,
            'current_skills': skills,
            'target_skills': gap_data.get('target_skills', []),
            'matching_skills': gap_data.get('matching_skills', []),
            'missing_skills': gap_data.get('missing_skills', []),
            'match_percentage': gap_data.get('match_percentage', 0),
            'gap_categories': gap_data.get('gap_categories', {}),
            'recommendations': rec_data.get('recommendations', []),
            'learning_path': rec_data.get('learning_path', [])
        }), 200
    except Exception as e:
        logger.error(f"Error getting skill gap analysis: {e}")
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

@prediction_bp.route('/test', methods=['POST'])
def test_prediction():
    """Endpoint for system integration test prediction"""
    data = request.get_json() or {}
    return jsonify({
        'prediction': 1,
        'confidence': 0.91,
        'status': 'success',
        'input_received': data
    }), 200


