# backend/app/services/enhanced_resume_parser.py

import re
from app.services.resume_parser import ResumeParser
from app.services.bert_skill_extractor import BertSkillExtractor
import logging

logger = logging.getLogger(__name__)

class EnhancedResumeParser(ResumeParser):
    """Enhanced resume parser with better accuracy"""
    
    def __init__(self):
        super().__init__()
        try:
            self.bert_extractor = BertSkillExtractor()
            self.industry_skills = self._load_industry_skills()
            logger.info("✅ Enhanced parser initialized")
        except Exception as e:
            logger.error(f"Error initializing enhanced parser: {e}")
    
    def _load_industry_skills(self):
        """Load industry-specific skills"""
        return {
            'AI/ML': ['TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Deep Learning'],
            'Web Dev': ['React', 'Angular', 'Node.js', 'Django', 'Flask', 'Vue.js'],
            'Cloud': ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'],
            'Data': ['SQL', 'Python', 'R', 'Tableau', 'Power BI', 'Data Visualization'],
            'DevOps': ['Linux', 'Git', 'CI/CD', 'Ansible', 'Prometheus', 'Grafana']
        }
    
    def extract_skills_enhanced(self, text):
        """Extract skills with enhanced accuracy"""
        try:
            # BERT-based extraction
            bert_skills = self.bert_extractor.extract_skills(text)
            
            # Traditional extraction
            traditional_skills = self.extract_skills(text)
            
            # Combine and deduplicate
            all_skills = list(set(bert_skills + traditional_skills))
            
            # Normalize skills
            normalized_skills = self._normalize_skills(all_skills)
            
            # Categorize skills
            categorized = self._categorize_skills(normalized_skills)
            
            return {
                'all_skills': normalized_skills,
                'categorized': categorized,
                'skill_count': len(normalized_skills),
                'extraction_methods': ['bert', 'traditional']
            }
        except Exception as e:
            logger.error(f"Enhanced extraction error: {e}")
            return {
                'all_skills': [],
                'categorized': {},
                'skill_count': 0,
                'error': str(e)
            }
    
    def _normalize_skills(self, skills):
        """Normalize skill names"""
        skill_mapping = {
            'python': 'Python',
            'java': 'Java',
            'js': 'JavaScript',
            'reactjs': 'React',
            'tensorflow': 'TensorFlow',
            'pytorch': 'PyTorch',
            'docker': 'Docker',
            'kubernetes': 'Kubernetes',
            'aws': 'AWS',
            'azure': 'Azure'
        }
        return [skill_mapping.get(s.lower(), s) for s in skills if s]
    
    def _categorize_skills(self, skills):
        """Categorize skills by industry domain"""
        categorized = {category: [] for category in self.industry_skills.keys()}
        categorized['Other'] = []
        
        for skill in skills:
            found = False
            for category, cat_skills in self.industry_skills.items():
                if skill in cat_skills:
                    categorized[category].append(skill)
                    found = True
                    break
            if not found:
                categorized['Other'].append(skill)
        
        return {k: v for k, v in categorized.items() if v}