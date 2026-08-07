# data_pipeline/data_collector.py

import json
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any
from data_pipeline.scrapers.job_scraper import JobScraper
from data_pipeline.scrapers.course_scraper import CourseScraper
from data_pipeline.config import DataConfig
import logging

class DataCollector:
    """Main data collector orchestrating all data sources"""
    
    def __init__(self):
        self.config = DataConfig()
        self.logger = logging.getLogger(__name__)
        self.job_scraper = JobScraper({})
        self.course_scraper = CourseScraper({})
        
    def collect_jobs(self, keywords: List[str], location: str = 'Bangalore') -> pd.DataFrame:
        """Collect job listings"""
        self.logger.info(f"Starting job collection for keywords: {keywords}")
        
        jobs = self.job_scraper.scrape(
            keywords=keywords,
            location=location
        )
        
        if jobs:
            df = pd.DataFrame(jobs)
            df['collected_date'] = datetime.now()
            df['source'] = df.get('source', 'unknown')
            self._save_data(df, 'jobs', keywords[0] if keywords else 'all')
            return df
        
        return pd.DataFrame()
    
    def collect_courses(self, search_term: str = None) -> pd.DataFrame:
        """Collect course data"""
        self.logger.info(f"Starting course collection for: {search_term or 'all'}")
        
        courses = self.course_scraper.scrape(
            search_term=search_term,
            max_items=200
        )
        
        if courses:
            df = pd.DataFrame(courses)
            df['collected_date'] = datetime.now()
            self._save_data(df, 'courses', search_term or 'all')
            return df
        
        return pd.DataFrame()
    
    def collect_student_data(self, file_path: str = None) -> pd.DataFrame:
        """Collect and load student data"""
        if file_path:
            try:
                df = pd.read_csv(file_path)
                self.logger.info(f"Loaded student data from {file_path}")
                return df
            except Exception as e:
                self.logger.error(f"Error loading student data: {e}")
        
        # Generate synthetic student data
        return self._generate_synthetic_student_data()
    
    def _generate_synthetic_student_data(self, n_samples: int = 500) -> pd.DataFrame:
        """Generate synthetic student data for training"""
        import numpy as np
        
        np.random.seed(42)
        
        departments = ['Computer Science', 'Information Science', 'Electronics', 
                       'Mechanical', 'Civil', 'Electrical']
        
        skills_pool = ['Python', 'Java', 'C++', 'SQL', 'HTML', 'CSS', 'JavaScript', 
                       'React', 'Node.js', 'Machine Learning', 'Deep Learning', 'NLP',
                       'AWS', 'Docker', 'Git', 'Linux', 'MySQL', 'MongoDB', 'Django']
        
        data = []
        for i in range(n_samples):
            student = {
                'student_id': f'STU{i+1:04d}',
                'department': np.random.choice(departments),
                'year_of_study': np.random.choice([3, 4], p=[0.3, 0.7]),
                'cgpa': round(np.random.uniform(5.0, 9.5), 2),
                'skill_count': np.random.randint(3, 12),
                'internship_months': np.random.randint(0, 8),
                'projects': np.random.randint(0, 5),
                'certifications': np.random.randint(0, 4),
                'workshops': np.random.randint(0, 10),
                'hackathon_participation': np.random.choice([0, 1]),
                'placed': np.random.choice([0, 1], p=[0.4, 0.6])
            }
            
            # Generate random skills
            num_skills = student['skill_count']
            student['skills'] = np.random.choice(skills_pool, num_skills, replace=False).tolist()
            
            data.append(student)
        
        df = pd.DataFrame(data)
        self._save_data(df, 'student_data', 'synthetic')
        return df
    
    def _save_data(self, df: pd.DataFrame, data_type: str, category: str):
        """Save collected data"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{data_type}_{category}_{timestamp}.csv"
        
        # Raw data
        raw_path = f"{self.config.RAW_DATA_DIR}/{filename}"
        df.to_csv(raw_path, index=False)
        self.logger.info(f"Saved raw data to {raw_path}")
        
        return raw_path
    
    def collect_all(self) -> Dict[str, pd.DataFrame]:
        """Collect all data sources"""
        results = {}
        
        # Collect jobs for different domains
        domains = ['Software Engineer', 'Data Scientist', 'DevOps Engineer', 
                   'Frontend Developer', 'Backend Developer']
        results['jobs'] = self.collect_jobs(domains)
        
        # Collect courses
        results['courses'] = self.collect_courses('machine learning')
        
        # Collect student data
        results['students'] = self.collect_student_data()
        
        return results