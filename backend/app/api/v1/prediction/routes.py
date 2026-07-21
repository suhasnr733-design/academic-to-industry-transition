from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Resume
from app.api.v1.prediction import prediction_bp

@prediction_bp.route('/employability/<int:resume_id>', methods=['GET'])
@jwt_required()
def predict_employability(resume_id):
    resume = Resume.query.filter_by(id=resume_id, user_id=get_jwt_identity()).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    score = len(resume.skills or []) * 5 if resume.skills else 0
    score = min(score, 100)
    
    return jsonify({
        'score': score,
        'level': 'High' if score > 70 else 'Medium' if score > 40 else 'Low',
        'skills': resume.skills or []
    }), 200
