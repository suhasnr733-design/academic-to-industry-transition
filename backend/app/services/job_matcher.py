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
    
    def calculate_six_pillar_fit(self, student_data, job):
        """Calculate comprehensive 6-pillar B.E. fit score"""
        score = 0
        student_skills = [s.lower().strip() for s in (student_data.get('skills') or [])]
        job_skills = [s.lower().strip() for s in (job.get('required_skills') or [])]
        
        # Pillar 1: Technical Core Skills (35 Pts)
        if job_skills and student_skills:
            matched = [s for s in job_skills if any(u in s or s in u for u in student_skills)]
            score += int((len(matched) / len(job_skills)) * 35)
        else:
            score += 20

        # Pillar 2: Projects & Portfolio (20 Pts)
        projects = student_data.get('projects') or []
        if len(projects) >= 2:
            score += 20
        elif len(projects) == 1:
            score += 14
        else:
            score += 8

        # Pillar 3: Education & B.E. Degree (15 Pts)
        edu_text = str(student_data.get('education') or []).lower()
        if any(w in edu_text for w in ['b.e', 'b.tech', 'bachelor', 'engineering', 'mca']):
            score += 10
        else:
            score += 6
        if any(w in edu_text for w in ['computer', 'information', 'cse', 'ise', 'ece', 'data']):
            score += 5

        # Pillar 4: Industry Bridge Readiness (10 Pts)
        industry_tools = ['git', 'github', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'rest api', 'fastapi', 'linux', 'redis', 'jest', 'pytest']
        matched_tools = [t for t in industry_tools if any(t in s for s in student_skills) or t in str(projects).lower()]
        if len(matched_tools) >= 3:
            score += 10
        elif len(matched_tools) >= 1:
            score += 7
        else:
            score += 4

        # Pillar 5: Internship Experience (10 Pts)
        exp_text = str(student_data.get('experience') or {}).lower()
        if any(w in exp_text for w in ['intern', 'trainee', 'developer', 'engineer', 'freelance']):
            score += 10
        else:
            score += 5

        # Pillar 6: Location & Work Mode Fit (10 Pts)
        job_loc = (job.get('location') or '').lower()
        user_loc = (student_data.get('location') or 'bangalore').lower()
        if not job_loc or 'remote' in job_loc or 'campus' in job_loc or user_loc in job_loc or job_loc in user_loc:
            score += 10
        else:
            score += 5

        return min(max(score, 45), 98)

    def match_jobs(self, student_data, jobs_data):
        """Match student with multiple jobs using 6-pillar scoring"""
        results = []
        student_skills = student_data.get('skills', [])
        
        for job in jobs_data:
            job_skills = job.get('required_skills', [])
            
            skill_match = self.calculate_skill_match(student_skills, job_skills)
            six_pillar_score = self.calculate_six_pillar_fit(student_data, job)
            
            results.append({
                'job_id': job.get('id'),
                'job_title': job.get('title'),
                'company': job.get('company'),
                'skill_match': skill_match,
                'combined_score': six_pillar_score,
                'fit_score': six_pillar_score,
                'missing_skills': self.get_missing_skills(student_skills, job_skills),
                'matching_skills': self.get_matching_skills(student_skills, job_skills),
                'job_details': job
            })
        
        # Sort by 6-pillar combined score descending
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
    