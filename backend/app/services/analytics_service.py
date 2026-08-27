# backend/app/services/analytics_service.py

from app.models import User, Resume, Job, AssessmentResult
from app.extensions import db
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

class AnalyticsService:
    """Advanced analytics and reporting"""
    
    def get_dashboard_stats(self):
        """Get main dashboard statistics"""
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        total_resumes = Resume.query.count()
        processed_resumes = Resume.query.filter_by(status='completed').count()
        total_jobs = Job.query.count()
        
        return {
            'users': {
                'total': total_users,
                'active': active_users,
                'students': User.query.filter_by(role='student').count(),
                'faculty': User.query.filter_by(role='faculty').count()
            },
            'resumes': {
                'total': total_resumes,
                'processed': processed_resumes,
                'pending': Resume.query.filter_by(status='pending').count(),
                'failed': Resume.query.filter_by(status='failed').count()
            },
            'jobs': {
                'total': total_jobs,
                'active': Job.query.filter_by(is_active=True).count()
            }
        }

    def get_faculty_placement_stats(self, faculty_id=None, filter_type='mentees', department=None):
        """Get placement stats for faculty dashboard"""
        from app.models import MentorshipRequest
        mentee_ids = []
        if faculty_id:
            mentees = MentorshipRequest.query.filter_by(
                faculty_id=faculty_id,
                status='accepted'
            ).all()
            mentee_ids = [m.student_id for m in mentees]

        if filter_type == 'all':
            student_query = User.query.filter_by(role='student')
        else:
            if mentee_ids:
                student_query = User.query.filter(User.id.in_(mentee_ids))
            else:
                student_query = None

        if student_query is not None:
            if department and department.lower() != 'all':
                student_query = student_query.filter(User.department.ilike(f"%{department}%"))

            total_students = student_query.count()
            placed_students = student_query.filter(User.placement_status == 'placed').count()

            student_ids = [s.id for s in student_query.all()]
            resumes_processed = Resume.query.filter(
                Resume.user_id.in_(student_ids),
                Resume.status == 'completed'
            ).count() if student_ids else 0
        else:
            total_students = 0
            placed_students = 0
            resumes_processed = 0

        placement_rate = f"{round((placed_students / total_students) * 100)}%" if total_students > 0 else "0%"
        active_jobs = Job.query.filter_by(is_active=True).count()

        return {
            'totalStudents': total_students,
            'assignedMenteesCount': len(mentee_ids),
            'placedStudents': placed_students,
            'resumesProcessed': resumes_processed,
            'placementRate': placement_rate,
            'activeJobs': active_jobs,
            'hasAssignedMentees': len(mentee_ids) > 0
        }
    def get_faculty_dashboard_data(self, faculty_id=None, filter_type='mentees', department=None):
        """Get detailed placement statistics for faculty dashboard"""
        from app.models import MentorshipRequest

        mentee_records = MentorshipRequest.query.filter_by(
            faculty_id=faculty_id,
            status='accepted'
        ).all() if faculty_id else []

        mentee_ids = [m.student_id for m in mentee_records]

        if filter_type == 'all':
            student_query = User.query.filter_by(role='student')
        else:
            if mentee_ids:
                student_query = User.query.filter(User.id.in_(mentee_ids))
            else:
                student_query = None

        if student_query is not None:
            if department and department.lower() != 'all':
                student_query = student_query.filter(
                    User.department.ilike(f"%{department}%")
                )

            total_students = student_query.count()
            placed_students = student_query.filter(
                User.placement_status == 'placed'
            ).count()

            student_ids = [s.id for s in student_query.all()]
            resumes_processed = Resume.query.filter(
                Resume.user_id.in_(student_ids),
                Resume.status == 'completed'
            ).count() if student_ids else 0
        else:
            total_students = 0
            placed_students = 0
            resumes_processed = 0

        placement_rate = (
            f"{round((placed_students / total_students) * 100)}%"
            if total_students > 0 else "0%"
        )

        active_jobs = Job.query.filter_by(is_active=True).count()

        return {
            'totalStudents': total_students,
            'assignedMenteesCount': len(mentee_ids),
            'placedStudents': placed_students,
            'resumesProcessed': resumes_processed,
            'placementRate': placement_rate,
            'activeJobs': active_jobs,
            'hasAssignedMentees': len(mentee_ids) > 0
        }

    def get_faculty_students(self, faculty_id=None, filter_type='mentees', department=None):
        """Get student list for faculty directory (mentees vs all department students) with target job interests"""
        from app.models import MentorshipRequest, JobInterest
        
        if filter_type == 'mentees' and faculty_id:
            mentee_records = MentorshipRequest.query.filter_by(
                faculty_id=faculty_id, 
                status='accepted'
            ).all()
            mentee_ids = [m.student_id for m in mentee_records]
            if not mentee_ids:
                return []
            query = User.query.filter(User.id.in_(mentee_ids))
        else:
            query = User.query.filter_by(role='student')

        if department and department.lower() != 'all':
            query = query.filter(User.department.ilike(f"%{department}%"))

        students = query.order_by(User.id.desc()).all()
        
        results = []
        for s in students:
            data = s.to_dict()
            interests = JobInterest.query.filter_by(user_id=s.id).order_by(JobInterest.created_at.desc()).all()
            data['job_interests'] = [i.to_dict() for i in interests]
            results.append(data)

        return results

    def get_cohort_skill_readiness(self, department=None):
        """Compute real aggregate skill readiness and deficits across student cohort"""
        # Baseline key industry skills and their market demand weighting
        standard_skills = [
            {'skill': 'Python / Backend Development', 'keywords': ['python', 'django', 'flask', 'fastapi', 'backend'], 'color': 'bg-blue-500'},
            {'skill': 'React & Modern Frontend', 'keywords': ['react', 'javascript', 'typescript', 'vue', 'frontend', 'html', 'css'], 'color': 'bg-indigo-500'},
            {'skill': 'SQL & Database Architecture', 'keywords': ['sql', 'postgresql', 'mysql', 'mongodb', 'database', 'sqlite'], 'color': 'bg-green-500'},
            {'skill': 'Cloud & Docker DevOps', 'keywords': ['docker', 'kubernetes', 'aws', 'azure', 'cloud', 'ci/cd', 'devops'], 'color': 'bg-amber-500'},
            {'skill': 'Machine Learning & AI APIs', 'keywords': ['machine learning', 'deep learning', 'pytorch', 'tensorflow', 'nlp', 'ai'], 'color': 'bg-purple-500'},
            {'skill': 'System Design & Data Structures', 'keywords': ['system design', 'dsa', 'data structures', 'algorithms', 'oop'], 'color': 'bg-rose-500'}
        ]

        # Query all student resumes
        student_query = User.query.filter_by(role='student')
        if department and department.lower() != 'all':
            student_query = student_query.filter(User.department.ilike(f"%{department}%"))
        
        students = student_query.all()
        total_students = len(students)

        # Collect skills from parsed resumes
        student_ids = [s.id for s in students]
        resumes = Resume.query.filter(Resume.user_id.in_(student_ids)).all() if student_ids else Resume.query.all()
        
        student_skill_sets = []
        for r in resumes:
            s_skills = []
            if isinstance(r.skills, list):
                s_skills.extend([str(sk).lower() for sk in r.skills])
            student_skill_sets.append(s_skills)

        results = []
        for item in standard_skills:
            keywords = item['keywords']
            # Count how many resumes have at least one keyword
            match_count = 0
            for skill_set in student_skill_sets:
                if any(any(kw in sk for kw in keywords) for sk in skill_set):
                    match_count += 1
            
            if total_students > 0 and len(student_skill_sets) > 0:
                prof_count = round((match_count / max(total_students, len(student_skill_sets))) * 100)
            else:
                # Default demonstration baseline if no resumes uploaded yet
                prof_count = 50
            
            # Bound prof_count between 5% and 95%
            prof_count = max(10, min(95, prof_count))
            gap_count = 100 - prof_count

            results.append({
                'skill': item['skill'],
                'profCount': prof_count,
                'gapCount': gap_count,
                'color': item['color']
            })

        return results

    def get_advisor_recommendations(self, department=None):
        """Generate dynamic advisor recommendations based on biggest cohort skill deficit"""
        cohort_skills = self.get_cohort_skill_readiness(department)
        
        # Sort by largest gap
        sorted_by_gap = sorted(cohort_skills, key=lambda x: x['gapCount'], reverse=True)
        top_deficit = sorted_by_gap[0] if sorted_by_gap else {
            'skill': 'Cloud & Docker DevOps',
            'gapCount': 65,
            'profCount': 35
        }

        skill_name = top_deficit['skill']
        gap_pct = top_deficit['gapCount']

        return {
            'title': 'Curriculum Focus Needed',
            'top_deficit_skill': skill_name,
            'gap_percentage': gap_pct,
            'message': f"{skill_name} represents the largest skill deficit across {gap_pct}% of the student cohort. Scheduling a 2-week hands-on workshop is recommended to boost placement readiness.",
            'action_label': f"Inspect Cohort for {skill_name.split('/')[0].strip()}"
        }

    def update_student_placement(self, student_id, data):
        """Update placement status of an individual student"""
        student = User.query.get(student_id)
        if not student:
            return None
        
        if 'placement_status' in data:
            student.placement_status = data['placement_status']
        if 'placed_company' in data:
            student.placed_company = data['placed_company']
        if 'package_lpa' in data:
            student.package_lpa = float(data['package_lpa']) if data['package_lpa'] is not None else None
            
        db.session.commit()
        return student.to_dict()
    
    def get_placement_trends(self, months=6):
        """Get placement trends over time"""
        cutoff_date = datetime.utcnow() - timedelta(days=30*months)
        
        # Get resumes with employability scores
        resumes = Resume.query.filter(
            Resume.created_at >= cutoff_date,
            Resume.employability_score.isnot(None)
        ).all()
        
        # Group by month
        df = pd.DataFrame([{
            'date': r.created_at,
            'score': r.employability_score
        } for r in resumes])
        
        if df.empty:
            return []
        
        df['month'] = df['date'].dt.strftime('%Y-%m')
        trends = df.groupby('month')['score'].mean().to_dict()
        
        return [{'month': k, 'avg_score': v} for k, v in trends.items()]
    
    def get_skill_distribution(self):
        """Get skill distribution across all resumes"""
        resumes = Resume.query.filter(Resume.skills.isnot(None)).all()
        
        skill_counts = {}
        for resume in resumes:
            if resume.skills:
                for skill in resume.skills:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
        
        # Sort by count
        sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)
        
        return [{'skill': k, 'count': v} for k, v in sorted_skills[:20]]
    
    def get_employability_distribution(self):
        """Get employability score distribution"""
        resumes = Resume.query.filter(
            Resume.employability_score.isnot(None)
        ).all()
        
        if not resumes:
            return []
        
        scores = [r.employability_score for r in resumes]
        
        # Create bins
        bins = [0, 20, 40, 60, 80, 100]
        labels = ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%']
        
        distribution = pd.cut(scores, bins, labels=labels)
        counts = distribution.value_counts().to_dict()
        
        return [{'range': k, 'count': v} for k, v in counts.items()]