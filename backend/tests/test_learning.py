import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import pytest
from app import create_app, db
from app.models import User, Resume, LearningProgress, LearningBookmark
from app.services.learning_service import LearningService

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_prerequisite_ordering():
    service = LearningService()
    missing = ['Algorithms', 'Data Structures', 'SQL']
    curr = ['Python']
    ordered = service._order_skills_by_prerequisites(missing, curr)
    
    # Data Structures must come before Algorithms
    assert ordered.index('Data Structures') < ordered.index('Algorithms')

def test_resume_specific_roadmap(app):
    with app.app_context():
        # Create user
        user = User(username='test_learner', email='learner@test.com', full_name='Learner Test')
        user.set_password('Password@123')
        db.session.add(user)
        db.session.commit()

        # Create Resume A (Software Engineer)
        resume_a = Resume(
            user_id=user.id,
            filename='resume_a.pdf',
            file_path='uploads/resume_a.pdf',
            skills=['Python', 'Git'],
            recommended_roles=['Software Engineer']
        )
        # Create Resume B (Data Analyst)
        resume_b = Resume(
            user_id=user.id,
            filename='resume_b.pdf',
            file_path='uploads/resume_b.pdf',
            skills=['Python', 'Excel', 'Statistics'],
            recommended_roles=['Data Analyst']
        )
        db.session.add_all([resume_a, resume_b])
        db.session.commit()

        service = LearningService()

        # Roadmap for Resume A
        roadmap_a = service.get_roadmap_for_resume(user_id=user.id, resume_id=resume_a.id)
        assert roadmap_a['resume_id'] == resume_a.id
        assert roadmap_a['target_role'] == 'Software Engineer'
        skills_a = [s['skill_name'].lower() for s in roadmap_a['skills']]

        # Roadmap for Resume B
        roadmap_b = service.get_roadmap_for_resume(user_id=user.id, resume_id=resume_b.id)
        assert roadmap_b['resume_id'] == resume_b.id
        assert roadmap_b['target_role'] == 'Data Analyst'
        skills_b = [s['skill_name'].lower() for s in roadmap_b['skills']]

        # Ensure Resume B is isolated from Resume A
        assert roadmap_a['resume_id'] != roadmap_b['resume_id']
        assert roadmap_a['target_role'] != roadmap_b['target_role']
