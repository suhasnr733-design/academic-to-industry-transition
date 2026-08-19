# backend/app/services/report_generator.py

from weasyprint import HTML
import jinja2
from app.models import User, Resume
from app.extensions import db
import pandas as pd

class ReportGenerator:
    """Generate PDF reports"""
    
    def generate_student_report(self, student_id):
        """Generate individual student report"""
        student = User.query.get(student_id)
        if not student:
            return None
        
        resumes = Resume.query.filter_by(user_id=student_id).all()
        
        # Calculate statistics
        total_resumes = len(resumes)
        processed_resumes = len([r for r in resumes if r.status == 'completed'])
        
        # Get skills
        all_skills = []
        for resume in resumes:
            if resume.skills:
                all_skills.extend(resume.skills)
        
        top_skills = pd.Series(all_skills).value_counts().head(10).to_dict()
        
        # Get employability scores
        scores = [r.employability_score for r in resumes if r.employability_score]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        # Generate report data
        report_data = {
            'student': student.to_dict(),
            'total_resumes': total_resumes,
            'processed_resumes': processed_resumes,
            'avg_employability_score': avg_score,
            'top_skills': top_skills,
            'resumes': [r.to_dict() for r in resumes]
        }
        
        return report_data
    
    def generate_department_report(self, department):
        """Generate department-wide report"""
        students = User.query.filter_by(
            department=department,
            role='student'
        ).all()
        
        reports = []
        for student in students:
            report = self.generate_student_report(student.id)
            if report:
                reports.append(report)
        
        # Aggregate data
        total_students = len(students)
        avg_employability = sum(r['avg_employability_score'] for r in reports) / len(reports) if reports else 0
        
        return {
            'department': department,
            'total_students': total_students,
            'avg_employability_score': avg_employability,
            'student_reports': reports
        }
    
    def export_to_pdf(self, report_data, template_path, output_path):
        """Export report to PDF"""
        env = jinja2.Environment(loader=jinja2.FileSystemLoader('templates'))
        template = env.get_template(template_path)
        
        html_content = template.render(report=report_data)
        HTML(string=html_content).write_pdf(output_path)
        
        return output_path