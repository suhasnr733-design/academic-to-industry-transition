# backend/app/services/enhanced_recommender.py

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.skill_graph import SkillKnowledgeGraph

class EnhancedRecommender:
    """Enhanced recommendation system with skill graph"""
    
    def __init__(self):
        self.skill_graph = SkillKnowledgeGraph()
        self.load_data()
    
    def load_data(self):
        """Load course and job data"""
        self.courses = pd.read_csv('data/processed/courses_cleaned.csv')
        self.jobs = pd.read_csv('data/processed/jobs_cleaned.csv')
        self.vectorizer = TfidfVectorizer(max_features=1000)
    
    def recommend_courses_with_path(self, skills, limit=5):
        """Recommend courses with learning path"""
        # Get skill gaps
        target_skills = ['Machine Learning', 'Deep Learning', 'Data Science']
        gap_analysis = self.skill_graph.skill_gap_analysis(skills, target_skills)
        
        # Generate recommendations based on gap analysis
        recommendations = []
        
        for skill in gap_analysis['learning_path']:
            # Find courses matching the skill
            matching_courses = self.courses[
                self.courses['title'].str.contains(skill, case=False) |
                self.courses['description'].str.contains(skill, case=False)
            ]
            
            for _, course in matching_courses.head(2).iterrows():
                recommendations.append({
                    'skill': skill,
                    'course': course['title'],
                    'platform': course['platform'],
                    'type': 'core' if skill in gap_analysis['missing_skills'] else 'prerequisite'
                })
        
        # Add course recommendations from traditional method
        traditional_recs = self._traditional_recommendation(skills)
        recommendations.extend(traditional_recs[:limit])
        
        return recommendations[:limit]
    
    def _traditional_recommendation(self, skills):
        """Traditional course recommendation"""
        skill_text = ' '.join(skills)
        course_texts = self.courses['description'].fillna('') + ' ' + \
                       self.courses['title'].fillna('')
        
        all_texts = [skill_text] + course_texts.tolist()
        tfidf_matrix = self.vectorizer.fit_transform(all_texts)
        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        
        top_indices = similarities.argsort()[-5:][::-1]
        recommendations = []
        
        for idx in top_indices:
            course = self.courses.iloc[idx]
            recommendations.append({
                'course': course.get('title', 'Unknown'),
                'platform': course.get('platform', 'Unknown'),
                'similarity_score': round(similarities[idx] * 100, 2),
                'type': 'recommended'
            })
        
        return recommendations