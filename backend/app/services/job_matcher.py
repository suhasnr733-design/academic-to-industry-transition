# backend/app/services/job_matcher.py

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class JobMatcher:
    """Match resumes to job listings"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=1000)
    
    def calculate_skill_match(self, student_skills, job_skills):
        """Calculate skill match percentage"""
        if not student_skills or not job_skills:
            return 0.0
        
        student_set = set([s.lower() for s in student_skills])
        job_set = set([s.lower() for s in job_skills])
        
        if not job_set:
            return 0.0
        
        intersection = student_set.intersection(job_set)
        match_percentage = (len(intersection) / len(job_set)) * 100
        
        return round(match_percentage, 2)
    
    def calculate_similarity(self, student_text, job_text):
        """Calculate text similarity using TF-IDF"""
        if not student_text or not job_text:
            return 0.0
        
        try:
            corpus = [student_text, job_text]
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            return round(similarity[0][0] * 100, 2)
        except:
            return 0.0
    
    def match_jobs(self, student_data, jobs_data):
        """Match student with multiple jobs"""
        results = []
        student_skills = student_data.get('skills', [])
        
        for job in jobs_data:
            job_skills = job.get('required_skills', [])
            
            skill_match = self.calculate_skill_match(student_skills, job_skills)
            
            # Combine with text similarity if description available
            combined_score = skill_match
            
            results.append({
                'job_id': job.get('id'),
                'job_title': job.get('title'),
                'company': job.get('company'),
                'skill_match': skill_match,
                'combined_score': combined_score,
                'missing_skills': self.get_missing_skills(student_skills, job_skills),
                'matching_skills': self.get_matching_skills(student_skills, job_skills),
                'job_details': job
            })
        
        # Sort by combined score descending
        results.sort(key=lambda x: x['combined_score'], reverse=True)
        return results
    
    def get_missing_skills(self, student_skills, job_skills):
        """Identify skills the student is missing"""
        student_set = set([s.lower() for s in student_skills])
        job_set = set([s.lower() for s in job_skills])
        return list(job_set - student_set)
    
    def get_matching_skills(self, student_skills, job_skills):
        """Identify skills that match"""
        student_set = set([s.lower() for s in student_skills])
        job_set = set([s.lower() for s in job_skills])
        return list(student_set.intersection(job_set))
    