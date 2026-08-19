# backend/tests/test_model.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import joblib
import numpy as np


def _get_model_dir():
    """Return path to data/models relative to project root."""
    # Project root is two levels above this file's directory (backend/tests/ -> project root)
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    return os.path.join(project_root, 'data', 'models')


def test_model():
    """Test the trained ensemble model loads and produces valid predictions."""
    model_dir = _get_model_dir()
    model_path = os.path.join(model_dir, 'ensemble_model.pkl')
    scaler_path = os.path.join(model_dir, 'scaler.pkl')
    features_path = os.path.join(model_dir, 'feature_columns.pkl')

    if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(features_path)):
        pytest.skip("ML model artifacts not found at data/models/ — skipping model test.")

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    features = joblib.load(features_path)

    # High-scoring student: should predict employable
    test_student = {
        'cgpa': 8.5,
        'skill_count': 10,
        'skill_diversity': 8,
        'internship_months': 6,
        'projects': 4,
        'certifications': 3,
        'workshops': 5,
        'total_experience': 14,
        'cgpa_normalized': 0.85,
        'certification_score': 11,
        'skill_cgpa_ratio': 1.18,
        'exp_skill_ratio': 1.4,
        'department_encoded': 0
    }

    X_test = np.array([test_student.get(f, 0) for f in features]).reshape(1, -1)
    X_test_scaled = scaler.transform(X_test)

    prediction = model.predict(X_test_scaled)[0]
    probability = model.predict_proba(X_test_scaled)[0]

    print(f"Employable: {'Yes' if prediction == 1 else 'No'}")
    print(f"Confidence: {max(probability) * 100:.2f}%")

    # Validate prediction is a valid binary label
    assert prediction in [0, 1], f"Prediction must be 0 or 1, got {prediction}"
    # Validate probabilities sum to ~1
    assert abs(sum(probability) - 1.0) < 0.01, "Probabilities must sum to 1"
    # Validate confidence is reasonable (above 50% for this high-scoring student)
    assert max(probability) > 0.5, f"Model confidence too low: {max(probability)}"

    print("Model test passed!")