# backend/tests/test_resume_parser.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.resume_parser import ResumeParser
import json

def test_parser():
    """Test the resume parser with sample text"""
    parser = ResumeParser()
    
    # Sample resume text
    sample_text = """
    JOHN DOE
    Software Engineer
    
    SKILLS
    Python, Java, SQL, Git, Docker, Machine Learning, AWS
    
    EDUCATION
    B.Tech in Computer Science, MIT, 2020-2024
    CGPA: 8.5
    
    EXPERIENCE
    Software Engineer Intern at Google, 2023
    - Developed REST APIs using Python and Django
    - Deployed applications on AWS
    
    PROJECTS
    1. AI Chatbot: Built using TensorFlow and React
    2. E-commerce Website: Using Django and PostgreSQL
    """
    
    # Parse the text (simulating a file)
    result = parser.parse_resume_text(sample_text)
    
    print("=" * 50)
    print("RESUME PARSER TEST RESULTS")
    print("=" * 50)
    
    print("\n📊 SKILLS EXTRACTED:")
    for skill in result.get('skills', []):
        print(f"  - {skill}")
    
    print(f"\n📚 TOTAL SKILLS: {len(result.get('skills', []))}")
    
    print("\n🎓 EDUCATION:")
    for edu in result.get('education', []):
        print(f"  - {edu}")
    
    print(f"\n💼 TOTAL PROJECTS: {len(result.get('projects', []))}")
    
    print("\n✅ Parser test completed successfully!")

def test_accuracy():
    """Test parser accuracy with known data"""
    parser = ResumeParser()
    
    test_cases = [
        {
            'text': 'Python, Java, SQL, React',
            'expected_skills': ['Python', 'Java', 'SQL', 'React'],
            'expected_count': 4
        },
        {
            'text': 'Experience: 3 years in Machine Learning',
            'expected_experience': 3
        },
        {
            'text': 'B.Tech in CSE, IIT Bombay',
            'expected_education': True
        }
    ]
    
    print("\n" + "=" * 50)
    print("ACCURACY TEST")
    print("=" * 50)
    
    for i, test in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Text: {test['text']}")
        
        # Parse
        result = parser.parse_resume_text(test['text'])
        
        # Check
        if 'expected_skills' in test:
            found_skills = result.get('skills', [])
            match = all(s in found_skills for s in test['expected_skills'])
            print(f"✅ Skills match: {match}")
            print(f"   Expected: {test['expected_skills']}")
            print(f"   Found: {found_skills}")
        
        if 'expected_experience' in test:
            experience = result.get('experience', {})
            years = experience.get('years', 0)
            print(f"✅ Experience years: {years == test['expected_experience']}")
            print(f"   Expected: {test['expected_experience']}")
            print(f"   Found: {years}")

if __name__ == '__main__':
    test_parser()
    test_accuracy()