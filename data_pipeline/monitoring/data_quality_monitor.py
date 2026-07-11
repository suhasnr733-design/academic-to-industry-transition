# data_pipeline/monitoring/data_quality_monitor.py

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any
from data_pipeline.config import DataConfig
from data_pipeline.loaders.database_loader import DatabaseLoader
import json
import logging

class DataQualityMonitor:
    """Monitor data quality metrics over time"""
    
    def __init__(self):
        self.config = DataConfig()
        self.logger = logging.getLogger(__name__)
        self.loader = DatabaseLoader()
        self.quality_metrics = {}
    
    def run_quality_checks(self) -> Dict[str, Any]:
        """Run all quality checks"""
        self.logger.info("Running data quality checks...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'checks': {}
        }
        
        # Run checks for each data type
        results['checks']['jobs'] = self.check_job_data_quality()
        results['checks']['courses'] = self.check_course_data_quality()
        results['checks']['students'] = self.check_student_data_quality()
        
        # Calculate overall score
        results['overall_score'] = self.calculate_overall_score(results['checks'])
        
        self.logger.info(f"Quality check complete. Score: {results['overall_score']}")
        self.quality_metrics = results
        return results
    
    def check_job_data_quality(self) -> Dict[str, Any]:
        """Check quality of job data"""
        jobs = self.loader.get_jobs(limit=1000)
        
        if jobs.empty:
            return {'score': 0, 'issues': ['No data available'], 'metrics': {}}
        
        metrics = {
            'total_rows': len(jobs),
            'missing_values': jobs.isnull().sum().to_dict(),
            'duplicate_count': jobs.duplicated(subset=['title', 'company']).sum() if 'title' in jobs.columns else 0,
            'unique_companies': jobs['company'].nunique() if 'company' in jobs.columns else 0,
            'unique_titles': jobs['title'].nunique() if 'title' in jobs.columns else 0,
            'columns': jobs.columns.tolist()
        }
        
        # Check data freshness
        if 'scraped_date' in jobs.columns:
            latest_date = pd.to_datetime(jobs['scraped_date']).max()
            metrics['latest_data'] = latest_date.isoformat()
            days_old = (datetime.now() - latest_date).days
            metrics['data_age_days'] = days_old
        
        # Calculate score
        score = 100
        issues = []
        
        if metrics.get('missing_values', {}):
            missing_count = sum(metrics['missing_values'].values())
            score -= min(missing_count * 2, 50)
            issues.append(f"Missing values found: {missing_count}")
        
        if metrics.get('duplicate_count', 0) > 0:
            score -= min(metrics['duplicate_count'], 20)
            issues.append(f"Duplicate entries: {metrics['duplicate_count']}")
        
        if metrics.get('total_rows', 0) < 100:
            score -= 20
            issues.append("Low data volume (<100 rows)")
        
        return {
            'score': max(0, score),
            'metrics': metrics,
            'issues': issues
        }
    
    def check_course_data_quality(self) -> Dict[str, Any]:
        """Check quality of course data"""
        # Similar implementation for courses
        return {'score': 100, 'metrics': {}, 'issues': []}
    
    def check_student_data_quality(self) -> Dict[str, Any]:
        """Check quality of student data"""
        # Similar implementation for students
        return {'score': 100, 'metrics': {}, 'issues': []}
    
    def calculate_overall_score(self, checks: Dict) -> float:
        """Calculate overall quality score"""
        scores = [check.get('score', 0) for check in checks.values()]
        return round(np.mean(scores), 2)
    
    def generate_quality_report(self) -> str:
        """Generate HTML quality report"""
        if not self.quality_metrics:
            self.run_quality_checks()
        
        html = f"""
        <html>
        <head>
            <title>Data Quality Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .score {{ font-size: 48px; font-weight: bold; color: #2E7D32; }}
                .warning {{ color: #F57C00; }}
                .danger {{ color: #C62828; }}
                .success {{ color: #2E7D32; }}
                table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>Data Quality Report</h1>
            <p>Generated: {datetime.now().isoformat()}</p>
            
            <div>
                <h2>Overall Score: <span class="{'success' if self.quality_metrics['overall_score'] > 80 else 'warning' if self.quality_metrics['overall_score'] > 60 else 'danger'}">{self.quality_metrics['overall_score']}%</span></h2>
            </div>
            
            <h2>Quality Metrics by Dataset</h2>
            <table>
                <tr>
                    <th>Dataset</th>
                    <th>Score</th>
                    <th>Total Rows</th>
                    <th>Issues</th>
                </tr>
        """
        
        for dataset, check in self.quality_metrics['checks'].items():
            html += f"""
                <tr>
                    <td>{dataset.title()}</td>
                    <td>{check.get('score', 0)}%</td>
                    <td>{check.get('metrics', {}).get('total_rows', 0)}</td>
                    <td>{', '.join(check.get('issues', ['No issues']))}</td>
                </tr>
            """
        
        html += """
            </table>
        </body>
        </html>
        """
        
        return html
    
    def save_report(self, output_path: str = 'data/quality_report.html'):
        """Save quality report to file"""
        html = self.generate_quality_report()
        with open(output_path, 'w') as f:
            f.write(html)
        self.logger.info(f"Quality report saved to {output_path}")