# scripts/seed_database.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app, db
from backend.app.models import User, Job
from datetime import datetime, timedelta

def seed_admin_user():
    """Create admin user if not exists"""
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@example.com',
            full_name='System Admin',
            role='admin',
            is_active=True
        )
        admin.set_password('Admin@123')
        db.session.add(admin)
        print("Admin user created")
    else:
        print("Admin user already exists")

def seed_sample_jobs():
    """Create sample job listings"""
    sample_jobs = [
        {
            'title': 'Data Scientist',
            'company': 'Google',
            'description': 'Design and implement ML models for various products',
            'required_skills': ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Data Visualization'],
            'experience_required': 3,
            'location': 'Bangalore',
            'salary_range': '20-30 LPA',
            'job_type': 'Full-time',
            'domain': 'AI/ML',
            'source': 'Sample',
            'posted_date': datetime.utcnow() - timedelta(days=5)
        },
        {
            'title': 'Software Engineer',
            'company': 'Microsoft',
            'description': 'Develop and maintain enterprise software solutions',
            'required_skills': ['Java', 'Python', 'SQL', 'Data Structures', 'Git'],
            'experience_required': 2,
            'location': 'Hyderabad',
            'salary_range': '15-25 LPA',
            'job_type': 'Full-time',
            'domain': 'Software Development',
            'source': 'Sample',
            'posted_date': datetime.utcnow() - timedelta(days=3)
        },
        {
            'title': 'DevOps Engineer',
            'company': 'Amazon',
            'description': 'Manage cloud infrastructure and CI/CD pipelines',
            'required_skills': ['AWS', 'Docker', 'Kubernetes', 'Linux', 'Jenkins'],
            'experience_required': 3,
            'location': 'Bangalore',
            'salary_range': '18-28 LPA',
            'job_type': 'Full-time',
            'domain': 'Cloud/DevOps',
            'source': 'Sample',
            'posted_date': datetime.utcnow() - timedelta(days=7)
        }
    ]
    
    for job_data in sample_jobs:
        job = Job(**job_data)
        db.session.add(job)
    
    print(f"Added {len(sample_jobs)} sample jobs")

def main():
    app = create_app('app.config.DevelopmentConfig')
    with app.app_context():
        seed_admin_user()
        seed_sample_jobs()
        db.session.commit()
        print("Database seeded successfully!")

if __name__ == '__main__':
    main()