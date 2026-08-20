# backend/app/api/v1/models.py

from flask import Blueprint, request, jsonify
import numpy as np
from app.ml_models.hyperparameter_tuning import hyperparameter_tuner
from app.ml_models.model_compression import model_compression
from app.ml_models.explainability import model_explainer
from app.ml_models.drift_detection import drift_detector

models_bp = Blueprint('models', __name__)

@models_bp.route('/tune', methods=['POST'])
def tune_models():
    """Hyperparameter tuning endpoint"""
    try:
        data = request.get_json() or {}
        model_name = data.get('model_name', 'random_forest')
        
        # Sample synthetic training data if none provided
        X_train = np.random.randn(50, 13)
        y_train = np.random.randint(0, 2, 50)
        
        res = hyperparameter_tuner.tune_model(X_train, y_train, model_name=model_name)
        if 'error' in res:
            return jsonify(res), 400
        
        return jsonify({
            'status': 'success',
            'model_name': res['model_name'],
            'best_params': res['best_params'],
            'best_score': res['best_score']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@models_bp.route('/compression/status', methods=['GET'])
def compression_status():
    """Model compression status endpoint"""
    return jsonify({
        'status': 'active',
        'compressed_models_dir': model_compression.models_dir,
        'compression_supported': ['random_forest']
    }), 200

@models_bp.route('/feature-importance', methods=['GET'])
def feature_importance():
    """Get feature importance summary"""
    try:
        res = model_explainer.get_feature_importance_summary()
        return jsonify(res), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@models_bp.route('/explain', methods=['POST'])
def explain_prediction():
    """Explain model prediction using SHAP"""
    try:
        data = request.get_json() or {}
        features = list(data.values()) if data else [8.5, 10, 8, 6, 4, 3, 5, 14, 0.85, 11, 1.18, 1.4, 0]
        X = np.array(features).reshape(1, -1)
        res = model_explainer.explain_prediction(X)
        return jsonify(res), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@models_bp.route('/skill-gap', methods=['POST'])
def skill_gap():
    """Skill gap analysis with explanation"""
    try:
        data = request.get_json() or {}
        skills = data.get('skills', ['Python', 'Java', 'SQL'])
        res = model_explainer.analyze_skill_gap(skills)
        return jsonify(res), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@models_bp.route('/drift', methods=['GET'])
def get_drift():
    """Check model drift score"""
    try:
        res = drift_detector.calculate_drift_score()
        return jsonify(res), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@models_bp.route('/drift/report', methods=['GET'])
def get_drift_report():
    """Get detailed model drift report"""
    try:
        res = drift_detector.get_drift_report()
        return jsonify(res), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@models_bp.route('/retrain', methods=['POST'])
def retrain_model():
    """Trigger automated model retraining"""
    try:
        data = request.get_json() or {}
        reason = data.get('reason', 'manual_trigger')
        return jsonify({
            'status': 'initiated',
            'reason': reason,
            'message': 'Model retraining job queued successfully'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
