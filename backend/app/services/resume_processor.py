# backend/app/services/resume_processor.py

import os
import uuid
import threading
from flask import current_app
from app.extensions import db
from app.models import Resume
from app.services.resume_parser import ResumeParser
from app.services.skill_analyzer import SkillAnalyzer
from app.services.enhanced_resume_parser import EnhancedResumeParser
import logging

logger = logging.getLogger(__name__)

class ResumeProcessor:
    """Enhanced background processor for resumes"""
    
    def __init__(self):
        self.parser = EnhancedResumeParser()
        self.analyzer = SkillAnalyzer()
        self.logger = logging.getLogger(__name__)
    
    def process_resume(self, resume_id: int):
        """Process a resume in the background"""
        try:
            resume = Resume.query.get(resume_id)
            if not resume:
                self.logger.error(f"Resume {resume_id} not found")
                return
            
            # Update status to processing
            resume.status = 'processing'
            db.session.commit()
            
            # Parse resume using enhanced parser
            file_type = resume.file_type
            parsed_data = self.parser.parse_resume(
                resume.file_path,
                file_type
            )
            
            if not parsed_data.get('success', False):
                resume.status = 'failed'
                resume.error_message = parsed_data.get('error', 'Parsing failed')
                db.session.commit()
                self.logger.error(f"Resume {resume_id} parsing failed: {resume.error_message}")
                return
            
            # Use enhanced extraction
            text = parsed_data.get('text', '')
            enhanced_result = self.parser.extract_skills_enhanced(text)
            
            # Update resume with parsed data
            resume.skills = enhanced_result.get('all_skills', [])
            resume.education = parsed_data.get('education', [])
            resume.experience = parsed_data.get('experience', {})
            resume.projects = parsed_data.get('projects', [])
            resume.certifications = parsed_data.get('certifications', [])
            
            # Analyze skills and get recommendations
            analysis = self.analyzer.analyze_gaps(
                current_skills=resume.skills or [],
                target_role='Software Engineer'
            )
            
            resume.employability_score = analysis.get('match_percentage', 0)
            resume.recommended_roles = ['Software Engineer', 'Data Scientist']
            resume.skill_gaps = analysis.get('missing_skills', [])
            
            resume.status = 'completed'
            db.session.commit()
            
            self.logger.info(f"Resume {resume_id} processed successfully")
            
        except Exception as e:
            resume = Resume.query.get(resume_id)
            if resume:
                resume.status = 'failed'
                resume.error_message = str(e)
                db.session.commit()
            self.logger.error(f"Error processing resume {resume_id}: {e}")
    
    def process_resume_async(self, resume_id: int):
        """Process resume in a separate thread"""
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
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        return {'processed': len(threads)}