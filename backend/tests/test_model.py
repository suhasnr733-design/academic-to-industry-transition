# backend/tests/test_model.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
import numpy as np

def test_model():
    """Test the trained model"""
    model = joblib.load('data/models/ensemble_model.pkl')
    scaler = joblib.load('data/models/scaler.pkl')
    features = joblib.load('data/models/feature_columns.pkl')
    
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
    
    X_test = np.array([test_student[f] for f in features]).reshape(1, -1)
    X_test_scaled = scaler.transform(X_test)
    
    prediction = model.predict(X_test_scaled)[0]
    probability = model.predict_proba(X_test_scaled)[0]
    
    print(f"Employable: {'✅ Yes' if prediction == 1 else '❌ No'}")
    print(f"Confidence: {max(probability) * 100:.2f}%")
    
    assert prediction == 1
    print("✅ Model test passed!")

if __name__ == '__main__':
    test_model()