import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models import User, Job

def init_database():
    app = create_app('development')
    
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("Database tables created!")
        
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                email='admin@example.com',
                full_name='System Administrator',
                role='admin',
                is_active=True,
                is_email_verified=True
            )
            admin.set_password('Admin@123')
            db.session.add(admin)
            print("Admin user created")
        
        if Job.query.count() == 0:
            jobs = [
                Job(
                    title='Software Engineer',
                    company='Google',
                    description='Build amazing products',
                    required_skills=['Python', 'Java', 'SQL'],
                    location='Bangalore',
                    job_type='Full-time',
                    domain='Software Engineering',
                    is_active=True
                ),
                Job(
                    title='Data Scientist',
                    company='Microsoft',
                    description='Work with big data',
                    required_skills=['Python', 'Machine Learning', 'SQL'],
                    location='Hyderabad',
                    job_type='Full-time',
                    domain='Data Science',
                    is_active=True
                )
            ]
            for job in jobs:
                db.session.add(job)
            print("Sample jobs created")
        
        db.session.commit()
        print("Database initialization complete!")

if __name__ == '__main__':
    init_database()
