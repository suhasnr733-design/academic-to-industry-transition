# backend/app/services/resume_parser.py

import re
import PyPDF2
import docx
from typing import List, Dict, Any
try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        nlp = None
except ImportError:
    spacy = None
    nlp = None
import nltk

class ResumeParser:
    """Parse resumes and extract structured information"""
    
    def __init__(self):
        # Predefined skill sets
        self.skill_keywords = {
            'Programming Languages': ['Python', 'Java', 'C++', 'JavaScript', 'C#', 'Ruby', 'Swift', 'Kotlin', 'Go', 'Rust'],
            'Web Technologies': ['HTML', 'CSS', 'React', 'Angular', 'Vue.js', 'Node.js', 'Django', 'Flask', 'Spring', 'Bootstrap'],
            'Database': ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'Redis', 'Firebase', 'Elasticsearch'],
            'Cloud & DevOps': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'DevOps', 'Terraform', 'Ansible'],
            'ML/AI': ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn'],
            'Data Science': ['Data Science', 'Data Analysis', 'Data Visualization', 'Statistics', 'Tableau', 'Power BI'],
            'Tools': ['Git', 'JIRA', 'Linux', 'Excel', 'VS Code', 'IntelliJ', 'Postman'],
            'Soft Skills': ['Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking', 'Time Management']
        }
        
        # Flatten skill list for quick lookup
        self.all_skills = [skill for skills in self.skill_keywords.values() for skill in skills]
        
        # Education keywords
        self.education_patterns = [
            r'(B\.E|B\.Tech|M\.E|M\.Tech|B\.Sc|M\.Sc|BCA|MCA|PhD|B\.A|M\.A|MBA)\s+[^\n]*',
            r'(Bachelor|Master|Doctorate|M\.Phil)\s+(?:of|in|of Science|of Arts)\s+[^\n]*'
        ]
        
        # Experience patterns
        self.experience_patterns = [
            r'(\d+)\+?\s*(?:years?|yrs?|Years?)\s+(?:of\s+)?(?:experience|Experience)',
            r'Experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)'
        ]
        # backend/app/services/resume_parser.py (continued)

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error reading PDF: {e}")
        return text

    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        text = ""
        try:
            doc = docx.Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text += cell.text + " "
                text += "\n"
        except Exception as e:
            print(f"Error reading DOCX: {e}")
        return text

    def extract_text(self, file_path: str, file_type: str) -> str:
        """Extract text based on file type"""
        if file_type.lower() == 'pdf':
            return self.extract_text_from_pdf(file_path)
        elif file_type.lower() in ['docx', 'doc']:
            return self.extract_text_from_docx(file_path)
        elif file_type.lower() == 'txt':
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
            except Exception as e:
                print(f"Error reading TXT: {e}")
                return ""
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        # backend/app/services/resume_parser.py (continued)

    def extract_skills(self, text: str) -> List[str]:
        """Extract technical skills from text using NLP and keyword matching"""
        found_skills = []
        text_lower = text.lower()
        
        # Method 1: Keyword matching
        for skill in self.all_skills:
            # Check if skill appears as whole word
            skill_lower = skill.lower()
            if re.search(r'\b' + re.escape(skill_lower) + r'\b', text_lower):
                found_skills.append(skill)
        
        # Method 2: spaCy NER for organizations and products
        if nlp is not None:
            try:
                doc = nlp(text)
                for ent in doc.ents:
                    if ent.label_ in ["ORG", "PRODUCT"] and ent.text in self.all_skills:
                        if ent.text not in found_skills:
                            found_skills.append(ent.text)
            except Exception:
                pass
        
        # Method 3: Extract from bullet points using patterns
        skill_patterns = [
            r'(?:Skills|Technical Skills|Technologies|Languages)\s*[:\-]\s*([^\n]+)',
            r'(?:Proficient|Experienced|Expertise)\s+in\s+([^\n.]+)'
        ]
        for pattern in skill_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                skills_text = match.group(1)
                for skill in self.all_skills:
                    if skill.lower() in skills_text.lower() and skill not in found_skills:
                        found_skills.append(skill)
        
        return list(set(found_skills))  # Remove duplicates
    # backend/app/services/resume_parser.py (continued)

    def extract_education(self, text: str) -> List[Dict[str, Any]]:
        """Extract education details from resume"""
        education_list = []
        text_lower = text.lower()
        
        # Pattern 1: Standard degree patterns
        for pattern in self.education_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                education_list.append({
                    'degree': match.strip(),
                    'type': 'degree'
                })
        
        # Pattern 2: University/College names
        university_pattern = r'([A-Z][a-zA-Z\s]+(?:University|College|Institute|School|IIT|NIT))'
        universities = re.findall(university_pattern, text)
        for uni in universities:
            education_list.append({
                'institution': uni.strip(),
                'type': 'institution'
            })
        
        # Pattern 3: GPA/Percentage
        gpa_pattern = r'(?:GPA|CGPA)[\s:]*(\d+\.?\d*)'
        gpa_matches = re.findall(gpa_pattern, text, re.IGNORECASE)
        for gpa in gpa_matches:
            education_list.append({
                'gpa': float(gpa),
                'type': 'grade'
            })
        
        # Combine education entries
        combined_education = []
        temp = {}
        
        for item in education_list:
            if item['type'] == 'degree' and 'degree' not in temp:
                temp['degree'] = item['degree']
            elif item['type'] == 'institution' and 'institution' not in temp:
                temp['institution'] = item['institution']
            elif item['type'] == 'grade' and 'gpa' not in temp:
                temp['gpa'] = item['gpa']
        
        if temp:
            combined_education.append(temp)
        
        return combined_education

    def extract_experience(self, text: str) -> Dict[str, Any]:
        """Extract work experience information"""
        experience_data = {
            'years': None,
            'months': None,
            'companies': [],
            'roles': [],
            'description': []
        }
        
        # Extract years of experience
        for pattern in self.experience_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    years = int(re.search(r'\d+', str(match)).group())
                    if experience_data['years'] is None or years > experience_data['years']:
                        experience_data['years'] = years
                except:
                    pass
        
        # Extract company names
        company_pattern = r'(?:at|@|with)\s+([A-Z][a-zA-Z\s]+(?:Inc|Corp|Ltd|Private|Limited|Technologies|Systems|Solutions))'
        companies = re.findall(company_pattern, text, re.IGNORECASE)
        experience_data['companies'] = list(set(companies))
        
        # Extract job roles/titles
        role_patterns = [
            r'([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Analyst|Scientist|Manager|Director|Consultant|Architect))',
            r'(?:Role|Designation|Position)[\s:]+([A-Z][a-zA-Z\s]+)'
        ]
        roles = []
        for pattern in role_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            roles.extend(matches)
        experience_data['roles'] = list(set(roles))
        
        return experience_data
    # backend/app/services/resume_parser.py (continued)

    def extract_projects(self, text: str) -> List[Dict[str, Any]]:
        """Extract project information from resume"""
        projects = []
        
        # Find project section
        project_section_patterns = [
            r'(?:Projects|Academic Projects|Personal Projects|Project Experience)[\s\S]*?(?=\n\n|SECTION|REFERENCES)',
            r'(?:PROJECTS|ACADEMIC PROJECTS)[\s\S]*?(?=\n\n|REFERENCES)'
        ]
        
        project_text = None
        for pattern in project_section_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                project_text = match.group(0)
                break
        
        if project_text:
            # Split by common delimiters
            project_items = re.split(r'\n\s*[•●○\-*]\s*', project_text)
            
            for item in project_items[1:]:  # Skip the section header
                if len(item.strip()) > 20:
                    project = {
                        'title': '',
                        'description': '',
                        'technologies': [],
                        'duration': ''
                    }
                    
                    # Try to extract title
                    title_match = re.search(r'^([A-Z][a-zA-Z\s]+):', item)
                    if title_match:
                        project['title'] = title_match.group(1).strip()
                    
                    # Extract technologies
                    tech_pattern = r'(?:using|with|technologies?|tools?)[\s:]+([^\n.]+)'
                    tech_match = re.search(tech_pattern, item, re.IGNORECASE)
                    if tech_match:
                        tech_text = tech_match.group(1)
                        for skill in self.all_skills:
                            if skill.lower() in tech_text.lower():
                                project['technologies'].append(skill)
                    
                    # Extract duration
                    duration_match = re.search(r'(\d+)\s*(?:months?|mths?)', item, re.IGNORECASE)
                    if duration_match:
                        project['duration'] = duration_match.group(0)
                    
                    project['description'] = item.strip()
                    projects.append(project)
        
        return projects
    # backend/app/services/resume_parser.py (continued)

    def parse_resume(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Main method to parse resume and extract all information"""
        try:
            # Extract text
            text = self.extract_text(file_path, file_type)
            
            if not text or len(text.strip()) < 50:
                return {
                    'error': 'Could not extract text from file. File might be empty or image-based.',
                    'success': False
                }
            
            # Extract all sections
            result = {
                'success': True,
                'skills': self.extract_skills(text),
                'education': self.extract_education(text),
                'experience': self.extract_experience(text),
                'projects': self.extract_projects(text),
                'text_preview': text[:500] + '...' if len(text) > 500 else text
            }
            
            # Add statistics
            result['stats'] = {
                'skill_count': len(result['skills']),
                'education_count': len(result['education']),
                'project_count': len(result['projects']),
                'total_words': len(text.split())
            }
            
            return result
            
        except Exception as e:
            return {
                'error': str(e),
                'success': False
            }

    def parse_resume_text(self, text: str) -> Dict[str, Any]:
        """Parse raw resume text directly"""
        return {
            'success': True,
            'skills': self.extract_skills(text),
            'education': self.extract_education(text),
            'experience': self.extract_experience(text),
            'projects': self.extract_projects(text)
        }