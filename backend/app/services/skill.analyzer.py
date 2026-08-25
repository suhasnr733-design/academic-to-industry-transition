# backend/app/services/skill_analyzer.py

import json
from app.services.job_matcher import JobMatcher

class SkillAnalyzer:
    """Analyze skills and identify gaps"""
    
    def __init__(self):
        self.matcher = JobMatcher()
        
        # Course recommendations mapping
        self.course_mapping = {
            'Python': ['Python for Data Science', 'Python Programming Essentials', 'Advanced Python'],
            'Java': ['Java Fundamentals', 'Advanced Java Programming', 'Spring Framework'],
            'Machine Learning': ['ML Specialization', 'Deep Learning with Python', 'Applied ML'],
            'Deep Learning': ['Deep Learning Specialization', 'Neural Networks', 'PyTorch'],
            'AWS': ['AWS Certified Solutions Architect', 'AWS Cloud Practitioner', 'AWS DevOps'],
            'Docker': ['Docker Mastery', 'DevOps with Docker', 'Containerization'],
            'Kubernetes': ['Kubernetes Fundamentals', 'Kubernetes Administrator'],
            'SQL': ['SQL for Data Science', 'Database Management Systems', 'Advanced SQL'],
            'React': ['React Complete Guide', 'Frontend Development with React', 'React Native'],
            'JavaScript': ['JavaScript: The Advanced Concepts', 'ES6+ Modern JavaScript'],
            'Django': ['Django Full Stack', 'Django REST Framework', 'Python Web Development'],
            'Git': ['Git and GitHub', 'Version Control with Git', 'Advanced Git'],
            'Data Science': ['Data Science Bootcamp', 'Data Analysis with Python', 'Statistics']
        }
    
    def analyze_gaps(self, current_skills, target_role=None, domain=None):
        """Analyze skill gaps for a target role"""
        # Get target skills
        target_skills = self._get_target_skills(target_role, domain)
        
        if not target_skills:
            return {
                'error': 'No target skills defined',
                'current_skills': current_skills,
                'target_skills': [],
                'missing_skills': [],
                'matching_skills': []
            }
        
        current_set = set([s.lower() for s in current_skills])
        target_set = set([s.lower() for s in target_skills])
        
        missing = list(target_set - current_set)
        matching = list(current_set.intersection(target_set))
        
        # Categorize gaps
        critical_gaps = self._categorize_gaps(missing, 'critical')
        important_gaps = self._categorize_gaps(missing, 'important')
        nice_to_have = self._categorize_gaps(missing, 'nice_to_have')
        
        return {
            'current_skills': current_skills,
            'target_skills': target_skills,
            'matching_skills': matching,
            'missing_skills': missing,
            'gap_categories': {
                'critical': critical_gaps,
                'important': important_gaps,
                'nice_to_have': nice_to_have
            },
            'total_gaps': len(missing),
            'match_percentage': round((len(matching) / len(target_set)) * 100, 2) if target_set else 0
        }
    
    def _get_target_skills(self, target_role, domain):
        """Get target skills for a role/domain"""
        skill_map = {
            'Data Scientist': ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Data Visualization', 'Deep Learning'],
            'Software Engineer': ['Python', 'Java', 'SQL', 'Data Structures', 'Algorithms', 'Git'],
            'DevOps Engineer': ['Linux', 'Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Git'],
            'Frontend Developer': ['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'Redux'],
            'Backend Developer': ['Python', 'Java', 'SQL', 'Node.js', 'Django', 'APIs', 'Git'],
            'ML Engineer': ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'PyTorch', 'AWS']
        }
        
        if target_role in skill_map:
            return skill_map[target_role]
        
        # Default skills by domain
        domain_map = {
            'AI/ML': ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'Data Visualization'],
            'Web Development': ['JavaScript', 'React', 'HTML', 'CSS', 'Node.js', 'Git'],
            'Cloud/DevOps': ['AWS', 'Azure', 'Linux', 'Docker', 'Kubernetes'],
            'Data': ['SQL', 'Python', 'Data Visualization', 'Statistics', 'Machine Learning'],
            'Software Development': ['Python', 'Java', 'SQL', 'Data Structures', 'Algorithms', 'Git']
        }
        
        return domain_map.get(domain, ['Python', 'SQL', 'Java', 'Git', 'Data Structures'])
    
    def _categorize_gaps(self, gaps, category):
        """Categorize skill gaps"""
        critical_skills = ['Python', 'Java', 'SQL', 'Data Structures', 'Algorithms', 'Machine Learning']
        important_skills = ['Git', 'Docker', 'AWS', 'React', 'Deep Learning', 'Data Visualization']
        
        result = []
        for gap in gaps:
            if category == 'critical' and gap in critical_skills:
                result.append(gap)
            elif category == 'important' and gap in important_skills and gap not in critical_skills:
                result.append(gap)
            elif category == 'nice_to_have' and gap not in critical_skills and gap not in important_skills:
                result.append(gap)
        
        return result
    # backend/app/services/skill_analyzer.py (continued)

    def get_recommendations(self, skills, gaps):
        """Get course recommendations based on gaps"""
        recommendations = []
        
        for gap in gaps[:10]:  # Top 10 gaps
            courses = self.course_mapping.get(gap, [])
            if courses:
                recommendations.append({
                    'skill': gap,
                    'priority': 'High' if gap in gaps[:3] else 'Medium',
                    'courses': courses,
                    'platforms': ['Coursera', 'Udemy', 'NPTEL'],
                    'estimated_time': '2-4 weeks' if gap in gaps[:3] else '1-2 weeks'
                })
        
        return {
            'recommendations': recommendations,
            'total_recommendations': len(recommendations),
            'learning_path': self._generate_learning_path(recommendations)
        }
    
    def _generate_learning_path(self, recommendations):
        """Generate a structured learning path"""
        if not recommendations:
            return []
        
        # Sort by priority
        priority_order = {'High': 0, 'Medium': 1, 'Low': 2}
        sorted_recs = sorted(
            recommendations,
            key=lambda x: priority_order.get(x.get('priority', 'Medium'), 1)
        )
        
        path = []
        for i, rec in enumerate(sorted_recs):
            path.append({
                'step': i + 1,
                'skill': rec['skill'],
                'priority': rec['priority'],
                'estimated_time': rec.get('estimated_time', '2 weeks'),
                'courses': rec['courses'],
                'resources': [
                    f'https://www.coursera.org/search?query={rec["skill"]}',
                    f'https://www.udemy.com/courses/search/?q={rec["skill"]}'
                ]
            })
        
        return path