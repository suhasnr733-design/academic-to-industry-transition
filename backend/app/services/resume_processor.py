# backend/app/services/resume_processor.py

import threading
import logging
from flask import current_app
from app import db
from app.models import Resume
from app.services.resume_parser import ResumeParser
from app.services.skill_analyzer import SkillAnalyzer

logger = logging.getLogger(__name__)

class ResumeProcessor:
    """Background processor for resumes"""
    
    def __init__(self):
        self.parser = ResumeParser()
        self.analyzer = SkillAnalyzer()
        self.logger = logging.getLogger(__name__)
    
    def process_resume(self, resume_id: int):
        """Process a resume in background"""
        try:
            resume = db.session.get(Resume, resume_id)
            if not resume:
                self.logger.error(f"Resume {resume_id} not found")
                return
            
            resume.status = 'processing'
            db.session.commit()
            
            file_extension = resume.filename.rsplit('.', 1)[1].lower() if '.' in resume.filename else ''
            parsed_data = self.parser.parse_resume(
                resume.file_path,
                file_extension
            )
            
            if not parsed_data.get('success', False):
                resume.status = 'failed'
                resume.error_message = parsed_data.get('error', 'Parsing failed')
                db.session.commit()
                self.logger.error(f"Resume {resume_id} parsing failed: {resume.error_message}")
                return
            
            resume.skills = parsed_data.get('skills', [])
            resume.education = parsed_data.get('education', [])
            resume.experience = parsed_data.get('experience', {})
            resume.projects = parsed_data.get('projects', [])
            
            # Calibrated Multi-Dimensional Employability Calculation (Base: 30%)
            skills = resume.skills or []
            projects = resume.projects or []
            education_text = str(resume.education or []).lower()
            experience_text = str(resume.experience or {}).lower()
            certifications = getattr(resume, 'certifications', []) or []

            # 1. Base Score (30.0 pts)
            score = 30.0

            # 2. Technical Skills (Up to +25.0 pts)
            score += min(len(skills) * 2.5, 25.0)

            # 3. Hands-on Projects (Up to +18.0 pts)
            score += min(len(projects) * 6.0, 18.0)

            # 4. Academic Engineering Degree (+10.0 pts)
            if any(deg in education_text for deg in ['b.e', 'b.tech', 'bachelor', 'engineering', 'mca', 'm.tech']):
                score += 10.0
            else:
                score += 5.0

            # 5. Internship / Work Exposure (+10.0 pts)
            if any(term in experience_text for term in ['intern', 'internship', 'trainee', 'developer', 'engineer', 'freelance']):
                score += 10.0

            # 6. Certifications & Competitive Profiles (+5.0 pts)
            if len(certifications) > 0 or any(c in str(skills).lower() for c in ['aws', 'hackerrank', 'leetcode', 'coursera', 'certified']):
                score += 5.0

            # Clamped between 30.0% and 98.0%
            final_score = min(max(score, 30.0), 98.0)
            resume.employability_score = round(final_score, 1)
            
            # Skill gaps and recommended roles
            try:
                gaps = self.analyzer.analyze_gaps(resume.skills, target_role='Software Engineer')
                resume.skill_gaps = gaps.get('missing_skills', [])
            except Exception:
                resume.skill_gaps = []
                
            # Dynamically recommend top best-fitting roles from the 25+ benchmarks
            try:
                top_roles = self.analyzer.predict_top_roles(resume.skills, top_n=3)
                resume.recommended_roles = top_roles if top_roles else ['Software Engineer', 'Full Stack Developer', 'Data Analyst']
            except Exception:
                resume.recommended_roles = ['Software Engineer', 'Full Stack Developer', 'Data Analyst']

            resume.status = 'completed'
            
            db.session.commit()
            self.logger.info(f"Resume {resume_id} processed successfully")

            # 🔔 Trigger in-app notification & activity email
            try:
                from app.services.notification_service import NotificationService
                NotificationService.send_resume_processed_notification(resume.user_id, resume.id)
            except Exception as notif_err:
                self.logger.warning(f"Could not dispatch resume notification: {notif_err}")
            
        except Exception as e:
            self.logger.error(f"Error processing resume {resume_id}: {e}")
            try:
                resume = db.session.get(Resume, resume_id)
                if resume:
                    resume.status = 'failed'
                    resume.error_message = str(e)
                    db.session.commit()
            except Exception as db_err:
                self.logger.error(f"Failed to update error status: {db_err}")
    
    def process_resume_async(self, resume_id: int):
        """Process resume in a separate thread"""
        try:
            app = current_app._get_current_object()
            def runner():
                with app.app_context():
                    self.process_resume(resume_id)
            thread = threading.Thread(target=runner)
        except Exception:
            thread = threading.Thread(target=self.process_resume, args=(resume_id,))
        thread.daemon = True
        thread.start()
        return thread
    
    def process_batch(self, resume_ids: list):
        """Process multiple resumes in batch"""
        threads = []
        for resume_id in resume_ids:
            thread = self.process_resume_async(resume_id)
            threads.append(thread)
        
        for thread in threads:
            thread.join()
        
        return {'processed': len(threads)}
