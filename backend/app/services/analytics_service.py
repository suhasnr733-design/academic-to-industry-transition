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
        student_ids = [s.id for s in students]

        # Query only completed/verified resumes
        resumes = Resume.query.filter(
            Resume.user_id.in_(student_ids),
            Resume.status == 'completed'
        ).all() if student_ids else []
        
        student_skill_sets = []
        for r in resumes:
            s_skills = []
            if isinstance(r.skills, list):
                s_skills.extend([str(sk).lower() for sk in r.skills])
            student_skill_sets.append(s_skills)

        results = []
        total_resumes = len(student_skill_sets)

        for item in standard_skills:
            keywords = item['keywords']
            match_count = 0
            
            if total_resumes > 0:
                for skill_set in student_skill_sets:
                    if any(any(kw in sk for kw in keywords) for sk in skill_set):
                        match_count += 1
                prof_count = round((match_count / total_resumes) * 100)
            else:
                prof_count = 0
            
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
        student_query = User.query.filter_by(role='student')
        if department and department.lower() != 'all':
            student_query = student_query.filter(User.department.ilike(f"%{department}%"))
        student_ids = [s.id for s in student_query.all()]

        has_resumes = Resume.query.filter(
            Resume.user_id.in_(student_ids),
            Resume.status == 'completed'
        ).count() > 0 if student_ids else False

        if not has_resumes:
            return {
                'title': 'Awaiting Resume Submissions',
                'top_deficit_skill': 'No Resumes Uploaded',
                'gap_percentage': 100,
                'message': 'No student resumes have been uploaded for AI skill verification yet. Encourage your student cohort to upload their resumes to unlock live skill deficit analytics and placement recommendations.',
                'action_label': 'View Student Directory'
            }

        cohort_skills = self.get_cohort_skill_readiness(department)
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

    def get_placement_shortlist(self, criteria=None):
        """Filter and rank students for company placement drives based on custom criteria"""
        criteria = criteria or {}
        required_skills = criteria.get('required_skills', [])
        if isinstance(required_skills, str):
            required_skills = [s.strip() for s in required_skills.split(',') if s.strip()]
        required_skills = [s.strip() for s in required_skills if s and s.strip()]

        department = criteria.get('department')
        min_year = criteria.get('min_year')
        max_year = criteria.get('max_year')
        placement_status = criteria.get('placement_status', 'seeking')
        min_employability_score = criteria.get('min_employability_score')
        filter_scope = criteria.get('filter_scope', 'all')
        faculty_id = criteria.get('faculty_id')

        # Base student query
        if filter_scope == 'mentees' and faculty_id:
            from app.models import MentorshipRequest
            mentee_records = MentorshipRequest.query.filter_by(
                faculty_id=faculty_id,
                status='accepted'
            ).all()
            mentee_ids = [m.student_id for m in mentee_records]
            if not mentee_ids:
                return []
            query = User.query.filter(User.id.in_(mentee_ids), User.role == 'student')
        else:
            query = User.query.filter_by(role='student')

        # Filter by department
        if department and department.lower() != 'all':
            query = query.filter(User.department.ilike(f"%{department}%"))

        # Filter by year of study
        if min_year and str(min_year).lower() != 'all':
            try:
                query = query.filter(User.year_of_study >= int(min_year))
            except (ValueError, TypeError):
                pass
        if max_year and str(max_year).lower() != 'all':
            try:
                query = query.filter(User.year_of_study <= int(max_year))
            except (ValueError, TypeError):
                pass

        # Filter by placement status
        if placement_status and placement_status.lower() != 'all':
            if placement_status == 'seeking':
                query = query.filter((User.placement_status == 'seeking') | (User.placement_status.is_(None)))
            else:
                query = query.filter(User.placement_status == placement_status)

        students = query.order_by(User.id.desc()).all()
        student_ids = [s.id for s in students]

        # Fetch latest completed or available resume for each student
        resumes_by_user = {}
        if student_ids:
            all_resumes = Resume.query.filter(Resume.user_id.in_(student_ids)).order_by(Resume.id.desc()).all()
            for r in all_resumes:
                if r.user_id not in resumes_by_user:
                    resumes_by_user[r.user_id] = r
                elif r.status == 'completed' and resumes_by_user[r.user_id].status != 'completed':
                    resumes_by_user[r.user_id] = r

        # Fetch nominations for this company if company_name provided
        company_name = (criteria.get('company_name') or '').strip()
        nominations_by_user = {}
        if student_ids and company_name:
            try:
                from app.models import PlacementNomination
                noms = PlacementNomination.query.filter(
                    PlacementNomination.student_id.in_(student_ids),
                    PlacementNomination.company_name.ilike(f"%{company_name}%")
                ).all()
                for n in noms:
                    nominations_by_user[n.student_id] = n
            except Exception:
                pass

        shortlisted = []

        for student in students:
            resume = resumes_by_user.get(student.id)
            student_skills = []
            if resume and isinstance(resume.skills, list):
                student_skills = [str(sk) for sk in resume.skills if sk]

            # Calculate match percentage and skill intersection
            matched_skills = []
            missing_skills = []

            if required_skills:
                student_skills_lower = [s.lower() for s in student_skills]
                for req in required_skills:
                    req_lower = req.lower()
                    # Check substring or exact token match
                    if any(req_lower in sk or sk in req_lower for sk in student_skills_lower):
                        matched_skills.append(req)
                    else:
                        missing_skills.append(req)
                
                match_pct = round((len(matched_skills) / len(required_skills)) * 100)
            else:
                match_pct = 100
                matched_skills = student_skills[:6]
                missing_skills = []

            emp_score = float(resume.employability_score) if (resume and resume.employability_score is not None) else 0.0

            # Filter by min employability score if provided
            if min_employability_score is not None and str(min_employability_score) != '':
                try:
                    if emp_score < float(min_employability_score):
                        continue
                except (ValueError, TypeError):
                    pass

            nom = nominations_by_user.get(student.id)

            shortlisted.append({
                'id': student.id,
                'full_name': student.full_name or student.username,
                'username': student.username,
                'email': student.email,
                'phone': student.phone or 'N/A',
                'department': student.department or 'General',
                'year_of_study': student.year_of_study or 'N/A',
                'placement_status': student.placement_status or 'seeking',
                'placed_company': student.placed_company,
                'package_lpa': student.package_lpa,
                'has_resume': resume is not None,
                'resume_id': resume.id if resume else None,
                'resume_filename': resume.filename if resume else None,
                'employability_score': round(emp_score, 1),
                'skills': student_skills,
                'matched_skills': matched_skills,
                'missing_skills': missing_skills,
                'match_percentage': match_pct,
                'nomination_status': nom.status if nom else None,
                'nomination_id': nom.id if nom else None,
                'nomination_role': nom.job_role if nom else None,
                'nomination_package': nom.package_lpa if nom else None
            })

        # Rank candidates: match percentage desc, then employability score desc
        shortlisted.sort(key=lambda x: (x['match_percentage'], x['employability_score']), reverse=True)
        return shortlisted

    def generate_shortlist_bundle(self, company_name='Campus_Drive', student_ids=None, criteria=None):
        """Generate an in-memory ZIP package containing candidate resumes and CSV summary for HR"""
        import io
        import zipfile
        import csv
        import os
        import re

        student_ids = student_ids or []
        criteria = criteria or {}
        clean_company = re.sub(r'[^a-zA-Z0-9_\-]', '_', company_name.strip()) or 'Campus_Drive'

        students = []
        if student_ids:
            students = User.query.filter(User.id.in_(student_ids), User.role == 'student').all()
            # Maintain incoming selection order
            id_order = {sid: idx for idx, sid in enumerate(student_ids)}
            students.sort(key=lambda s: id_order.get(s.id, 9999))
        else:
            # If no student_ids provided, run shortlist query with criteria
            candidates = self.get_placement_shortlist(criteria)
            c_ids = [c['id'] for c in candidates]
            if c_ids:
                students = User.query.filter(User.id.in_(c_ids)).all()
                id_order = {sid: idx for idx, sid in enumerate(c_ids)}
                students.sort(key=lambda s: id_order.get(s.id, 9999))

        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            csv_buffer = io.StringIO()
            csv_writer = csv.writer(csv_buffer)
            csv_writer.writerow([
                'Student ID',
                'Full Name',
                'Email',
                'Phone',
                'Department',
                'Year of Study',
                'Placement Status',
                'Employability Score (%)',
                'Verified Skills',
                'Resume Document'
            ])

            for student in students:
                # Latest resume
                resume = Resume.query.filter_by(user_id=student.id).order_by(Resume.id.desc()).first()
                safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', student.full_name or student.username)
                skills_str = ", ".join(resume.skills) if (resume and isinstance(resume.skills, list)) else 'None'
                emp_score = f"{resume.employability_score:.1f}%" if (resume and resume.employability_score is not None) else 'N/A'

                resume_doc_name = 'Not Uploaded'

                if resume and resume.file_path and os.path.exists(resume.file_path):
                    ext = resume.filename.rsplit('.', 1)[-1] if '.' in resume.filename else 'pdf'
                    dest_name = f"Resumes/{safe_name}_{student.id}_Resume.{ext}"
                    try:
                        zip_file.write(resume.file_path, arcname=dest_name)
                        resume_doc_name = dest_name
                    except Exception as e:
                        resume_doc_name = f"Error reading file ({str(e)})"
                else:
                    # Generate a comprehensive candidate brief if resume file is not available on disk
                    dossier_text = f"""=====================================================
STUDENT PLACEMENT CANDIDATE DOSSIER
Company Drive: {company_name}
=====================================================
Full Name: {student.full_name or student.username}
Student ID: {student.id}
Email: {student.email}
Phone: {student.phone or 'N/A'}
Department: {student.department or 'General'}
Year of Study: {student.year_of_study or 'N/A'}
Placement Status: {student.placement_status or 'seeking'}
Employability Readiness Score: {emp_score}

VERIFIED SKILLS:
{skills_str}

PROJECTS & EXPERIENCE:
{str(resume.projects) if resume and resume.projects else 'None recorded'}

EDUCATION & BACKGROUND:
{str(resume.education) if resume and resume.education else 'None recorded'}
=====================================================
"""
                    dest_name = f"Resumes/{safe_name}_{student.id}_Candidate_Profile.txt"
                    zip_file.writestr(dest_name, dossier_text)
                    resume_doc_name = dest_name

                csv_writer.writerow([
                    student.id,
                    student.full_name or student.username,
                    student.email,
                    student.phone or 'N/A',
                    student.department or 'General',
                    student.year_of_study or 'N/A',
                    student.placement_status or 'seeking',
                    emp_score,
                    skills_str,
                    resume_doc_name
                ])

            # Embed CSV inside the ZIP
            zip_file.writestr("shortlist_summary.csv", csv_buffer.getvalue())

            # Embed Drive Metadata Overview
            req_skills = criteria.get('required_skills', [])
            if isinstance(req_skills, list):
                req_skills_str = ", ".join(req_skills) if req_skills else "Any"
            else:
                req_skills_str = str(req_skills)

            drive_overview = f"""=====================================================
CAMPUS PLACEMENT SHORTLIST BUNDLE
=====================================================
Drive / Company Name: {company_name}
Generated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
Total Candidates Shortlisted: {len(students)}

MATCHING CRITERIA:
- Required Skills: {req_skills_str}
- Minimum Academic Year: {criteria.get('min_year', 'All')}
- Target Department: {criteria.get('department', 'All')}
- Placement Status: {criteria.get('placement_status', 'Seeking Placement')}
- Minimum Employability Index: {criteria.get('min_employability_score', '0')}%

CONTENTS OF THIS BUNDLE:
1. shortlist_summary.csv - Complete spreadsheet of all candidates & contact details
2. Resumes/ - Folder containing individual verified candidate resume files

Generated via Academic-to-Industry Transition Platform (Faculty Command Center).
=====================================================
"""

            zip_file.writestr("Company_Drive_Overview.txt", drive_overview)

        zip_buffer.seek(0)
        bundle_filename = f"{clean_company}_Placement_Shortlist.zip"
        return zip_buffer, bundle_filename

    def get_student_progression_analytics(self, user_id):
        """Get real-time career progression analytics for a specific student"""
        from app.models import JobInterest, PlacementNomination, Resume

        # 1. Fetch user's job interests and placement drives
        interests = JobInterest.query.filter_by(user_id=user_id).all()
        nominations = PlacementNomination.query.filter_by(student_id=user_id).all()
        active_resume = (
            Resume.query.filter_by(user_id=user_id)
            .order_by(Resume.created_at.desc())
            .first()
        )

        # 2. Compute 6-month monthly trends chronologically
        now = datetime.utcnow()
        months_data = []
        for i in range(5, -1, -1):
            m_date = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            month_name = m_date.strftime('%b')
            month_year = (m_date.year, m_date.month)
            months_data.append({
                'name': month_name,
                'year_month': month_year,
                'applications': 0,
                'interviews': 0,
                'offers': 0
            })

        for item in interests:
            created = item.created_at or now
            ym = (created.year, created.month)
            for m in months_data:
                if m['year_month'] == ym:
                    m['applications'] += 1
                    status = (item.status or '').lower()
                    if status in ['interviewing', 'shortlisted']:
                        m['interviews'] += 1
                    elif status == 'offer':
                        m['offers'] += 1

        for nom in nominations:
            created = nom.created_at or now
            ym = (created.year, created.month)
            for m in months_data:
                if m['year_month'] == ym:
                    m['applications'] += 1
                    status = (nom.status or '').lower()
                    if status == 'confirmed_attending':
                        m['interviews'] += 1
                    elif status == 'placed':
                        m['offers'] += 1

        trend = [
            {
                'name': m['name'],
                'applications': m['applications'],
                'interviews': m['interviews'],
                'offers': m['offers']
            }
            for m in months_data
        ]

        # 3. Compute Application Status Distribution
        status_counts = {
            'Applied': 0,
            'Interviewing': 0,
            'Offered': 0,
            'Rejected': 0,
            'Pending': 0
        }
        for item in interests:
            s = (item.status or '').lower()
            if s == 'applied':
                status_counts['Applied'] += 1
            elif s in ['interviewing', 'shortlisted']:
                status_counts['Interviewing'] += 1
            elif s == 'offer':
                status_counts['Offered'] += 1
            elif s == 'rejected':
                status_counts['Rejected'] += 1
            else:
                status_counts['Pending'] += 1

        for nom in nominations:
            s = (nom.status or '').lower()
            if s == 'confirmed_attending':
                status_counts['Interviewing'] += 1
            elif s == 'placed':
                status_counts['Offered'] += 1
            elif s == 'rejected':
                status_counts['Rejected'] += 1
            else:
                status_counts['Pending'] += 1

        status_distribution = [
            {'name': k, 'value': v}
            for k, v in status_counts.items()
        ]

        # 4. Skill Radar Analysis based on Active Resume
        candidate_skills = []
        if active_resume and active_resume.skills:
            candidate_skills = [str(s).lower().strip() for s in active_resume.skills]

        benchmark_skills = [
            {'name': 'Python', 'req': 85},
            {'name': 'SQL', 'req': 80},
            {'name': 'React', 'req': 75},
            {'name': 'Cloud / AWS', 'req': 70},
            {'name': 'Git / DevOps', 'req': 75},
            {'name': 'Algorithms', 'req': 80},
        ]

        skill_data = []
        base_score = int(active_resume.employability_score) if (active_resume and active_resume.employability_score) else 75
        for b in benchmark_skills:
            b_low = b['name'].lower()
            matched = any(
                (b_low in cs) or (cs in b_low) or
                ('cloud' in b_low and any(c in cs for c in ['aws', 'cloud', 'azure', 'docker', 'gcp'])) or
                ('algorithms' in b_low and any(c in cs for c in ['algorithm', 'dsa', 'data structure', 'problem'])) or
                ('git' in b_low and any(c in cs for c in ['git', 'ci/cd', 'devops', 'linux']))
                for cs in candidate_skills
            )
            current_score = base_score if matched else (35 if candidate_skills else 15)
            skill_data.append({
                'name': b['name'],
                'current': current_score,
                'required': b['req']
            })

        total_applications = len(interests) + len(nominations)
        total_interviews = sum(1 for item in interests if item.status in ['interviewing', 'shortlisted']) + sum(1 for nom in nominations if nom.status == 'confirmed_attending')
        total_offers = sum(1 for item in interests if item.status == 'offer') + sum(1 for nom in nominations if nom.status == 'placed')

        return {
            'trend': trend,
            'status_distribution': status_distribution,
            'skill_data': skill_data,
            'total_applications': total_applications,
            'total_interviews': total_interviews,
            'total_offers': total_offers,
            'has_active_resume': bool(active_resume)
        }