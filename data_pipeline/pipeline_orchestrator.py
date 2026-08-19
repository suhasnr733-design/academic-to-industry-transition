# data_pipeline/pipeline_orchestrator.py

import pandas as pd
from datetime import datetime
from typing import Dict, List, Any
from data_pipeline.data_collector import DataCollector
from data_pipeline.transformers.data_cleaner import DataCleaner
from data_pipeline.validators.data_validator import DataValidator
from data_pipeline.loaders.database_loader import DatabaseLoader
from data_pipeline.config import DataConfig
import logging
import json

class PipelineOrchestrator:
    """Orchestrate the entire data pipeline"""
    
    def __init__(self):
        self.config = DataConfig()
        self.logger = logging.getLogger(__name__)
        self.collector = DataCollector()
        self.cleaner = DataCleaner()
        self.validator = DataValidator()
        self.loader = DatabaseLoader()
        self.pipeline_stats = {}
    
    def run_full_pipeline(self) -> Dict[str, Any]:
        """Run the complete data pipeline"""
        self.logger.info("=" * 60)
        self.logger.info("STARTING DATA PIPELINE")
        self.logger.info("=" * 60)
        
        start_time = datetime.now()
        
        try:
            # Step 1: Collect Data
            self.logger.info("Step 1: Collecting Data...")
            raw_data = self.collector.collect_all()
            self.pipeline_stats['raw_counts'] = {
                'jobs': len(raw_data.get('jobs', pd.DataFrame())),
                'courses': len(raw_data.get('courses', pd.DataFrame())),
                'students': len(raw_data.get('students', pd.DataFrame()))
            }
            
            # Step 2: Clean Data
            self.logger.info("Step 2: Cleaning Data...")
            cleaned_data = {}
            for key, df in raw_data.items():
                if key == 'jobs':
                    cleaned_data[key] = self.cleaner.clean_job_data(df)
                elif key == 'courses':
                    cleaned_data[key] = self.cleaner.clean_course_data(df)
                elif key == 'students':
                    cleaned_data[key] = self.cleaner.clean_student_data(df)
            
            self.pipeline_stats['cleaned_counts'] = {
                'jobs': len(cleaned_data.get('jobs', pd.DataFrame())),
                'courses': len(cleaned_data.get('courses', pd.DataFrame())),
                'students': len(cleaned_data.get('students', pd.DataFrame()))
            }
            
            # Step 3: Validate Data
            self.logger.info("Step 3: Validating Data...")
            validation_results = {}
            for key, df in cleaned_data.items():
                if key == 'jobs':
                    validation_results[key] = self.validator.validate_job_data(df)
                elif key == 'courses':
                    validation_results[key] = self.validator.validate_course_data(df)
                elif key == 'students':
                    validation_results[key] = self.validator.validate_student_data(df)
            
            self.pipeline_stats['validation_results'] = validation_results
            
            # Step 4: Load Data
            self.logger.info("Step 4: Loading Data to Database...")
            self.loader.create_tables()
            
            loaded_counts = {}
            for key, df in cleaned_data.items():
                if key == 'jobs':
                    count = self.loader.load_jobs(df)
                    loaded_counts[key] = count
                elif key == 'courses':
                    count = self.loader.load_courses(df)
                    loaded_counts[key] = count
                elif key == 'students':
                    count = self.loader.load_students(df)
                    loaded_counts[key] = count
            
            self.pipeline_stats['loaded_counts'] = loaded_counts
            
            # Step 5: Generate Summary
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            summary = {
                'pipeline_start': start_time.isoformat(),
                'pipeline_end': end_time.isoformat(),
                'duration_seconds': duration,
                'stats': self.pipeline_stats,
                'status': 'success' if all(validation_results.values()) else 'partial_success'
            }
            
            self.logger.info("=" * 60)
            self.logger.info("DATA PIPELINE COMPLETED")
            self.logger.info(f"Duration: {duration:.2f} seconds")
            self.logger.info(f"Status: {summary['status']}")
            self.logger.info("=" * 60)
            
            return summary
            
        except Exception as e:
            self.logger.error(f"Pipeline failed: {e}")
            return {
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def generate_report(self, output_path: str = 'data/pipeline_report.json'):
        """Generate pipeline report"""
        if self.pipeline_stats:
            with open(output_path, 'w') as f:
                json.dump(self.pipeline_stats, f, indent=2, default=str)
            self.logger.info(f"Pipeline report generated: {output_path}")