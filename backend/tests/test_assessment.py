# backend/tests/test_assessment.py

import pytest
from app.services.assessment_service import AssessmentService

def test_generate_assessment_without_skills():
    """Verify that an assessment requires resume skills and returns requires_resume=True when empty."""
    res = AssessmentService.generate_assessment([])
    assert res['success'] is False
    assert res['requires_resume'] is True
    assert len(res['questions']) == 0

def test_generate_assessment_individual_skills_exact_match():
    """Verify that all 12 individual extracted skills from the resume are matched and tested individually."""
    suhas_skills = [
        'Java', 'MongoDB', 'Node.js', 'Postman', 'JavaScript',
        'SQL', 'Python', 'VS Code', 'MySQL', 'NLP', 'Git', 'React'
    ]
    res = AssessmentService.generate_assessment(suhas_skills)
    
    assert res['success'] is True
    assert res['requires_resume'] is False
    assert res['total_questions'] == 30
    
    tested_skills = res['tested_skills']
    # Check that individual skills are present individually (e.g. MongoDB, Postman, MySQL, NLP, VS Code)
    for skill_name in ['MongoDB', 'Postman', 'MySQL', 'NLP', 'VS Code', 'Node.js', 'JavaScript', 'React', 'Python', 'Java', 'Git', 'SQL']:
        assert skill_name in tested_skills

def test_generate_assessment_progressive_difficulty():
    """Verify that questions are strictly sequenced from Easy -> Medium -> Hard."""
    skills = ['Python', 'SQL', 'Docker', 'React']
    res = AssessmentService.generate_assessment(skills, questions_per_tier={'easy': 2, 'medium': 2, 'hard': 2})
    
    assert res['success'] is True
    assert res['requires_resume'] is False
    assert res['total_questions'] == 6
    
    questions = res['questions']
    assert len(questions) == 6
    
    # Verify progressive sequencing
    assert questions[0]['difficulty'] == 'easy'
    assert questions[1]['difficulty'] == 'easy'
    assert questions[2]['difficulty'] == 'medium'
    assert questions[3]['difficulty'] == 'medium'
    assert questions[4]['difficulty'] == 'hard'
    assert questions[5]['difficulty'] == 'hard'

def test_evaluate_submission():
    """Verify evaluation computes overall score, difficulty breakdown, and skill breakdown."""
    submitted_answers = {
        'py_e1': 'Tuple',       # Correct (Easy)
        'py_m1': '`deepcopy` recursively duplicates nested objects, while shallow `copy` only copies references to child objects',  # Correct (Medium)
        'py_h1': 'Wrong Answer' # Incorrect (Hard)
    }
    
    evaluation = AssessmentService.evaluate_submission(submitted_answers, time_taken_seconds=45)
    assert evaluation['total_questions'] == 3
    assert evaluation['correct_answers'] == 2
    assert evaluation['score'] == 66.7
    assert 'difficulty_breakdown' in evaluation
    assert evaluation['difficulty_breakdown']['easy']['percentage'] == 100.0
    assert evaluation['difficulty_breakdown']['medium']['percentage'] == 100.0
    assert evaluation['difficulty_breakdown']['hard']['percentage'] == 0.0
