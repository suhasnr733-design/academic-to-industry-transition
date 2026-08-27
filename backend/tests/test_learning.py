import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import pytest
from app import create_app, db
from app.models import User, Resume, LearningProgress, LearningBookmark
from app.services.learning_service import LearningService
from app.services.youtube_service import YouTubeService

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
    """Verify prerequisite graph orders foundational skills before dependent skills"""
    service = LearningService()
    missing = ['Algorithms', 'Data Structures', 'SQL']
    curr = ['Python']
    ordered = service._order_skills_by_prerequisites(missing, curr)
    assert ordered.index('Data Structures') < ordered.index('Algorithms')

def test_skill_classification():
    """Verify technical skills are correctly classified into 7 standard categories"""
    service = LearningService()
    assert service.classify_skill('Python') == 'Programming Languages'
    assert service.classify_skill('Java') == 'Programming Languages'
    assert service.classify_skill('React') == 'Web Technologies / Frameworks'
    assert service.classify_skill('SQL') == 'Databases'
    assert service.classify_skill('TensorFlow') == 'AI / Machine Learning'
    assert service.classify_skill('AWS') == 'Cloud'
    assert service.classify_skill('Git') == 'Development Tools'

def test_scenario_1_resume_a_only_skills_and_resources(app):
    """Scenario 1: Resume A produces only Resume A skills/resources"""
    with app.app_context():
        user = User(username='user_a', email='usera@test.com', full_name='User A')
        user.set_password('Password@123')
        db.session.add(user)
        db.session.commit()

        resume_a = Resume(
            user_id=user.id,
            filename='resume_a.pdf',
            file_path='uploads/resume_a.pdf',
            skills=['Java', 'React', 'Git'],
            recommended_roles=['Software Engineer']
        )
        db.session.add(resume_a)
        db.session.commit()

        service = LearningService()
        roadmap_a = service.get_roadmap_for_resume(user_id=user.id, resume_id=resume_a.id)

        assert roadmap_a['has_resume'] is True
        assert roadmap_a['resume_id'] == resume_a.id
        assert roadmap_a['target_role'] == 'Software Engineer'
        skills_a = [s['skill_name'] for s in roadmap_a['skills']]
        assert 'Java' in skills_a
        assert 'React' in skills_a
        assert 'Git' in skills_a
        assert 'Power BI' not in skills_a
        assert 'Excel' not in skills_a

def test_scenario_2_resume_b_only_skills_and_resources(app):
    """Scenario 2: Resume B produces only Resume B skills/resources"""
    with app.app_context():
        user = User(username='user_b', email='userb@test.com', full_name='User B')
        user.set_password('Password@123')
        db.session.add(user)
        db.session.commit()

        resume_b = Resume(
            user_id=user.id,
            filename='resume_b.pdf',
            file_path='uploads/resume_b.pdf',
            skills=['Python', 'Excel', 'Power BI'],
            recommended_roles=['Data Analyst']
        )
        db.session.add(resume_b)
        db.session.commit()

        service = LearningService()
        roadmap_b = service.get_roadmap_for_resume(user_id=user.id, resume_id=resume_b.id)

        assert roadmap_b['has_resume'] is True
        assert roadmap_b['resume_id'] == resume_b.id
        assert roadmap_b['target_role'] == 'Data Analyst'
        skills_b = [s['skill_name'] for s in roadmap_b['skills']]
        assert 'Power BI' in skills_b
        assert 'Excel' in skills_b
        assert 'Python' in skills_b
        assert 'Java' not in skills_b
        assert 'React' not in skills_b

