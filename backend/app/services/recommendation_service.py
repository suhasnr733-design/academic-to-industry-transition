# backend/app/services/recommendation_service.py

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

class RecommendationService:
    """Course and job recommendation service"""
    
    def __init__(self):
        self.course_data = None
        self.job_data = None
        self.vectorizer = TfidfVectorizer(max_features=1000)
        self.load_data()
    
    def load_data(self):
        """Load course and job data"""
        try:
            self.course_data = pd.read_csv('data/processed/courses_cleaned.csv')
            self.job_data = pd.read_csv('data/processed/jobs_cleaned.csv')
            logger.info("✅ Data loaded successfully")
        except Exception as e:
            logger.error(f"Error loading data: {e}")
    
    def recommend_courses(self, skills, limit=5):
        """Recommend courses based on skills"""
        if self.course_data is None or not skills:
            return []
        
        try:
            # Create skill text
            skill_text = ' '.join(skills)
            course_texts = self.course_data['description'].fillna('') + ' ' + \
                           self.course_data['title'].fillna('')
            
            # Compute similarity
            all_texts = [skill_text] + course_texts.tolist()
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
            similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
            
            # Get top recommendations
            top_indices = similarities.argsort()[-limit:][::-1]
            recommendations = []
            
            for idx in top_indices:
                course = self.course_data.iloc[idx]
                recommendations.append({
                    'title': course.get('title', 'Unknown'),
                    'platform': course.get('platform', 'Unknown'),
                    'description': course.get('description', '')[:200],
                    'similarity_score': round(similarities[idx] * 100, 2)
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Recommendation error: {e}")
            return []
    
    def recommend_jobs(self, skills, limit=5):
        """Recommend jobs based on skills"""
        # Similar implementation for jobs
        return []