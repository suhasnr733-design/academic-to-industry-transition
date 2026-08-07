# data_pipeline/analytics/report_generator.py

import pandas as pd
from sqlalchemy import text
import json
from datetime import datetime, timedelta
import logging
from data_pipeline.etl.warehouse_etl import WarehouseETL

logger = logging.getLogger(__name__)

class AnalyticsReportGenerator:
    """Generate analytics reports from warehouse"""
    
    def __init__(self):
        self.etl = WarehouseETL()
        self.engine = self.etl.engine
    
    def get_student_performance_report(self) -> Dict[str, Any]:
        """Get student performance report"""
        query = """
        SELECT 
            department,
            year_of_study,
            avg_employability,
            total_resumes,
            avg_cgpa,
            avg_skills
        FROM mv_student_performance
        ORDER BY department, year_of_study
        """
        
        df = pd.read_sql(query, self.engine)
        
        return {
            'report_type': 'student_performance',
            'generated_at': datetime.now().isoformat(),
            'data': df.to_dict('records'),
            'summary': {
                'avg_employability': df['avg_employability'].mean(),
                'total_students': df['total_resumes'].sum(),
                'avg_cgpa': df['avg_cgpa'].mean()
            }
        }
    
    def get_job_market_report(self) -> Dict[str, Any]:
        """Get job market report"""
        query = """
        SELECT 
            domain,
            job_type,
            location,
            total_applications,
            avg_match_score,
            avg_experience
        FROM mv_job_market_trends
        ORDER BY total_applications DESC
        """
        
        df = pd.read_sql(query, self.engine)
        
        return {
            'report_type': 'job_market',
            'generated_at': datetime.now().isoformat(),
            'data': df.to_dict('records'),
            'summary': {
                'total_applications': df['total_applications'].sum(),
                'avg_match_score': df['avg_match_score'].mean(),
                'top_domain': df.iloc[0]['domain'] if not df.empty else None
            }
        }
    
    def get_user_engagement_report(self) -> Dict[str, Any]:
        """Get user engagement report"""
        query = """
        SELECT 
            department,
            year_of_study,
            total_activities,
            avg_session_duration,
            unique_pages
        FROM mv_user_engagement
        ORDER BY total_activities DESC
        """
        
        df = pd.read_sql(query, self.engine)
        
        return {
            'report_type': 'user_engagement',
            'generated_at': datetime.now().isoformat(),
            'data': df.to_dict('records'),
            'summary': {
                'total_activities': df['total_activities'].sum(),
                'avg_engagement': df['total_activities'].mean(),
                'most_engaged_dept': df.iloc[0]['department'] if not df.empty else None
            }
        }
    
    def generate_comprehensive_report(self) -> Dict[str, Any]:
        """Generate comprehensive analytics report"""
        return {
            'generated_at': datetime.now().isoformat(),
            'student_performance': self.get_student_performance_report(),
            'job_market': self.get_job_market_report(),
            'user_engagement': self.get_user_engagement_report(),
            'summary': {
                'total_students': self.get_total_students(),
                'total_jobs': self.get_total_jobs(),
                'total_applications': self.get_total_applications()
            }
        }
    
    def get_total_students(self) -> int:
        """Get total number of students"""
        result = self.engine.execute(text("SELECT COUNT(*) FROM dim_students"))
        return result.scalar()
    
    def get_total_jobs(self) -> int:
        """Get total number of jobs"""
        result = self.engine.execute(text("SELECT COUNT(*) FROM dim_jobs"))
        return result.scalar()
    
    def get_total_applications(self) -> int:
        """Get total number of applications"""
        result = self.engine.execute(text("SELECT COUNT(*) FROM fact_job_applications"))
        return result.scalar()
    
    def export_report_to_json(self, report: Dict, filepath: str):
        """Export report to JSON"""
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        logger.info(f"✅ Report exported to {filepath}")
    
    def export_report_to_csv(self, report: Dict, prefix: str):
        """Export report to CSV files"""
        for key, value in report.items():
            if isinstance(value, dict) and 'data' in value:
                df = pd.DataFrame(value['data'])
                df.to_csv(f"{prefix}_{key}.csv", index=False)
                logger.info(f"✅ Exported {key} to CSV")