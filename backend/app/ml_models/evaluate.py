# backend/app/ml_models/evaluate.py

import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

def evaluate_model():
    """Evaluate the ensemble model"""
    # Load model
    model = joblib.load('data/models/ensemble_model.pkl')
    scaler = joblib.load('data/models/scaler.pkl')
    features = joblib.load('data/models/feature_columns.pkl')
    
    # Load test data
    df = pd.read_csv('data/processed/student_data_engineered.csv')
    X_test = df[features]
    y_test = df['placed']
    
    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test_scaled)
    
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    print(f"\nAUC-ROC: {roc_auc_score(y_test, model.predict_proba(X_test_scaled)[:, 1]):.4f}")
    
    # Save metrics
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'f1': f1_score(y_test, y_pred),
        'auc_roc': roc_auc_score(y_test, model.predict_proba(X_test_scaled)[:, 1])
    }
    pd.DataFrame([metrics]).to_csv('data/models/final_metrics.csv', index=False)
    print("✅ Evaluation complete!")

if __name__ == '__main__':
    evaluate_model()