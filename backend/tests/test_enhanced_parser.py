# backend/tests/test_enhanced_parser.py

import pytest
from app.services.enhanced_resume_parser import EnhancedResumeParser

def test_enhanced_parser():
    """Test enhanced resume parser"""
    parser = EnhancedResumeParser()
    
    sample_text = """
    Experienced Python developer with React and Node.js.
    Worked on ML projects using TensorFlow and PyTorch.
    AWS certified with Docker and Kubernetes experience.
    """
    
    result = parser.extract_skills_enhanced(sample_text)
    
    print(f"Skills found: {result['all_skills']}")
    print(f"Skill count: {result['skill_count']}")
    print(f"Categorized: {result['categorized']}")
    
    # Assertions
    assert result['skill_count'] >= 7
    assert 'Python' in result['all_skills']
    assert 'React' in result['all_skills']
    assert 'TensorFlow' in result['all_skills']
    assert 'Docker' in result['all_skills']
    
    print("✅ Enhanced parser tests passed!")

if __name__ == '__main__':
    test_enhanced_parser()