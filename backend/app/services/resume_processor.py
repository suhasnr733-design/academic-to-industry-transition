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
            
            experience_dict = parsed_data.get('experience', {}) if isinstance(parsed_data.get('experience'), dict) else {}
            if parsed_data.get('candidate_name'):
                experience_dict['candidate_name'] = parsed_data.get('candidate_name')
            if parsed_data.get('raw_text'):
                experience_dict['raw_text'] = parsed_data.get('raw_text')
            resume.experience = experience_dict
            
            resume.projects = parsed_data.get('projects', [])
            resume.certifications = parsed_data.get('certifications', [])
            resume.personal_info = parsed_data.get('personal_info', {})
            resume.links = parsed_data.get('links', {})
            resume.summary = parsed_data.get('summary', '')
            resume.achievements = parsed_data.get('achievements', [])
            resume.publications = parsed_data.get('publications', [])
            
            # ─────────────────────────────────────────────────────────────
            # 🚀 MASTER 11-PILLAR 100-POINT ATS SCORE CALCULATION
            # ─────────────────────────────────────────────────────────────
            
            # 1. Base Score Floor (10.0 pts)
            base_score = 10.0
            
            # 2. Personal Info & Contact Hygiene (5.0 pts)
            p_info = resume.personal_info or {}
            p_score = 0.0
            if p_info.get('candidate_name') or parsed_data.get('candidate_name'): p_score += 1.0
            if p_info.get('email'): p_score += 1.0
            if p_info.get('phone'): p_score += 1.0
            if p_info.get('location'): p_score += 1.0
            if not p_info.get('has_bio_data_clutter'): p_score += 1.0
            
            # 3. Technical Skills Depth & Diversity (18.0 pts)
            skills = resume.skills or []
            skill_score = min(len(skills) * 1.5, 14.0)
            if parsed_data.get('category_count', 0) >= 3:
                skill_score += 4.0
            skill_score = min(skill_score, 18.0)
            
            # 4. Hands-on Projects & Architecture (15.0 pts)
            projects = resume.projects or []
            proj_score = min(len(projects) * 4.0, 12.0)
            if len(projects) >= 2:
                proj_score += 3.0
            proj_score = min(proj_score, 15.0)
            
            # 5. Google XYZ & STAR Impact Metrics (10.0 pts)
            metrics_data = parsed_data.get('metrics_analysis', {})
            impact_score = min(metrics_data.get('metric_count', 0) * 2.5 + metrics_data.get('verb_count', 0) * 1.0, 10.0)
            
            # 6. Academic Degree & Department Fit (10.0 pts)
            edu_text = str(resume.education or []).lower()
            edu_score = 7.0 if any(d in edu_text for d in ['b.e', 'b.tech', 'mca', 'm.tech', 'bachelor', 'engineering']) else 4.0
            if any(dept in edu_text for dept in ['computer', 'information', 'cse', 'ise', 'ai', 'data', 'software', 'technology']):
                edu_score += 3.0
            edu_score = min(edu_score, 10.0)
            
            # 7. Industry Internships & Experience (10.0 pts)
            exp_text = str(resume.experience or {}).lower()
            exp_score = 10.0 if any(term in exp_text for term in ['intern', 'internship', 'trainee', 'developer', 'engineer', 'freelance']) else 0.0
            
            # 8. Multi-Domain Digital Footprint (8.0 pts)
            links = resume.links or {}
            link_score = 0.0
            if any(links.get(k) for k in ['github', 'gitlab', 'bitbucket']): link_score += 3.0
            if links.get('linkedin'): link_score += 3.0
            if any(links.get(k) for k in ['leetcode', 'hackerrank', 'codeforces', 'codechef', 'gfg']): link_score += 1.0
            if any(links.get(k) for k in ['portfolio', 'kaggle', 'huggingface', 'behance', 'scholar', 'medium', 'devto']): link_score += 1.0
            link_score = min(link_score, 8.0)
            
            # 9. Hackathons & Competitive Honors (5.0 pts)
            achievements = resume.achievements or []
            achieve_score = min(len(achievements) * 2.5, 5.0)
            
            # 10. Certifications & Specializations (4.0 pts)
            certifications = resume.certifications or []
            cert_score = min(len(certifications) * 1.5, 4.0)
            if cert_score == 0 and any(c in str(skills).lower() for c in ['aws', 'hackerrank', 'leetcode', 'coursera', 'certified', 'nptel']):
                cert_score = 2.0
            
            # 11. Professional Summary & ATS Layout (5.0 pts)
            summary = resume.summary or ''
            summary_score = (2.5 if summary and len(summary.split()) >= 10 else 1.0) + 2.5
            summary_score = min(summary_score, 5.0)
            
            # Final Calculated Score (Clamped between 30.0% and 98.0%)
            total_raw = base_score + p_score + skill_score + proj_score + impact_score + edu_score + exp_score + link_score + achieve_score + cert_score + summary_score
            final_ats = min(max(total_raw, 30.0), 98.0)
            resume.employability_score = round(final_ats, 1)
            
            # Generate Actionable Optimization Checklist
            missing_elements = []
            if not links.get('github'): missing_elements.append("Add GitHub profile repository link (+3.0 pts)")
            if not links.get('linkedin'): missing_elements.append("Add LinkedIn profile link (+3.0 pts)")
            if not any(links.get(k) for k in ['leetcode', 'hackerrank', 'codeforces', 'gfg']): missing_elements.append("Include LeetCode or competitive coding handle (+1.0 pt)")
            if impact_score < 6.0: missing_elements.append("Quantify project bullet points with impact % metrics (+5.0 pts)")
            if not summary: missing_elements.append("Add 2-3 line Professional Summary (+2.5 pts)")
            if len(projects) < 2: missing_elements.append("Add at least 2 structured technical projects (+6.0 pts)")

            tier = 'Tier 1: High Readiness' if final_ats >= 85.0 else ('Tier 2: Competitive' if final_ats >= 70.0 else 'Tier 3: Developing')

            resume.ats_breakdown = {
                'base_score': base_score,
                'personal_info_score': round(p_score, 1),
                'skills_score': round(skill_score, 1),
                'projects_score': round(proj_score, 1),
                'impact_metrics_score': round(impact_score, 1),
                'education_score': round(edu_score, 1),
                'experience_score': round(exp_score, 1),
                'digital_footprint_score': round(link_score, 1),
                'achievements_score': round(achieve_score, 1),
                'certifications_score': round(cert_score, 1),
                'summary_score': round(summary_score, 1),
                'missing_elements': missing_elements,
                'tier': tier
            }
            
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
            self.logger.info(f"Resume {resume_id} processed successfully with 11-pillar ATS score: {resume.employability_score}%")

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
