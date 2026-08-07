# data_pipeline/ml/integration.py

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List
import joblib
import requests
import logging
from data_pipeline.loaders.database_loader import DatabaseLoader

logger = logging.getLogger(__name__)

class MLPipelineIntegration:
    """Integration with ML models and pipeline"""
    
    def __init__(self):
        self.loader = DatabaseLoader()
        self.ml_service_url = 'http://ml-service:8000'
    
    def prepare_features(self, student_id: int) -> Dict[str, Any]:
        """Prepare features for ML prediction"""
        # Get student data
        query = f"""
        SELECT 
            u.id,
            u.cgpa,
            u.department,
            u.year_of_study,
            COUNT(DISTINCT r.id) as resume_count,
            AVG(LENGTH(r.skills)) as skill_count,
            AVG(r.employability_score) as avg_score
        FROM users u
        LEFT JOIN resumes r ON u.id = r.user_id
        WHERE u.id = {student_id}
        GROUP BY u.id
        """
        
        df = pd.read_sql(query, self.loader.engine)
        
        if df.empty:
            return None
        
        row = df.iloc[0]
        
        features = {
            'cgpa': float(row.get('cgpa', 0)),
            'skill_count': int(row.get('skill_count', 0)),
            'internship_months': 0,  # Default
            'projects': 0,  # Default
            'certifications': 0,  # Default
            'workshops': 0,  # Default
            'skill_diversity': int(row.get('skill_count', 0)),
            'department_encoded': self._encode_department(row.get('department', ''))
        }
        
        return features
    
    def _encode_department(self, department: str) -> int:
        """Encode department name"""
        dept_map = {
            'Computer Science': 0,
            'Information Science': 1,
            'Electronics': 2,
            'Mechanical': 3,
            'Civil': 4
        }
        return dept_map.get(department, 0)
    
    def call_ml_service(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Call ML service for prediction"""
        try:
            response = requests.post(
                f"{self.ml_service_url}/predict",
                json=features,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"ML service error: {response.status_code}")
                return {'error': f"ML service returned {response.status_code}"}
                
        except requests.exceptions.RequestException as e:
            logger.error(f"ML service connection error: {e}")
            return {'error': str(e)}
    
    def update_predictions(self, student_id: int, prediction: Dict[str, Any]):
        """Update prediction in database"""
        try:
            query = f"""
            UPDATE users 
            SET employability_score = {prediction.get('employable', 0)},
                prediction_confidence = {prediction.get('confidence', 0)},
                last_prediction = '{datetime.now().isoformat()}'
            WHERE id = {student_id}
            """
            
            self.loader.engine.execute(query)
            logger.info(f"✅ Updated prediction for student {student_id}")
            
        except Exception as e:
            logger.error(f"Error updating prediction: {e}")
    
    def batch_predict(self, student_ids: List[int]) -> Dict[str, Any]:
        """Batch prediction for multiple students"""
        results = {
            'total': len(student_ids),
            'success': 0,
            'failed': 0,
            'predictions': []
        }
        
        for student_id in student_ids:
            try:
                features = self.prepare_features(student_id)
                if features:
                    prediction = self.call_ml_service(features)
                    if 'error' not in prediction:
                        self.update_predictions(student_id, prediction)
                        results['success'] += 1
                        results['predictions'].append({
                            'student_id': student_id,
                            'prediction': prediction
                        })
                    else:
                        results['failed'] += 1
                else:
                    results['failed'] += 1
                    
            except Exception as e:
                logger.error(f"Batch prediction error for {student_id}: {e}")
                results['failed'] += 1
        
        return results
    
    def get_prediction_history(self, student_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get prediction history for a student"""
        query = f"""
        SELECT 
            employability_score,
            prediction_confidence,
            last_prediction
        FROM users
        WHERE id = {student_id}
        """
        
        df = pd.read_sql(query, self.loader.engine)
        
        if df.empty:
            return []
        
        return df.to_dict('records')