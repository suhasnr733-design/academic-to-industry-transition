# data_pipeline/validators/data_validator.py

import pandas as pd
import json
from typing import Dict, List, Any
from data_pipeline.config import DataConfig
import logging

class DataValidator:
    """Validate data quality and integrity"""
    
    def __init__(self):
        self.config = DataConfig()
        self.logger = logging.getLogger(__name__)
        self.validation_results = {}
        
    def validate_job_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate job data quality"""
        results = {
            'total_rows': len(df),
            'missing_values': {},
            'duplicates': 0,
            'invalid_rows': 0,
            'issues': [],
            'valid': True
        }
        
        # Check required columns
        required_cols = ['title', 'company', 'skills']
        for col in required_cols:
            if col not in df.columns:
                results['issues'].append(f"Missing required column: {col}")
                results['valid'] = False
            else:
                null_count = df[col].isnull().sum()
                if null_count > 0:
                    results['missing_values'][col] = null_count
        
        # Check duplicates
        if 'title' in df.columns and 'company' in df.columns:
            duplicates = df.duplicated(subset=['title', 'company']).sum()
            results['duplicates'] = duplicates
        
        # Check skills quality
        if 'skills' in df.columns:
            empty_skills = df[df['skills'].apply(lambda x: not x or len(x) == 0)].shape[0]
            results['invalid_rows'] += empty_skills
            if empty_skills > 0:
                results['issues'].append(f"{empty_skills} rows have empty skills")
        
        # Validate titles
        if 'title' in df.columns:
            short_titles = df[df['title'].str.len() < 3].shape[0]
            if short_titles > 0:
                results['issues'].append(f"{short_titles} rows have suspiciously short titles")
        
        results['valid'] = len(results['issues']) == 0
        
        self.logger.info(f"Job validation complete: {'PASS' if results['valid'] else 'FAIL'}")
        return results
    
    def validate_student_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate student data quality"""
        results = {
            'total_rows': len(df),
            'missing_values': {},
            'outliers': {},
            'issues': [],
            'valid': True
        }
        
        # Check required columns
        required_cols = ['student_id', 'cgpa', 'department', 'skills']
        for col in required_cols:
            if col not in df.columns:
                results['issues'].append(f"Missing required column: {col}")
                results['valid'] = False
            else:
                null_count = df[col].isnull().sum()
                if null_count > 0:
                    results['missing_values'][col] = null_count
        
        # Check CGPA range
        if 'cgpa' in df.columns:
            invalid_cgpa = df[(df['cgpa'] < 0) | (df['cgpa'] > 10)].shape[0]
            if invalid_cgpa > 0:
                results['outliers']['cgpa'] = invalid_cgpa
                results['issues'].append(f"{invalid_cgpa} rows have invalid CGPA")
        
        # Check skill count
        if 'skills' in df.columns:
            empty_skills = df[df['skills'].apply(lambda x: not x or len(x) == 0)].shape[0]
            if empty_skills > 0:
                results['issues'].append(f"{empty_skills} rows have empty skills")
        
        # Check year of study
        if 'year_of_study' in df.columns:
            invalid_year = df[~df['year_of_study'].isin([1, 2, 3, 4])].shape[0]
            if invalid_year > 0:
                results['issues'].append(f"{invalid_year} rows have invalid year of study")
        
        results['valid'] = len(results['issues']) == 0
        
        self.logger.info(f"Student validation complete: {'PASS' if results['valid'] else 'FAIL'}")
        return results
    
    def validate_course_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate course data quality"""
        results = {
            'total_rows': len(df),
            'missing_values': {},
            'issues': [],
            'valid': True
        }
        
        # Check required columns
        required_cols = ['title', 'platform']
        for col in required_cols:
            if col not in df.columns:
                results['issues'].append(f"Missing required column: {col}")
                results['valid'] = False
            else:
                null_count = df[col].isnull().sum()
                if null_count > 0:
                    results['missing_values'][col] = null_count
        
        # Check duplicate titles on same platform
        if 'title' in df.columns and 'platform' in df.columns:
            duplicates = df.duplicated(subset=['title', 'platform']).sum()
            if duplicates > 0:
                results['issues'].append(f"{duplicates} duplicate courses found")
        
        results['valid'] = len(results['issues']) == 0
        
        self.logger.info(f"Course validation complete: {'PASS' if results['valid'] else 'FAIL'}")
        return results