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
            'Deep Learning': ['Deep Learning Specialization', 'Neural Networks', 'PyTorch for Deep Learning'],
            'AWS': ['AWS Certified Solutions Architect', 'AWS Cloud Practitioner', 'AWS DevOps'],
            'Azure': ['Microsoft Azure Fundamentals (AZ-900)', 'Azure Cloud Solutions Architect', 'Azure DevOps Engineer'],
            'Docker': ['Docker Mastery', 'DevOps with Docker', 'Containerization Essentials'],
            'Kubernetes': ['Kubernetes Fundamentals', 'Certified Kubernetes Administrator (CKA)', 'Microservices with K8s'],
            'SQL': ['SQL for Data Science', 'Database Management Systems', 'Advanced SQL & Query Optimization'],
            'React': ['React Complete Guide', 'Frontend Development with React', 'React Native Mastery'],
            'JavaScript': ['JavaScript: The Advanced Concepts', 'ES6+ Modern JavaScript', 'Asynchronous JS Deep Dive'],
            'Django': ['Django Full Stack', 'Django REST Framework', 'Python Web Development with Django'],
            'Git': ['Git and GitHub Mastery', 'Version Control with Git', 'Advanced Git Workflows'],
            'Data Science': ['Data Science Bootcamp', 'Data Analysis with Python', 'Statistics for Data Science'],
            'Data Structures': ['Mastering Data Structures & Algorithms', 'Data Structures in Java & Python', 'LeetCode Problem Solving Bootcamp'],
            'Algorithms': ['Design & Analysis of Algorithms', 'Algorithms Specialization (Coursera)', 'Competitive Programming & Algorithms'],
            'Linux': ['Linux Command Line & Shell Scripting', 'Hands-On Linux Administration', 'Linux for Developers'],
            'Jenkins': ['Jenkins CI/CD Automation', 'Mastering Jenkins for DevOps', 'Continuous Integration & Deployment Pipeline'],
            'HTML': ['HTML5 & Modern Web Standards', 'Responsive Web Design Essentials', 'Semantic HTML5 & Accessibility'],
            'CSS': ['Advanced CSS & Sass', 'Modern CSS with Flexbox & Grid', 'TailwindCSS & Modern UI Design'],
            'Redux': ['Redux Toolkit & State Management', 'Modern React with Redux', 'Advanced Frontend Architecture'],
            'Node.js': ['Node.js Developer Course', 'Building RESTful APIs with Node & Express', 'Full-Stack Node.js Mastery'],
            'APIs': ['RESTful API Design & Architecture', 'API Development & Testing with Postman', 'Microservices & REST APIs'],
            'PyTorch': ['Deep Learning with PyTorch', 'PyTorch for Deep Learning Bootcamp', 'Practical Neural Networks with PyTorch'],
            'Statistics': ['Practical Statistics for Data Science', 'Inferential Statistics Specialization', 'Probability & Statistics for ML'],
            'Data Visualization': ['Data Visualization with Python & Matplotlib', 'Tableau & PowerBI Data Storytelling', 'Interactive Visualizations with D3.js'],
            'Flutter': ['Flutter & Dart Complete Guide', 'Mobile App Development with Flutter', 'Cross-Platform Mobile Mastery'],
            'Kotlin': ['Kotlin for Android Development', 'Android App Development Masterclass', 'Advanced Kotlin Programming'],
            'Swift': ['iOS App Development with Swift', 'SwiftUI Masterclass', 'Advanced iOS Architecture'],
            'FastAPI': ['FastAPI Modern Python Web APIs', 'Building High-Performance APIs with FastAPI', 'Microservices with FastAPI'],
            'GraphQL': ['GraphQL Full-Stack Masterclass', 'Building Modern APIs with GraphQL', 'Apollo Client & GraphQL APIs'],
            'Redis': ['Redis In-Memory Database Mastery', 'High-Performance Caching with Redis', 'System Design with Redis'],
            'Kafka': ['Apache Kafka for Event-Driven Architecture', 'Kafka Real-Time Streaming', 'Distributed Messaging with Kafka'],
            'Selenium': ['Selenium WebDriver with Java & Python', 'Automated Software Testing Mastery', 'SDET Automation Bootcamp'],
            'Figma': ['UI/UX Design with Figma', 'Figma to Code Masterclass', 'Design Systems in Figma'],
            'Solidity': ['Solidity & Ethereum Smart Contracts', 'Web3 & Blockchain Development', 'Decentralized Apps (DApps) Masterclass'],
            'Unity': ['Unity Game Development Masterclass', 'C# Game Programming with Unity', '3D Game Physics & Design']
        }
        self._lower_course_mapping = {k.lower(): v for k, v in self.course_mapping.items()}

        # 25+ Comprehensive Industry Job Role Benchmarks
        self.skill_map = {
            # 1. Core Software Engineering
            'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'HTML', 'CSS', 'REST APIs', 'MongoDB'],
            'Software Engineer': ['Python', 'Java', 'SQL', 'Data Structures', 'Algorithms', 'Git', 'OOP', 'DBMS'],
            'Frontend Developer': ['JavaScript', 'React', 'HTML', 'CSS', 'Tailwind', 'Redux', 'TypeScript', 'Git'],
            'Backend Developer': ['Python', 'Java', 'SQL', 'Node.js', 'Django', 'FastAPI', 'Microservices', 'Git', 'Redis'],
            'Mobile App Developer (Android/iOS)': ['Flutter', 'React Native', 'Kotlin', 'Swift', 'Java', 'REST APIs', 'Git'],
            'C++ / Systems Developer': ['C++', 'C', 'Data Structures', 'Algorithms', 'Linux', 'Multithreading', 'Git'],

            # 2. Cloud, DevOps & Infrastructure
            'DevOps Engineer': ['Linux', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Jenkins', 'Terraform', 'Git'],
            'Cloud Engineer (AWS/Azure/GCP)': ['AWS', 'Azure', 'GCP', 'Linux', 'Terraform', 'Docker', 'Python'],
            'Site Reliability Engineer (SRE)': ['Linux', 'Python', 'Kubernetes', 'Docker', 'CI/CD', 'Prometheus', 'Grafana'],
            'Database Administrator (DBA)': ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Database Tuning', 'Linux'],
            'Infrastructure Engineer': ['Linux', 'Terraform', 'Ansible', 'Kubernetes', 'Docker', 'Git'],

            # 3. Data Science, AI & Big Data
            'Data Scientist': ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Pandas', 'Data Visualization', 'Deep Learning'],
            'Data Analyst': ['SQL', 'Python', 'Excel', 'Power BI', 'Tableau', 'Statistics', 'Data Visualization'],
            'Data Engineer / Big Data': ['Python', 'SQL', 'Spark', 'Kafka', 'Hadoop', 'Data Pipelines', 'ETL', 'AWS'],
            'ML Engineer': ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'SQL', 'Docker', 'AWS'],
            'AI / NLP Engineer': ['Python', 'NLP', 'Transformers', 'HuggingFace', 'PyTorch', 'Deep Learning', 'SQL'],
            'Computer Vision Engineer': ['Python', 'OpenCV', 'PyTorch', 'TensorFlow', 'Image Processing', 'Deep Learning', 'C++'],

            # 4. Cybersecurity & Networks
            'Cybersecurity Analyst': ['Network Security', 'Linux', 'Ethical Hacking', 'SIEM', 'Cryptography', 'Python'],
            'Information Security Engineer': ['Firewalls', 'Cloud Security', 'Linux', 'Penetration Testing', 'Python'],
            'Network Engineer': ['TCP/IP', 'Routing & Switching', 'Cisco', 'DNS', 'DHCP', 'Linux', 'Wireshark'],

            # 5. QA, Embedded & Emerging Tech
            'QA Automation Engineer (SDET)': ['Selenium', 'Java', 'Python', 'JUnit', 'PyTest', 'Postman', 'CI/CD', 'Git'],
            'UI/UX Developer': ['Figma', 'HTML', 'CSS', 'JavaScript', 'React', 'Tailwind', 'Responsive Design'],
            'Technical Product Manager': ['Agile', 'Scrum', 'Jira', 'SQL', 'Product Roadmapping', 'User Stories'],
            'Blockchain Developer': ['Solidity', 'Ethereum', 'Smart Contracts', 'Web3.js', 'Node.js', 'Git'],
            'Embedded Systems Engineer': ['Embedded C', 'Microcontrollers', 'RTOS', 'ARM', 'IoT', 'C++', 'Linux'],
            'Game Developer': ['Unity', 'C#', 'Unreal Engine', 'C++', '3D Math', 'Physics', 'Git']
        }
    
    def predict_top_roles(self, current_skills, top_n=3):
        """Dynamically ranks student skills against all 25+ roles and returns top fits"""
        student_set = {str(s).strip().lower() for s in (current_skills or [])}
        scored = []

        for role_name, req_skills in self.skill_map.items():
            req_set = {r.strip().lower() for r in req_skills}
            matched = [s for s in req_set if any(u in s or s in u for u in student_set)]
            ratio = (len(matched) / len(req_set)) if req_set else 0
            scored.append((role_name, ratio))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [r[0] for r in scored[:top_n]]
    
    def analyze_gaps(self, current_skills, target_role=None, domain=None):
        """Analyze skill gaps for a target role"""
        target_skills = self._get_target_skills(target_role, domain)
        
        if not target_skills:
            return {
                'current_skills': current_skills,
                'target_skills': [],
                'missing_skills': [],
                'matching_skills': [],
                'match_percentage': 0
            }
        
        skill_aliases = {
            'amazon web services': 'aws',
            'aws cloud': 'aws',
            'react.js': 'react',
            'reactjs': 'react',
            'node.js': 'node.js',
            'nodejs': 'node.js',
            'rest api': 'apis',
            'restful api': 'apis',
            'ml': 'machine learning',
            'dl': 'deep learning',
            'dsa': 'data structures',
            'data structure': 'data structures',
            'algo': 'algorithms',
            'algorithm': 'algorithms'
        }

        current_normalized = set()
        for s in (current_skills or []):
            s_low = str(s).strip().lower()
            current_normalized.add(s_low)
            if s_low in skill_aliases:
                current_normalized.add(skill_aliases[s_low])
        
        matching = []
        missing = []
        
        for t_skill in target_skills:
            t_low = str(t_skill).strip().lower()
            alias = skill_aliases.get(t_low, t_low)
            if t_low in current_normalized or alias in current_normalized:
                matching.append(t_skill)
            else:
                missing.append(t_skill)
        
        critical_gaps = self._categorize_gaps(missing, 'critical')
        important_gaps = self._categorize_gaps(missing, 'important')
        nice_to_have = self._categorize_gaps(missing, 'nice_to_have')
        
        match_percentage = round((len(matching) / len(target_skills)) * 100, 2) if target_skills else 0
        
        return {
            'current_skills': current_skills,
            'target_skills': target_skills,
            'matching_skills': matching,
            'missing_skills': missing,
            'critical_gaps': critical_gaps,
            'important_gaps': important_gaps,
            'nice_to_have': nice_to_have,
            'gaps_by_category': {
                'critical': critical_gaps,
                'important': important_gaps,
                'nice_to_have': nice_to_have
            },
            'total_gaps': len(missing),
            'match_percentage': match_percentage
        }
    
    def _get_target_skills(self, target_role, domain):
        """Get target skills for a role/domain across 25+ roles"""
        if target_role and target_role in self.skill_map:
            return self.skill_map[target_role]
        
        # Check case-insensitive match
        if target_role:
            for k, v in self.skill_map.items():
                if k.lower() == target_role.lower():
                    return v
        
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

    def get_recommendations(self, skills, gaps):
        """Get course recommendations based on gaps"""
        recommendations = []
        
        for gap in gaps[:10]:  # Top 10 gaps
            gap_clean = str(gap).strip()
            gap_lower = gap_clean.lower()
            
            courses = self._lower_course_mapping.get(gap_lower) or self.course_mapping.get(gap_clean)
            if not courses:
                courses = [
                    f'{gap_clean} Fundamentals & Core Concepts',
                    f'Applied {gap_clean} Real-World Projects',
                    f'Advanced {gap_clean} Certification Bootcamp'
                ]
            
            priority = 'High' if gap in gaps[:3] else 'Medium'
            recommendations.append({
                'skill': gap_clean,
                'priority': priority,
                'courses': courses,
                'platforms': ['Coursera', 'Udemy', 'NPTEL'],
                'estimated_time': '2-4 weeks' if priority == 'High' else '1-2 weeks'
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
                    f'https://www.udemy.com/courses/search/?q={rec["skill"]}',
                    f'https://nptel.ac.in/courses'
                ]
            })
        
        return path