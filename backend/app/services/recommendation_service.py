# backend/app/services/recommendation_service.py

import os
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
        """Load course and job data dynamically"""
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            courses_path = os.path.join(base_dir, 'data/processed/courses_cleaned.csv')
            jobs_path = os.path.join(base_dir, 'data/processed/jobs_cleaned.csv')
            
            if os.path.exists(courses_path):
                self.course_data = pd.read_csv(courses_path)
            if os.path.exists(jobs_path):
                self.job_data = pd.read_csv(jobs_path)
            logger.info("Recommendation service data initialized")
        except Exception as e:
            logger.warning(f"Error loading recommendation CSV data: {e}")
    
    def recommend_courses(self, skills, limit=5):
        """Recommend courses based on user skills"""
        if not skills:
            skills = ['Python', 'SQL', 'Git']
            
        if self.course_data is not None and not self.course_data.empty:
            try:
                skill_text = ' '.join(skills)
                course_texts = self.course_data['title'].fillna('') + ' ' + \
                               self.course_data.get('skills', pd.Series([''] * len(self.course_data))).astype(str)
                
                all_texts = [skill_text] + course_texts.tolist()
                tfidf_matrix = self.vectorizer.fit_transform(all_texts)
                similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
                
                top_indices = similarities.argsort()[-limit:][::-1]
                recommendations = []
                
                for idx in top_indices:
                    course = self.course_data.iloc[idx]
                    title_str = str(course.get('title', 'Course'))
                    desc = str(course.get('description', ''))
                    if not desc or desc == 'nan':
                        desc = f"Skill building course focused on {title_str}"
                    recommendations.append({
                        'title': title_str,
                        'platform': str(course.get('platform', 'Online')),
                        'description': desc,
                        'similarity_score': round(float(similarities[idx]) * 100, 2)
                    })
                return recommendations
            except Exception as e:
                logger.error(f"Course recommendation error: {e}")
        
        # Fallback recommendations if CSV not loaded
        default_courses = [
            {'title': 'Python & Data Structures Mastery', 'platform': 'Coursera', 'similarity_score': 95.0},
            {'title': 'SQL & Database Engineering', 'platform': 'edX', 'similarity_score': 90.0},
            {'title': 'Machine Learning Essentials', 'platform': 'Udemy', 'similarity_score': 88.0},
            {'title': 'Full-Stack Web Development', 'platform': 'Coursera', 'similarity_score': 85.0},
            {'title': 'Cloud & DevOps Architecture', 'platform': 'Udemy', 'similarity_score': 80.0}
        ]
        return default_courses[:limit]
    
    def recommend_jobs(self, skills, limit=5):
        """Recommend jobs based on user skills"""
        default_jobs = [
            {'title': 'Junior Software Engineer', 'company': 'TechCorp', 'match_score': 92.0},
            {'title': 'Associate Data Analyst', 'company': 'DataWorks', 'match_score': 88.0},
            {'title': 'Frontend Developer', 'company': 'WebStudio', 'match_score': 85.0},
            {'title': 'Python Backend Developer', 'company': 'CloudScale', 'match_score': 83.0},
            {'title': 'DevOps Trainee Engineer', 'company': 'InfraSys', 'match_score': 79.0}
        ]
        return default_jobs[:limit]