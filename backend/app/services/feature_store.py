# backend/app/services/feature_store.py

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Any
import json
from app.extensions import db, redis_client
import logging

logger = logging.getLogger(__name__)

class FeatureStore:
    """Feature store for ML models"""
    
    def __init__(self):
        self.features = {}
        self.load_features()
    
    def load_features(self):
        """Load feature definitions"""
        # Define features
        self.feature_definitions = {
            'student_features': [
                'cgpa', 'skill_count', 'skill_diversity', 
                'internship_months', 'projects', 'certifications',
                'workshops', 'department_encoded'
            ],
            'computed_features': [
                'total_experience', 'cgpa_normalized', 
                'certification_score', 'skill_cgpa_ratio',
                'exp_skill_ratio'
            ]
        }
    
    def compute_features(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """Compute all features for a student"""
        features = {}
        
        # Direct features
        for feature in self.feature_definitions['student_features']:
            features[feature] = student_data.get(feature, 0)
        
        # Computed features
        features['total_experience'] = (
            features.get('internship_months', 0) + 
            features.get('projects', 0) * 2
        )
        
        features['cgpa_normalized'] = features.get('cgpa', 0) / 10
        
        features['certification_score'] = (
            features.get('certifications', 0) * 2 + 
            features.get('workshops', 0) * 1
        )
        
        cgpa = features.get('cgpa', 1)
        features['skill_cgpa_ratio'] = features.get('skill_count', 0) / (cgpa + 1)
        
        features['exp_skill_ratio'] = (
            features.get('total_experience', 0) / 
            (features.get('skill_count', 0) + 1)
        )
        
        return features
    
    def get_features_batch(self, student_ids: List[int]) -> pd.DataFrame:
        """Get features for multiple students"""
        features_list = []
        
        for student_id in student_ids:
            # Get student data from database
            from app.models import User, Resume
            student = User.query.get(student_id)
            
            if not student:
                continue
            
            # Get latest resume
            resume = Resume.query.filter_by(user_id=student_id)\
                .order_by(Resume.created_at.desc()).first()
            
            data = {
                'student_id': student_id,
                'cgpa': 7.5,  # Default
                'skill_count': len(resume.skills) if resume and resume.skills else 0,
                'skill_diversity': len(set(resume.skills)) if resume and resume.skills else 0,
                'internship_months': 0,
                'projects': 0,
                'certifications': 0,
                'workshops': 0,
                'department_encoded': 0
            }
            
            features = self.compute_features(data)
            features['student_id'] = student_id
            features_list.append(features)
        
        return pd.DataFrame(features_list)
    
    def cache_features(self, student_id: int, features: Dict[str, Any]):
        """Cache features in Redis"""
        if redis_client:
            key = f"features:student:{student_id}"
            redis_client.setex(
                key,
                3600,  # 1 hour TTL
                json.dumps(features)
            )
    
    def get_cached_features(self, student_id: int) -> Dict[str, Any]:
        """Get cached features"""
        if redis_client:
            key = f"features:student:{student_id}"
            cached = redis_client.get(key)
            if cached:
                return json.loads(cached)
        return None