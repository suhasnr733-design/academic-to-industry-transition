# tests/performance/test_performance.py

import time
import pytest
from data_pipeline.pipeline_orchestrator import PipelineOrchestrator

class TestPerformance:
    
    @pytest.mark.slow
    def test_pipeline_performance(self):
        """Test pipeline execution time"""
        orchestrator = PipelineOrchestrator()
        
        start_time = time.time()
        orchestrator.run_full_pipeline()
        end_time = time.time()
        
        duration = end_time - start_time
        assert duration < 300, f"Pipeline took {duration} seconds (should be < 300)"
        print(f"Pipeline execution time: {duration:.2f} seconds")
    
    @pytest.mark.slow
    def test_scraping_performance(self):
        """Test scraping performance"""
        from data_pipeline.scrapers.job_scraper import JobScraper
        scraper = JobScraper({})
        
        start_time = time.time()
        jobs = scraper.scrape_naukri('Software Engineer', max_pages=2)
        end_time = time.time()
        
        duration = end_time - start_time
        assert len(jobs) > 0, "No jobs scraped"
        print(f"Scraped {len(jobs)} jobs in {duration:.2f} seconds")