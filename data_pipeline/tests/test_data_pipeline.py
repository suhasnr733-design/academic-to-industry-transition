# tests/unit/test_data_pipeline.py

import pytest
import pandas as pd
import numpy as np
from data_pipeline.transformers.data_cleaner import DataCleaner
from data_pipeline.validators.data_validator import DataValidator
from data_pipeline.loaders.database_loader import DatabaseLoader

class TestDataCleaner:
    
    def setup_method(self):
        self.cleaner = DataCleaner()
    
    def test_clean_job_data(self):
        """Test job data cleaning"""
        data = pd.DataFrame({
            'title': ['Software Engineer', 'Data Scientist', None],
            'company': ['Google', 'Microsoft', 'Amazon'],
            'skills': [['Python', 'Java'], ['SQL', 'ML'], []]
        })
        
        cleaned = self.cleaner.clean_job_data(data)
        
        # Check null handling
        assert cleaned['title'].isnull().sum() == 0
        assert cleaned['description'].isnull().sum() == 0
        
        # Check skills cleaning
        assert len(cleaned['skills'][0]) > 0
        
        # Check domain extraction
        assert 'domain' in cleaned.columns
        assert cleaned['domain'][0] in ['Software Development', 'Other']
    
    def test_clean_student_data(self):
        """Test student data cleaning"""
        data = pd.DataFrame({
            'student_id': ['S1', 'S2', 'S3'],
            'cgpa': [8.5, 7.0, 9.2],
            'department': ['CS', 'IS', 'EC'],
            'skills': [['Python'], ['Java'], ['C++']]
        })
        
        cleaned = self.cleaner.clean_student_data(data)
        
        # Check encoding
        assert 'department_encoded' in cleaned.columns
        
        # Check new features
        assert 'project_ratio' in cleaned.columns
        assert 'experience_score' in cleaned.columns

class TestDataValidator:
    
    def setup_method(self):
        self.validator = DataValidator()
    
    def test_validate_job_data(self):
        """Test job data validation"""
        data = pd.DataFrame({
            'title': ['Job 1', 'Job 2'],
            'company': ['Company A', 'Company B'],
            'skills': [['Python'], ['Java']]
        })
        
        results = self.validator.validate_job_data(data)
        assert results['valid'] == True
        assert results['total_rows'] == 2
    
    def test_validate_student_data(self):
        """Test student data validation"""
        data = pd.DataFrame({
            'student_id': ['S1', 'S2'],
            'cgpa': [8.5, 9.0],
            'department': ['CS', 'IS'],
            'skills': [['Python'], ['Java']]
        })
        
        results = self.validator.validate_student_data(data)
        assert results['valid'] == True

class TestDatabaseLoader:
    
    def setup_method(self):
        self.loader = DatabaseLoader()
        self.loader.engine = None  # Use in-memory for testing
    
    def test_create_tables(self):
        """Test table creation"""
        # This would need a test database
        pass
    
    def test_load_dataframe(self):
        """Test loading dataframe"""
        data = pd.DataFrame({
            'title': ['Job 1', 'Job 2'],
            'company': ['A', 'B']
        })
        # Test would need a database connection