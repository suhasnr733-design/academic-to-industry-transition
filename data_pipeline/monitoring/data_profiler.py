# data_pipeline/monitoring/data_profiler.py

import pandas as pd
import numpy as np
from typing import Dict, Any
from data_pipeline.loaders.database_loader import DatabaseLoader
import logging

class DataProfiler:
    """Profile datasets for better understanding"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.loader = DatabaseLoader()
    
    def profile_jobs(self) -> Dict[str, Any]:
        """Profile job data"""
        self.logger.info("Profiling job data...")
        
        jobs = self.loader.get_jobs(limit=10000)
        if jobs.empty:
            return {'error': 'No job data available'}
        
        profile = {
            'metadata': {
                'total_jobs': len(jobs),
                'unique_companies': jobs['company'].nunique() if 'company' in jobs.columns else 0,
                'unique_titles': jobs['title'].nunique() if 'title' in jobs.columns else 0,
                'columns': jobs.columns.tolist()
            },
            'statistics': {
                'numeric': {},
                'categorical': {}
            },
            'insights': {}
        }
        
        # Numeric statistics
        numeric_cols = jobs.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            profile['statistics']['numeric'][col] = {
                'mean': round(jobs[col].mean(), 2) if not jobs[col].isnull().all() else None,
                'median': round(jobs[col].median(), 2) if not jobs[col].isnull().all() else None,
                'std': round(jobs[col].std(), 2) if not jobs[col].isnull().all() else None,
                'min': jobs[col].min(),
                'max': jobs[col].max(),
                'null_count': jobs[col].isnull().sum()
            }
        
        # Categorical statistics
        categorical_cols = jobs.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if jobs[col].dtype == 'object':
                top_values = jobs[col].value_counts().head(10).to_dict()
                profile['statistics']['categorical'][col] = {
                    'unique_values': jobs[col].nunique(),
                    'top_values': top_values,
                    'null_count': jobs[col].isnull().sum()
                }
        
        # Insights
        if 'domain' in jobs.columns:
            profile['insights']['top_domains'] = jobs['domain'].value_counts().head(5).to_dict()
        
        if 'location' in jobs.columns:
            profile['insights']['top_locations'] = jobs['location'].value_counts().head(5).to_dict()
        
        # Skills analysis
        if 'skills' in jobs.columns:
            all_skills = []
            for skills in jobs['skills']:
                if isinstance(skills, list):
                    all_skills.extend(skills)
            skill_counts = pd.Series(all_skills).value_counts()
            profile['insights']['top_skills'] = skill_counts.head(20).to_dict()
        
        return profile
    
    def generate_profile_report(self, output_path: str = 'data/profile_report.json'):
        """Generate and save profile report"""
        profile = self.profile_jobs()
        import json
        with open(output_path, 'w') as f:
            json.dump(profile, f, indent=2, default=str)
        self.logger.info(f"Profile report saved to {output_path}")
        return profile