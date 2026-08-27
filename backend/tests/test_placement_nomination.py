# backend/tests/test_placement_nomination.py

import pytest
import json
from app import create_app, db
from app.models import User, PlacementNomination, Notification
from flask_jwt_extended import create_access_token

@pytest.fixture
def app_instance():
    app = create_app('testing')
    with app.app_context():
        db.create_all()

        # Seed Faculty
        faculty = User(
            username='prof_smith',
            email='smith@univ.edu',
            password_hash='hashed_pass',
            full_name='Prof. Smith',
            role='faculty',
            department='Computer Science'
        )
        db.session.add(faculty)

        # Seed Students
        student1 = User(
            username='john_doe',
            email='john@univ.edu',
            password_hash='hashed_pass',
            full_name='John Doe',
            role='student',
            department='Computer Science',
            year_of_study=4,
            placement_status='seeking'
        )
        db.session.add(student1)

        student2 = User(
            username='jane_dev',
            email='jane@univ.edu',
            password_hash='hashed_pass',
            full_name='Jane Dev',
            role='student',
            department='Computer Science',
            year_of_study=3,
            placement_status='seeking'
        )
        db.session.add(student2)

        db.session.commit()
        yield app

        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app_instance):
    return app_instance.test_client()

def test_faculty_nominate_student(app_instance, client):
    with app_instance.app_context():
        faculty = User.query.filter_by(username='prof_smith').first()
        student = User.query.filter_by(username='john_doe').first()
        token = create_access_token(identity=str(faculty.id))

    response = client.post(
        '/api/v1/placement/nominate',
        headers={'Authorization': f'Bearer {token}'},
        json={
            'student_ids': [student.id],
            'company_name': 'Samsung Electronics',
            'job_role': 'Frontend Developer',
            'package_lpa': 14.0,
            'faculty_notes': 'Strong React and JS skillset'
        }
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert data['count'] == 1

    with app_instance.app_context():
        nom = PlacementNomination.query.filter_by(student_id=student.id).first()
        assert nom is not None
        assert nom.company_name == 'Samsung Electronics'
        assert nom.status == 'pending'
        assert nom.package_lpa == 14.0

        # Check notification created for student
        notif = Notification.query.filter_by(user_id=student.id).first()
        assert notif is not None
        assert 'Samsung Electronics' in notif.title

def test_student_get_and_accept_nomination(app_instance, client):
    with app_instance.app_context():
        faculty = User.query.filter_by(username='prof_smith').first()
        student = User.query.filter_by(username='john_doe').first()

        faculty_id = faculty.id
        student_id = student.id

        nom = PlacementNomination(
            student_id=student_id,
            faculty_id=faculty_id,
            company_name='Google',
            job_role='Software Engineer',
            package_lpa=25.0,
            status='pending'
        )
        db.session.add(nom)
        db.session.commit()
        nom_id = nom.id
        token = create_access_token(identity=str(student_id))

    # Student retrieves my-nominations
    get_res = client.get(
        '/api/v1/placement/my-nominations',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert get_res.status_code == 200
    noms = get_res.get_json()['nominations']
    assert len(noms) == 1
    assert noms[0]['company_name'] == 'Google'

    # Student accepts nomination (confirms attendance)
    resp_res = client.put(
        f'/api/v1/placement/nominations/{nom_id}/respond',
        headers={'Authorization': f'Bearer {token}'},
        json={
            'action': 'accept',
            'response_note': 'I will attend the Google drive'
        }
    )
    assert resp_res.status_code == 200
    res_data = resp_res.get_json()
    assert res_data['success'] is True
    assert res_data['nomination']['status'] == 'confirmed_attending'

    with app_instance.app_context():
        # Student remains seeking placement (attending drive, not placed yet)
        updated_student = db.session.get(User, student_id)
        assert updated_student.placement_status == 'seeking'

        # Faculty received confirmation notification
        faculty_notif = Notification.query.filter_by(user_id=faculty_id).first()
        assert faculty_notif is not None
        assert 'Confirmed' in faculty_notif.title

def test_faculty_mark_student_hired(app_instance, client):
    with app_instance.app_context():
        faculty = User.query.filter_by(username='prof_smith').first()
        student = User.query.filter_by(username='john_doe').first()
        faculty_id = faculty.id
        student_id = student.id

        nom = PlacementNomination(
            student_id=student_id,
            faculty_id=faculty_id,
            company_name='Google',
            job_role='Software Engineer',
            package_lpa=25.0,
            status='confirmed_attending'
        )
        db.session.add(nom)
        db.session.commit()
        nom_id = nom.id
        faculty_token = create_access_token(identity=str(faculty_id))

    # Faculty marks student as hired
    res = client.post(
        f'/api/v1/placement/nominations/{nom_id}/mark-hired',
        headers={'Authorization': f'Bearer {faculty_token}'},
        json={'package_lpa': 25.0}
    )
    assert res.status_code == 200
    assert res.get_json()['success'] is True

    with app_instance.app_context():
        updated_student = db.session.get(User, student_id)
        assert updated_student.placement_status == 'placed'
        assert updated_student.placed_company == 'Google'
        assert updated_student.package_lpa == 25.0

        # Student received celebration notification
        student_notif = Notification.query.filter_by(user_id=student_id).first()
        assert student_notif is not None
        assert 'Hired' in student_notif.title

def test_student_reject_nomination(app_instance, client):
    with app_instance.app_context():
        faculty = User.query.filter_by(username='prof_smith').first()
        student = User.query.filter_by(username='jane_dev').first()

        faculty_id = faculty.id
        student_id = student.id

        nom = PlacementNomination(
            student_id=student_id,
            faculty_id=faculty_id,
            company_name='Amazon',
            job_role='Cloud Engineer',
            package_lpa=18.0,
            status='pending'
        )
        db.session.add(nom)
        db.session.commit()
        nom_id = nom.id
        token = create_access_token(identity=str(student_id))

    # Student rejects nomination
    resp_res = client.put(
        f'/api/v1/placement/nominations/{nom_id}/respond',
        headers={'Authorization': f'Bearer {token}'},
        json={
            'action': 'reject',
            'response_note': 'Pursuing higher studies (MS)'
        }
    )
    assert resp_res.status_code == 200
    res_data = resp_res.get_json()
    assert res_data['nomination']['status'] == 'rejected'

    with app_instance.app_context():
        updated_student = db.session.get(User, student_id)
        assert updated_student.placement_status == 'seeking'
        assert updated_student.placed_company is None

def test_get_campus_drives_summary_and_attendees(app_instance, client):
    with app_instance.app_context():
        faculty = User.query.filter_by(username='prof_smith').first()
        student1 = User.query.filter_by(username='john_doe').first()
        student2 = User.query.filter_by(username='jane_dev').first()

        faculty_id = faculty.id
        nom1 = PlacementNomination(
            student_id=student1.id,
            faculty_id=faculty_id,
            company_name='Samsung Electronics',
            job_role='Software Engineer',
            package_lpa=14.0,
            status='confirmed_attending'
        )
        nom2 = PlacementNomination(
            student_id=student2.id,
            faculty_id=faculty_id,
            company_name='Samsung Electronics',
            job_role='Software Engineer',
            package_lpa=14.0,
            status='pending'
        )
        db.session.add_all([nom1, nom2])
        db.session.commit()

        faculty_token = create_access_token(identity=str(faculty_id))

    # Test GET /drives-summary
    res = client.get(
        '/api/v1/placement/drives-summary',
        headers={'Authorization': f'Bearer {faculty_token}'}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert len(data['drives']) >= 1
    samsung_drive = next((d for d in data['drives'] if d['company_name'] == 'Samsung Electronics'), None)
    assert samsung_drive is not None
    assert samsung_drive['total_invited'] == 2
    assert samsung_drive['confirmed_attending'] == 1
    assert samsung_drive['pending_rsvp'] == 1

    # Test GET /drives/Samsung Electronics/attendees
    res2 = client.get(
        '/api/v1/placement/drives/Samsung Electronics/attendees?status=confirmed',
        headers={'Authorization': f'Bearer {faculty_token}'}
    )
    assert res2.status_code == 200
    data2 = res2.get_json()
    assert data2['success'] is True
    assert len(data2['attendees']) == 1
    assert data2['attendees'][0]['student']['username'] == 'john_doe'
    assert data2['attendees'][0]['status'] == 'confirmed_attending'
