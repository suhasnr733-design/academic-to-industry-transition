# backend/app/services/resume_processor.py

import threading
import time
from app import db
from app.models import Resume
from app.services.resume_parser import ResumeParser

class ResumeProcessor:
    """Background processor for resumes"""
    
    def __init__(self):
        self.parser = ResumeParser()
    
    def process_resume(self, resume_id):
        """Process a resume in the background"""
        try:
            # Get resume
            resume = Resume.query.get(resume_id)
            if not resume:
                print(f"Resume {resume_id} not found")
                return
            
            # Update status to processing
            resume.status = 'processing'
            db.session.commit()
            
            # Parse resume
            file_extension = resume.filename.rsplit('.', 1)[1].lower()
            parsed_data = self.parser.parse_resume(
                resume.file_path,
                file_extension
            )
            
            if not parsed_data.get('success', False):
                resume.status = 'failed'
                db.session.commit()
                print(f"Resume {resume_id} parsing failed: {parsed_data.get('error')}")
                return
            
            # Update resume with parsed data
            resume.skills = parsed_data.get('skills', [])
            resume.education = parsed_data.get('education', [])
            resume.experience = parsed_data.get('experience', {})
            resume.projects = parsed_data.get('projects', [])
            resume.status = 'completed'
            
            db.session.commit()
            print(f"Resume {resume_id} processed successfully")
            
        except Exception as e:
            # Update status to failed
            resume = Resume.query.get(resume_id)
            if resume:
                resume.status = 'failed'
                db.session.commit()
            print(f"Error processing resume {resume_id}: {str(e)}")
    
    def process_resume_async(self, resume_id):
        """Process resume in a separate thread"""
        thread = threading.Thread(target=self.process_resume, args=(resume_id,))
        thread.start()
        return thread