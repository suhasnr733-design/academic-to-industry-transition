# backend/tests/test_placement_shortlist.py

import pytest
import io
import zipfile
import csv
from app import create_app, db
from app.models import User, Resume
from app.services.analytics_service import AnalyticsService

@pytest.fixture
def app_instance():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        
        # Seed test student candidates
        s1 = User(
            username='alex_coder',
            email='alex@univ.edu',
            full_name='Alex Rivera',
            role='student',
            department='Computer Science',
            year_of_study=4,
            placement_status='seeking',
            phone='555-0101'
        )
        s1.set_password('Password123!')
        db.session.add(s1)
        db.session.flush()

        r1 = Resume(
            user_id=s1.id,
            filename='Alex_Resume.pdf',
            file_path='/tmp/alex_resume.pdf',
            status='completed',
            skills=['Python', 'SQL', 'FastAPI', 'Docker', 'PostgreSQL'],
            employability_score=88.5
        )
        db.session.add(r1)

        s2 = User(
            username='beth_dev',
            email='beth@univ.edu',
            full_name='Bethany Chen',
            role='student',
            department='Information Technology',
            year_of_study=3,
            placement_status='seeking',
            phone='555-0102'
        )
        s2.set_password('Password123!')
        db.session.add(s2)
        db.session.flush()

        r2 = Resume(
            user_id=s2.id,
            filename='Beth_Resume.pdf',
            file_path='/tmp/beth_resume.pdf',
            status='completed',
            skills=['React', 'JavaScript', 'HTML', 'CSS', 'Node.js'],
            employability_score=75.0
        )
        db.session.add(r2)

        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()

def test_placement_shortlist_skills_filter(app_instance):
    with app_instance.app_context():
        service = AnalyticsService()
        
        # Shortlist for Python + SQL drive
        results = service.get_placement_shortlist({
            'required_skills': ['Python', 'SQL'],
            'placement_status': 'seeking'
        })
        
        assert len(results) >= 1
        top = results[0]
        assert top['full_name'] == 'Alex Rivera'
        assert top['match_percentage'] == 100
        assert 'Python' in top['matched_skills']
        assert 'SQL' in top['matched_skills']

def test_placement_shortlist_year_filter(app_instance):
    with app_instance.app_context():
        service = AnalyticsService()
        
        # Only Year 4 candidates
        results = service.get_placement_shortlist({
            'min_year': 4,
            'max_year': 4
        })
        
        for cand in results:
            assert cand['year_of_study'] == 4

def test_generate_shortlist_bundle_zip(app_instance):
    with app_instance.app_context():
        service = AnalyticsService()
        
        student = User.query.filter_by(username='alex_coder').first()
        assert student is not None

        zip_buffer, download_name = service.generate_shortlist_bundle(
            company_name='Google_SWE',
            student_ids=[student.id],
            criteria={'required_skills': ['Python', 'SQL']}
        )
        
        assert download_name.endswith('.zip')
        assert zip_buffer is not None
        
        # Read the in-memory zip
        with zipfile.ZipFile(zip_buffer, 'r') as zf:
            namelist = zf.namelist()
            assert 'shortlist_summary.csv' in namelist
            assert 'Company_Drive_Overview.txt' in namelist
            assert any(name.startswith('Resumes/') for name in namelist)

            # Check CSV content
            csv_content = zf.read('shortlist_summary.csv').decode('utf-8')
            assert 'Alex Rivera' in csv_content
            assert 'alex@univ.edu' in csv_content
