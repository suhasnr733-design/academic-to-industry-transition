# scripts/test_backend_e2e.py

import os
import requests
import json

BASE_URL = 'http://127.0.0.1:5000/api/v1'

def run_tests():
    print("=" * 60)
    print("RUNNING BACKEND END-TO-END API INTEGRATION TESTS")
    print("=" * 60)
    
    session = requests.Session()

    # 1. Health check
    res = session.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("1. [PASS] Health check GET /api/v1/health:", res.json())

    # 2. Register User
    test_user = {
        "username": "antigravity_tester",
        "email": "antigravity_test_user@example.com",
        "password": "Password@123",
        "full_name": "Antigravity Test User",
        "role": "student"
    }
    res = session.post(f"{BASE_URL}/auth/register", json=test_user)
    if res.status_code == 201:
        print("2. [PASS] User Registration POST /api/v1/auth/register:", res.json())
    else:
        print("2. [INFO] Registration status (User may exist):", res.status_code, res.json())

    # 3. Login User
    res = session.post(f"{BASE_URL}/auth/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    tokens = res.json()
    access_token = tokens["access_token"]
    session.headers.update({"Authorization": f"Bearer {access_token}"})
    print("3. [PASS] User Login POST /api/v1/auth/login. JWT Token obtained.")

    # 4. Get Profile
    res = session.get(f"{BASE_URL}/auth/profile")
    assert res.status_code == 200, f"Profile check failed: {res.text}"
    print("4. [PASS] User Profile GET /api/v1/auth/profile:", res.json()["email"])

    # 5. List Jobs
    res = session.get(f"{BASE_URL}/jobs")
    assert res.status_code == 200, f"Jobs list failed: {res.text}"
    jobs_data = res.json()
    print("5. [PASS] Jobs List GET /api/v1/jobs. Found jobs count:", len(jobs_data.get("jobs", [])))

    # 6. Upload Resume
    resume_content = """
    JOHN DOE
    Email: john@example.com | Phone: 9876543210
    Education: B.Tech Computer Science (CGPA: 8.7)
    Skills: Python, Java, SQL, Git, Machine Learning, Data Structures, React
    Experience: 6 months Internship at TechCorp as Software Developer
    Projects: E-Commerce Web App, ML Student Employability Classifier
    Certifications: AWS Cloud Practitioner, Python Mastery
    """
    dummy_resume_path = "scratch/sample_resume.txt"
    os.makedirs("scratch", exist_ok=True)
    with open(dummy_resume_path, "w", encoding="utf-8") as f:
        f.write(resume_content)

    with open(dummy_resume_path, "rb") as f:
        res = session.post(f"{BASE_URL}/resume/upload", files={"file": ("sample_resume.txt", f, "text/plain")})
    
    assert res.status_code in [200, 201], f"Resume upload failed: {res.text}"
    uploaded_resume = res.json().get("resume", {})
    resume_id = uploaded_resume.get("id", 1)
    print("6. [PASS] Resume Upload POST /api/v1/resume/upload. Resume ID:", resume_id)

    # 7. Employability Prediction
    res = session.get(f"{BASE_URL}/prediction/employability/{resume_id}")
    assert res.status_code == 200, f"Prediction failed: {res.text}"
    pred_res = res.json()
    print("7. [PASS] ML Prediction GET /api/v1/prediction/employability/<id>:", pred_res)

    # 8. Skill Gap & Recommendations
    res = session.get(f"{BASE_URL}/prediction/recommendations/{resume_id}")
    assert res.status_code == 200, f"Recommendations failed: {res.text}"
    rec_res = res.json()
    print("8. [PASS] Recommendations GET /api/v1/prediction/recommendations/<id>:", len(rec_res.get("course_recommendations", [])), "course recommendations")

    print("=" * 60)
    print("ALL BACKEND API TESTS PASSED empircally!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
