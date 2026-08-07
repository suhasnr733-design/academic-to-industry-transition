# tests/test_suite.py

import pytest
import pandas as pd
import numpy as np
from datetime import datetime

class TestDataQuality:
    """Test data quality requirements"""
    
    @pytest.fixture
    def sample_job_data(self):
        return pd.DataFrame({
            'title': ['Software Engineer', 'Data Scientist', 'DevOps Engineer'],
            'company': ['Google', 'Microsoft', 'Amazon'],
            'skills': [['Python', 'Java'], ['SQL', 'ML'], ['AWS', 'Docker']],
            'location': ['Bangalore', 'Hyderabad', 'Bangalore']
        })
    
    def test_job_title_not_empty(self, sample_job_data):
        """Test that job titles are not empty"""
        assert sample_job_data['title'].isnull().sum() == 0
        assert (sample_job_data['title'].str.len() > 0).all()
    
    def test_job_skills_not_empty(self, sample_job_data):
        """Test that job skills are not empty"""
        assert sample_job_data['skills'].apply(lambda x: len(x) > 0).all()
    
    def test_job_location_has_value(self, sample_job_data):
        """Test that job locations have values"""
        assert sample_job_data['location'].isnull().sum() == 0
    
    def test_job_skills_unique(self, sample_job_data):
        """Test that skills within a job are unique"""
        for skills in sample_job_data['skills']:
            assert len(skills) == len(set(skills))