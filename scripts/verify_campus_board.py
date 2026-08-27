# scripts/verify_campus_board.py

import sys
import os
import json

sys.path.insert(0, os.path.abspath('backend'))
sys.path.insert(0, os.path.abspath('.'))

from app import create_app, db
from app.models import User, Job, JobInterest
from flask_jwt_extended import create_access_token

def run_checks():
    print("Initializing Flask test app...")
    app = create_app('testing')
    with app.app_context():
        db.create_all()

        # 1. Create student and sample job
        u = User(username='test_stu_cb', email='test_stu_cb@test.com', full_name='Campus Board Tester', role='student')
        u.set_password('pass123')
        db.session.add(u)

        j = Job(
            title='Full Stack Campus Engineer',
            company='InnoTech Solutions',
            description='Exciting on-campus opportunity',
            required_skills=['React', 'Python', 'PostgreSQL'],
            source='internal',
            is_active=True
        )
        db.session.add(j)
        db.session.commit()

        token = create_access_token(identity=str(u.id))
        client = app.test_client()
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

        # 2. Add Job Interest (POST /api/v1/jobs/interested)
        print("--> Testing POST /api/v1/jobs/interested...")
        res1 = client.post('/api/v1/jobs/interested', headers=headers, data=json.dumps({
            'job_id': j.id,
            'status': 'interested',
            'notes': 'Prepared resume for campus drive'
        }))
        assert res1.status_code in (200, 201), f"Expected 200/201, got {res1.status_code}: {res1.data}"
        data1 = res1.get_json()
        assert data1['is_interested'] is True
        interest_id = data1['interest']['id']
        print("    [PASS] Job successfully saved to Campus Board:", data1['interest']['job_title'])

        # 3. Add External Live Job Interest
        print("--> Testing POST /api/v1/jobs/interested (External Live Job)...")
        res_ext = client.post('/api/v1/jobs/interested', headers=headers, data=json.dumps({
            'external_job_id': 'ext-unstop-9988',
            'job_title': 'Cloud DevOps Intern',
            'company': 'Global Cloud Corp',
            'job_data': {
                'location': 'Remote',
                'source': 'unstop',
                'salary_range': '6-8 LPA',
                'required_skills': ['Docker', 'AWS', 'Kubernetes']
            },
            'status': 'interested'
        }))
        assert res_ext.status_code in (200, 201)
        print("    [PASS] External Live Job successfully saved to Campus Board")

        # 4. Fetch Interested Jobs (GET /api/v1/jobs/interested)
        print("--> Testing GET /api/v1/jobs/interested...")
        res2 = client.get('/api/v1/jobs/interested', headers=headers)
        assert res2.status_code == 200
        data2 = res2.get_json()
        assert data2['count'] == 2, f"Expected 2 saved jobs, got {data2['count']}"
        print(f"    [PASS] Successfully retrieved {data2['count']} student target roles")

        # 5. Update Application Stage (PATCH /api/v1/jobs/interested/<id>/status)
        print("--> Testing PATCH /api/v1/jobs/interested/<id>/status...")
        res3 = client.patch(f'/api/v1/jobs/interested/{interest_id}/status', headers=headers, data=json.dumps({
            'status': 'applied',
            'notes': 'Online test completed on portal'
        }))
        assert res3.status_code == 200
        data3 = res3.get_json()
        assert data3['interest']['status'] == 'applied'
        print("    [PASS] Application stage updated to 'applied'")

        # 6. Check Campus Board Aggregation (GET /api/v1/jobs/campus-board)
        print("--> Testing GET /api/v1/jobs/campus-board...")
        res4 = client.get('/api/v1/jobs/campus-board')
        assert res4.status_code == 200
        data4 = res4.get_json()
        matched = [job for job in data4['campus_jobs'] if job['id'] == j.id]
        assert len(matched) == 1
        assert matched[0]['campus_interest_count'] >= 1
        print(f"    [PASS] Campus Board aggregated interest count: {matched[0]['campus_interest_count']} students interested")

        # 7. Delete / Un-star Job (DELETE /api/v1/jobs/interested/<id>)
        print("--> Testing DELETE /api/v1/jobs/interested/<id>...")
        res5 = client.delete(f'/api/v1/jobs/interested/{interest_id}', headers=headers)
        assert res5.status_code == 200
        print("    [PASS] Job interest removed successfully")

        db.session.remove()
        db.drop_all()

    print("\n========================================================")
    print(" ALL CAMPUS BOARD & JOB INTEREST CHECKS PASSED PERFECTLY!")
    print("========================================================")

if __name__ == '__main__':
    run_checks()
