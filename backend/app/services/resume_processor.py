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
            resume = Resume.query.get(resume_id)
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
            
            # Simple employability calculation based on skills and projects
            skill_count = len(resume.skills or [])
            score = min(50.0 + skill_count * 5.0, 95.0)
            resume.employability_score = score
            resume.recommended_roles = ['Software Engineer', 'Data Scientist']
            resume.status = 'completed'
            
            db.session.commit()
            self.logger.info(f"Resume {resume_id} processed successfully")
            
        except Exception as e:
            self.logger.error(f"Error processing resume {resume_id}: {e}")
            try:
                resume = Resume.query.get(resume_id)
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