def test_scenario_3_switching_a_to_b_removes_a_recommendations(app):
    """Scenario 3: Switching Resume A -> Resume B removes all Resume A-only recommendations"""
    with app.app_context():
        user = User(username='user_switch_ab', email='switchab@test.com', full_name='Switch AB')
        user.set_password('Password@123')
        db.session.add(user)
        db.session.commit()

        resume_a = Resume(user_id=user.id, filename='a.pdf', file_path='uploads/a.pdf', skills=['Java', 'Git'], recommended_roles=['Software Engineer'])
        resume_b = Resume(user_id=user.id, filename='b.pdf', file_path='uploads/b.pdf', skills=['Python', 'Tableau'], recommended_roles=['Data Analyst'])
        db.session.add_all([resume_a, resume_b])
        db.session.commit()

        service = LearningService()

        roadmap_a = service.get_roadmap_for_resume(user_id=user.id, resume_id=resume_a.id)
        roadmap_b = service.get_roadmap_for_resume(user_id=user.id, resume_id=resume_b.id)

        skills_a = {s['skill_name'] for s in roadmap_a['skills']}
        skills_b = {s['skill_name'] for s in roadmap_b['skills']}

        # Resume B does not inherit Resume A skills
        assert 'Java' in skills_a
        assert 'Java' not in skills_b
        assert 'Tableau' in skills_b
        assert 'Tableau' not in skills_a

def test_scenario_4_switching_b_to_a_restores_a_learning_path(app):
    """Scenario 4: Switching Resume B -> Resume A restores Resume A's exact Learning Path"""
    with app.app_context():
        user = User(username='user_restore_ba', email='restoreba@test.com', full_name='Restore BA')
        user.set_password('Password@123')
        db.session.add(user)
        db.session.commit()

        resume_a = Resume(user_id=user.id, filename='a.pdf', file_path='uploads/a.pdf', skills=['C++', 'OpenGL'], recommended_roles=['Game Developer'])
        resume_b = Resume(user_id=user.id, filename='b.pdf', file_path='uploads/b.pdf', skills=['Node.js', 'Express'], recommended_roles=['Backend Developer'])
        db.session.add_all([resume_a, resume_b])
        db.session.commit()

        service = LearningService()

        # Fetch A, fetch B, then fetch A again
        roadmap_a1 = service.get_roadmap_for_resume(user_id=user.id, resume_id=resume_a.id)
        roadmap_b = service.get_roadmap_for_resume(user_id=user.id, resume_id=resume_b.id)
        roadmap_a2 = service.get_roadmap_for_resume(user_id=user.id, resume_id=resume_a.id)

        assert roadmap_a1['resume_id'] == roadmap_a2['resume_id']
        assert [s['skill_name'] for s in roadmap_a1['skills']] == [s['skill_name'] for s in roadmap_a2['skills']]

def test_scenario_5_progress_isolation(app):
    """Scenario 5: Progress for Resume A does not affect Resume B"""
    with app.app_context():
        user = User(username='user_prog_iso', email='progiso@test.com', full_name='Progress Isolation')
        user.set_password('Password@123')
        db.session.add(user)
        db.session.commit()

        resume_a = Resume(user_id=user.id, filename='a.pdf', file_path='uploads/a.pdf', skills=['Java'], recommended_roles=['Software Engineer'])
        resume_b = Resume(user_id=user.id, filename='b.pdf', file_path='uploads/b.pdf', skills=['Python'], recommended_roles=['Data Scientist'])
        db.session.add_all([resume_a, resume_b])
        db.session.commit()

        service = LearningService()

        # Mark Java complete for Resume A
        service.update_skill_progress(user_id=user.id, resume_id=resume_a.id, skill_name='Java', stage='learn', is_completed=True)

        prog_a = LearningProgress.query.filter_by(user_id=user.id, resume_id=resume_a.id, skill_name='Java').first()
        prog_b = LearningProgress.query.filter_by(user_id=user.id, resume_id=resume_b.id, skill_name='Java').first()

        assert prog_a is not None and prog_a.learn_completed is True
        assert prog_b is None

def test_scenario_6_bookmark_isolation(app):
    """Scenario 6: Bookmarks for Resume A do not appear for Resume B"""
    with app.app_context():
        user = User(username='user_bm_iso', email='bmiso@test.com', full_name='Bookmark Isolation')
        user.set_password('Password@123')
        db.session.add(user)
        db.session.commit()

        resume_a = Resume(user_id=user.id, filename='a.pdf', file_path='uploads/a.pdf', skills=['Java'], recommended_roles=['Software Engineer'])
        resume_b = Resume(user_id=user.id, filename='b.pdf', file_path='uploads/b.pdf', skills=['Python'], recommended_roles=['Data Scientist'])
        db.session.add_all([resume_a, resume_b])
        db.session.commit()

        bookmark_a = LearningBookmark(
            user_id=user.id,
            resume_id=resume_a.id,
            skill_name='Java',
            resource_type='youtube',
            title='Java Masterclass'
        )
        db.session.add(bookmark_a)
        db.session.commit()

        bookmarks_a = LearningBookmark.query.filter_by(user_id=user.id, resume_id=resume_a.id).all()
        bookmarks_b = LearningBookmark.query.filter_by(user_id=user.id, resume_id=resume_b.id).all()

        assert len(bookmarks_a) == 1
        assert len(bookmarks_b) == 0

