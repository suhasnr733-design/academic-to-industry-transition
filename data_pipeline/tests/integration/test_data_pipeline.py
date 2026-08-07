# tests/integration/test_data_pipeline.py

import pytest
import pandas as pd
import os
from data_pipeline.pipeline_orchestrator import PipelineOrchestrator

class TestDataPipelineIntegration:
    
    def setup_method(self):
        self.pipeline = PipelineOrchestrator()
    
    def test_pipeline_components(self):
        """Test all pipeline components work together"""
        try:
            # Test collector
            collector = self.pipeline.collector
            jobs = collector.collect_jobs(['Software Engineer'], max_pages=1)
            assert isinstance(jobs, pd.DataFrame)
            
            # Test cleaner
            cleaner = self.pipeline.cleaner
            if not jobs.empty:
                cleaned = cleaner.clean_job_data(jobs)
                assert 'domain' in cleaned.columns
                assert 'skills' in cleaned.columns
            
            # Test validator
            validator = self.pipeline.validator
            if not jobs.empty:
                results = validator.validate_job_data(jobs)
                assert 'valid' in results
                
        except Exception as e:
            pytest.fail(f"Pipeline component test failed: {e}")
    
    def test_full_pipeline(self):
        """Test the full pipeline execution"""
        # Skip if internet not available
        try:
            import requests
            requests.get('https://www.google.com', timeout=5)
        except:
            pytest.skip("No internet connection")
        
        # Run pipeline with limited data
        results = self.pipeline.run_full_pipeline()
        
        assert 'status' in results
        assert results['status'] in ['success', 'partial_success']
        assert 'stats' in results
        assert 'raw_counts' in results['stats']