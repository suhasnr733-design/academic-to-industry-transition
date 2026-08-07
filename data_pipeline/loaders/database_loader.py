# data_pipeline/loaders/database_loader.py

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from data_pipeline.config import DataConfig
import logging

class DatabaseLoader:
    """Load data into database"""
    
    def __init__(self):
        self.config = DataConfig()
        self.logger = logging.getLogger(__name__)
        self.engine = None
        self._connect()
    
    def _connect(self):
        """Connect to database"""
        try:
            self.engine = create_engine(self.config.DATABASE_URL)
            self.logger.info(f"Connected to database: {self.config.DATABASE_URL}")
        except Exception as e:
            self.logger.error(f"Database connection failed: {e}")
            raise
    
    def create_tables(self):
        """Create necessary tables if they don't exist"""
        tables_sql = """
        -- Jobs table
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            company TEXT,
            description TEXT,
            skills TEXT,
            required_skills TEXT,
            experience_required INTEGER,
            location TEXT,
            salary_range TEXT,
            job_type TEXT,
            domain TEXT,
            source TEXT,
            source_url TEXT,
            posted_date DATETIME,
            scraped_date DATETIME
        );
        
        -- Courses table
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            skills TEXT,
            platform TEXT,
            url TEXT,
            price REAL,
            rating REAL,
            created_at DATETIME
        );
        
        -- Students table
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT UNIQUE,
            name TEXT,
            department TEXT,
            year_of_study INTEGER,
            cgpa REAL,
            skills TEXT,
            internship_months INTEGER,
            projects INTEGER,
            certifications INTEGER,
            placed INTEGER,
            created_at DATETIME
        );
        
        -- Skill mappings table
        CREATE TABLE IF NOT EXISTS skill_mappings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            skill_name TEXT UNIQUE,
            category TEXT,
            domain TEXT,
            priority INTEGER
        );
        
        -- Company data table
        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            domain TEXT,
            location TEXT,
            website TEXT,
            is_active INTEGER DEFAULT 1
        );
        """
        
        try:
            with self.engine.connect() as conn:
                for sql in tables_sql.split(';'):
                    if sql.strip():
                        conn.execute(text(sql))
                conn.commit()
            self.logger.info("Tables created successfully")
        except Exception as e:
            self.logger.error(f"Error creating tables: {e}")
    
    def load_jobs(self, df: pd.DataFrame) -> int:
        """Load job data into database"""
        return self._load_dataframe(df, 'jobs')
    
    def load_courses(self, df: pd.DataFrame) -> int:
        """Load course data into database"""
        return self._load_dataframe(df, 'courses')
    
    def load_students(self, df: pd.DataFrame) -> int:
        """Load student data into database"""
        return self._load_dataframe(df, 'students')
    
    def load_skill_mappings(self, df: pd.DataFrame) -> int:
        """Load skill mappings"""
        return self._load_dataframe(df, 'skill_mappings')
    
    def _load_dataframe(self, df: pd.DataFrame, table_name: str) -> int:
        """Load dataframe to database table"""
        try:
            # Convert any list columns to JSON strings
            for col in df.columns:
                if df[col].apply(lambda x: isinstance(x, list)).any():
                    df[col] = df[col].apply(lambda x: pd.json.dumps(x) if isinstance(x, list) else x)
            
            df.to_sql(table_name, self.engine, if_exists='append', index=False)
            self.logger.info(f"Loaded {len(df)} rows into {table_name}")
            return len(df)
        except SQLAlchemyError as e:
            self.logger.error(f"Error loading to {table_name}: {e}")
            return 0
        except Exception as e:
            self.logger.error(f"Unexpected error: {e}")
            return 0
    
    def load_from_csv(self, csv_path: str, table_name: str) -> int:
        """Load data from CSV file to database"""
        try:
            df = pd.read_csv(csv_path)
            return self._load_dataframe(df, table_name)
        except Exception as e:
            self.logger.error(f"Error loading from CSV: {e}")
            return 0
    
    def get_jobs(self, limit: int = 100) -> pd.DataFrame:
        """Get jobs from database"""
        try:
            query = f"SELECT * FROM jobs LIMIT {limit}"
            return pd.read_sql(query, self.engine)
        except Exception as e:
            self.logger.error(f"Error fetching jobs: {e}")
            return pd.DataFrame()
    
    def get_skills_mapping(self) -> dict:
        """Get skill mappings from database"""
        try:
            query = "SELECT skill_name, category, domain FROM skill_mappings"
            df = pd.read_sql(query, self.engine)
            return df.to_dict('records')
        except Exception as e:
            self.logger.error(f"Error fetching skill mappings: {e}")
            return []