def test_scenario_7_skill_specific_courses(app):
    """Scenario 7: Courses are strictly skill-specific (Java gets Java courses, Python gets Python courses)"""
    service = LearningService()
    courses_java = service._get_scored_courses('Java', 'Software Engineer', ['Java'], is_existing=True)
    courses_python = service._get_scored_courses('Python', 'Data Analyst', ['Python'], is_existing=True)

    assert any('Java' in c['title'] or 'Java' in c['url'] for c in courses_java)
    assert any('Python' in c['title'] or 'Python' in c['url'] for c in courses_python)

    java_urls = [c['url'] for c in courses_java]
    python_urls = [c['url'] for c in courses_python]
    assert java_urls != python_urls

def test_scenario_8_youtube_queries_skill_and_language_specific():
    """Scenario 8: YouTube queries are strictly skill-specific AND language-specific (en, hi, en+hi)"""
    yt = YouTubeService()

    # Skill Java + English
    q_java_en = yt._build_contextual_query('Java', 'Software Engineer', 'learn', language='en')
    assert 'Java' in q_java_en
    assert 'English' in q_java_en

    # Skill Java + Hindi
    q_java_hi = yt._build_contextual_query('Java', 'Software Engineer', 'learn', language='hi')
    assert 'Java' in q_java_hi
    assert 'Hindi' in q_java_hi

    # Skill Python + English + Hindi
    q_py_en_hi = yt._build_contextual_query('Python', 'Data Analyst', 'practice', language='en+hi')
    assert 'Python' in q_py_en_hi
    assert 'English Hindi' in q_py_en_hi

    assert q_java_en != q_java_hi
    assert q_java_en != q_py_en_hi

def test_scenario_9_no_resume_selected_empty_state(app):
    """Scenario 9: No resume selected or invalid resume_id produces has_resume=false and no fake recommendations"""
    with app.app_context():
        user = User(username='user_empty_state', email='empty@test.com', full_name='Empty State')
        user.set_password('Password@123')
        db.session.add(user)
        db.session.commit()

        service = LearningService()

        # No resume uploaded
        roadmap_empty = service.get_roadmap_for_resume(user_id=user.id, resume_id=None)
        assert roadmap_empty['has_resume'] is False
        assert roadmap_empty['resume_id'] is None
        assert len(roadmap_empty['skills']) == 0

        # Invalid resume_id supplied
        roadmap_invalid = service.get_roadmap_for_resume(user_id=user.id, resume_id=999999)
        assert roadmap_invalid['has_resume'] is False
        assert roadmap_invalid['resume_id'] is None
        assert len(roadmap_invalid['skills']) == 0

def test_scenario_10_cross_user_resume_access_denied(app):
    """Scenario 10: Security check - User A cannot access User B's resume using resume_id"""
    with app.app_context():
        user_1 = User(username='user_one', email='one@test.com', full_name='User One')
        user_1.set_password('Password@123')
        user_2 = User(username='user_two', email='two@test.com', full_name='User Two')
        user_2.set_password('Password@123')
        db.session.add_all([user_1, user_2])
        db.session.commit()

        # Resume belonging to User 2
        resume_user_2 = Resume(user_id=user_2.id, filename='user2_secret.pdf', file_path='uploads/u2.pdf', skills=['SecretSkill'])
        db.session.add(resume_user_2)
        db.session.commit()

        service = LearningService()

        # User 1 attempts to query User 2's resume_id
        roadmap_unauthorized = service.get_roadmap_for_resume(user_id=user_1.id, resume_id=resume_user_2.id)

        assert roadmap_unauthorized['has_resume'] is False
        assert roadmap_unauthorized['resume_id'] is None
        assert len(roadmap_unauthorized['skills']) == 0
