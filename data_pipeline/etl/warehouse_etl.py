# data_pipeline/etl/warehouse_etl.py

import pandas as pd
import psycopg2
from sqlalchemy import create_engine
from datetime import datetime, timedelta
from typing import Dict, Any, List
import logging
from data_pipeline.loaders.database_loader import DatabaseLoader

logger = logging.getLogger(__name__)

class WarehouseETL:
    """ETL pipeline for data warehouse"""
    
    def __init__(self):
        self.loader = DatabaseLoader()
        self.engine = self.loader.engine
    
    def extract_from_oltp(self, table_name: str, last_run: datetime = None) -> pd.DataFrame:
        """Extract data from OLTP system"""
        query = f"SELECT * FROM {table_name}"
        if last_run:
            query += f" WHERE updated_at > '{last_run.isoformat()}'"
        
        return pd.read_sql(query, self.engine)
    
    def transform_student_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform student data for warehouse"""
        if df.empty:
            return df
        
        df_clean = df.copy()
        
        # Calculate derived fields
        df_clean['skills_count'] = df_clean['skills'].apply(lambda x: len(x) if x else 0)
        df_clean['internship_months'] = df_clean['internship_months'].fillna(0)
        df_clean['projects_count'] = df_clean['projects'].fillna(0)
        df_clean['certifications_count'] = df_clean['certifications'].fillna(0)
        df_clean['cgpa'] = df_clean['cgpa'].clip(0, 10)
        
        # Select columns for warehouse
        warehouse_cols = ['id', 'department', 'year_of_study', 'cgpa', 
                         'skills_count', 'internship_months', 'projects_count', 
                         'certifications_count']
        
        return df_clean[warehouse_cols].rename(columns={'id': 'student_id'})
    
    def transform_job_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform job data for warehouse"""
        if df.empty:
            return df
        
        df_clean = df.copy()
        
        # Select columns for warehouse
        warehouse_cols = ['id', 'title', 'company', 'domain', 'job_type', 
                         'location', 'experience_required']
        
        return df_clean[warehouse_cols].rename(columns={'id': 'job_id'})
    
    def load_to_warehouse(self, df: pd.DataFrame, table_name: str, 
                         if_exists: str = 'append'):
        """Load data to warehouse"""
        try:
            df.to_sql(table_name, self.engine, if_exists=if_exists, index=False)
            logger.info(f"✅ Loaded {len(df)} rows to {table_name}")
        except Exception as e:
            logger.error(f"Error loading to {table_name}: {e}")
    
    def run_full_etl(self):
        """Run complete ETL pipeline"""
        logger.info("🚀 Starting ETL pipeline")
        start_time = datetime.now()
        
        try:
            # Extract
            logger.info("📥 Extracting data...")
            students = self.extract_from_oltp('users', None)
            jobs = self.extract_from_oltp('jobs', None)
            applications = self.extract_from_oltp('job_applications', None)
            
            # Transform
            logger.info("🔄 Transforming data...")
            dim_students = self.transform_student_data(students)
            dim_jobs = self.transform_job_data(jobs)
            
            # Load
            logger.info("📤 Loading to warehouse...")
            self.load_to_warehouse(dim_students, 'dim_students', 'replace')
            self.load_to_warehouse(dim_jobs, 'dim_jobs', 'replace')
            
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"✅ ETL completed in {duration:.2f} seconds")
            
            return {
                'students': len(dim_students),
                'jobs': len(dim_jobs),
                'duration': duration,
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"ETL failed: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    def refresh_materialized_views(self):
        """Refresh all materialized views"""
        views = ['mv_student_performance', 'mv_job_market_trends', 'mv_user_engagement']
        
        with self.engine.connect() as conn:
            for view in views:
                try:
                    conn.execute(f"REFRESH MATERIALIZED VIEW {view};")
                    conn.commit()
                    logger.info(f"✅ Refreshed view: {view}")
                except Exception as e:
                    logger.error(f"Error refreshing {view}: {e}")