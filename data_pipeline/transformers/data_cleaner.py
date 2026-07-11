# data_pipeline/transformers/data_cleaner.py

import pandas as pd
import numpy as np
import re
from typing import Dict, List, Any
from sklearn.preprocessing import LabelEncoder
from data_pipeline.config import DataConfig
import logging

class DataCleaner:
    """Clean and preprocess raw data"""
    
    def __init__(self):
        self.config = DataConfig()
        self.logger = logging.getLogger(__name__)
        self.label_encoders = {}
        
    def clean_job_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean job listings data"""
        self.logger.info("Cleaning job data...")
        
        df_clean = df.copy()
        
        # Remove duplicates
        df_clean = df_clean.drop_duplicates(subset=['title', 'company'], keep='first')
        self.logger.info(f"Removed duplicates. Remaining rows: {len(df_clean)}")
        
        # Handle missing values
        df_clean['description'] = df_clean['description'].fillna('')
        df_clean['location'] = df_clean['location'].fillna('Unknown')
        df_clean['salary'] = df_clean['salary'].fillna('Not Specified')
        
        # Clean skills column
        if 'skills' in df_clean.columns:
            df_clean['skills'] = df_clean['skills'].apply(self._clean_skills)
        else:
            df_clean['skills'] = df_clean.apply(self._extract_skills_from_description, axis=1)
        
        # Extract domain from title
        df_clean['domain'] = df_clean['title'].apply(self._extract_domain)
        
        # Clean location
        df_clean['city'] = df_clean['location'].apply(self._extract_city)
        
        # Clean experience required
        df_clean['experience_years'] = df_clean.get('experience', df_clean.get('experience_required', '0'))
        df_clean['experience_years'] = df_clean['experience_years'].apply(self._extract_experience_years)
        
        self.logger.info(f"Cleaned job data. Shape: {df_clean.shape}")
        return df_clean
    
    def clean_course_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean course data"""
        self.logger.info("Cleaning course data...")
        
        df_clean = df.copy()
        
        # Remove duplicates
        df_clean = df_clean.drop_duplicates(subset=['title', 'platform'], keep='first')
        
        # Handle missing values
        df_clean['description'] = df_clean['description'].fillna('')
        df_clean['skills'] = df_clean.get('skills', pd.Series()).apply(
            lambda x: x if isinstance(x, list) else []
        )
        
        # Extract skills from description if not available
        if 'skills' not in df_clean.columns or df_clean['skills'].isnull().all():
            df_clean['skills'] = df_clean['description'].apply(self._extract_skills_from_text)
        
        self.logger.info(f"Cleaned course data. Shape: {df_clean.shape}")
        return df_clean
    
    def clean_student_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean student data"""
        self.logger.info("Cleaning student data...")
        
        df_clean = df.copy()
        
        # Handle missing values
        df_clean['cgpa'] = df_clean['cgpa'].fillna(df_clean['cgpa'].median())
        df_clean['skill_count'] = df_clean['skill_count'].fillna(0)
        df_clean['internship_months'] = df_clean['internship_months'].fillna(0)
        
        # Encode categorical columns
        categorical_cols = ['department', 'year_of_study']
        for col in categorical_cols:
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].astype(str)
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    df_clean[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df_clean[col])
                else:
                    df_clean[f'{col}_encoded'] = self.label_encoders[col].transform(df_clean[col])
        
        # Create additional features
        df_clean['project_ratio'] = df_clean['projects'] / (df_clean['skill_count'] + 1)
        df_clean['experience_score'] = df_clean['internship_months'] + df_clean['projects'] * 2
        df_clean['certification_score'] = df_clean['certifications'] * 2 + df_clean['workshops'] * 1
        
        # Normalize numerical features
        numerical_cols = ['cgpa', 'skill_count', 'internship_months', 'projects', 
                          'certifications', 'workshops']
        for col in numerical_cols:
            if col in df_clean.columns:
                df_clean[f'{col}_normalized'] = (df_clean[col] - df_clean[col].min()) / \
                                                (df_clean[col].max() - df_clean[col].min())
        
        self.logger.info(f"Cleaned student data. Shape: {df_clean.shape}")
        return df_clean
    
    def _clean_skills(self, skills):
        """Clean and normalize skills"""
        if isinstance(skills, list):
            skills = [s.strip() for s in skills if s and s.strip()]
            return list(set(skills))  # Remove duplicates
        elif isinstance(skills, str):
            # Parse string to list
            skills_list = re.split(r'[,;|]', skills)
            skills_list = [s.strip() for s in skills_list if s and s.strip()]
            return list(set(skills_list))
        return []
    
    def _extract_skills_from_description(self, row):
        """Extract skills from job description"""
        description = row.get('description', '') + ' ' + row.get('title', '')
        return self._extract_skills_from_text(description)
    
    def _extract_skills_from_text(self, text):
        """Extract skills from text using keyword matching"""
        skills_pool = ['Python', 'Java', 'SQL', 'Git', 'Docker', 'AWS', 'Machine Learning', 
                       'Deep Learning', 'React', 'Angular', 'Node.js', 'Django', 'Flask']
        found_skills = []
        for skill in skills_pool:
            if skill.lower() in text.lower():
                found_skills.append(skill)
        return found_skills
    
    def _extract_domain(self, title):
        """Extract domain from job title"""
        domains = {
            'Data Scientist': 'AI/ML',
            'Machine Learning': 'AI/ML',
            'Data Engineer': 'Data',
            'Software Engineer': 'Software Development',
            'Developer': 'Software Development',
            'DevOps': 'Cloud/DevOps',
            'Cloud': 'Cloud/DevOps',
            'Frontend': 'Web Development',
            'Backend': 'Software Development',
            'Full Stack': 'Web Development'
        }
        
        for key, domain in domains.items():
            if key.lower() in title.lower():
                return domain
        return 'Other'
    
    def _extract_city(self, location):
        """Extract city from location string"""
        if pd.isna(location) or not location:
            return 'Unknown'
        
        cities = ['Bangalore', 'Hyderabad', 'Chennai', 'Delhi', 'Mumbai', 'Pune', 
                  'Noida', 'Gurgaon', 'Kolkata', 'Ahmedabad']
        
        for city in cities:
            if city.lower() in location.lower():
                return city
        return 'Other'
    
    def _extract_experience_years(self, experience):
        """Extract years of experience"""
        if pd.isna(experience):
            return 0
        
        experience_str = str(experience).lower()
        years = re.search(r'(\d+)', experience_str)
        if years:
            return int(years.group(1))
        
        return 0