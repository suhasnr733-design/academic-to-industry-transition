import json
import logging

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from data_pipeline.config import DataConfig


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
        """Create database tables"""

        tables_sql = [

            """
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                company TEXT,
                location TEXT,
                url TEXT,
                date_posted TEXT,
                source TEXT,
                collected_date TEXT,
                description TEXT,
                salary TEXT,
                skills TEXT,
                domain TEXT,
                city TEXT,
                experience_years REAL
            )
            """,

            """
            CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                description TEXT,
                skills TEXT,
                platform TEXT,
                url TEXT,
                price REAL,
                rating REAL,
                created_at TEXT
            )
            """,

            """
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT,
                department TEXT,
                year_of_study TEXT,
                cgpa REAL,
                skill_count INTEGER,
                internship_months INTEGER,
                projects INTEGER,
                certifications INTEGER,
                workshops INTEGER,
                hackathon_participation INTEGER,
                placed INTEGER,
                skills TEXT,
                department_encoded INTEGER,
                year_of_study_encoded INTEGER,
                project_ratio REAL,
                experience_score REAL,
                certification_score REAL,
                cgpa_normalized REAL,
                skill_count_normalized REAL,
                internship_months_normalized REAL,
                projects_normalized REAL,
                certifications_normalized REAL,
                workshops_normalized REAL
            )
            """,

            """
            CREATE TABLE IF NOT EXISTS skill_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                skill_name TEXT,
                category TEXT,
                domain TEXT,
                priority INTEGER
            )
            """,

            """
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                domain TEXT,
                location TEXT,
                website TEXT,
                is_active INTEGER DEFAULT 1
            )
            """
        ]

        try:
            with self.engine.begin() as conn:
                for sql in tables_sql:
                    conn.execute(text(sql))

            self.logger.info("Tables created successfully")

        except Exception as e:
            self.logger.error(f"Error creating tables: {e}")

    def load_jobs(self, df: pd.DataFrame) -> int:
        return self._load_dataframe(df, "jobs")

    def load_courses(self, df: pd.DataFrame) -> int:
        return self._load_dataframe(df, "courses")

    def load_students(self, df: pd.DataFrame) -> int:
        return self._load_dataframe(df, "students")

    def load_skill_mappings(self, df: pd.DataFrame) -> int:
        return self._load_dataframe(df, "skill_mappings")

    def _load_dataframe(self, df: pd.DataFrame, table_name: str) -> int:
        """Load dataframe into database"""

        try:
            df = df.copy()

            # Convert lists to JSON strings
            for col in df.columns:
                if df[col].apply(lambda x: isinstance(x, list)).any():
                    df[col] = df[col].apply(
                        lambda x: json.dumps(x) if isinstance(x, list) else x
                    )

            df.to_sql(
                table_name,
                self.engine,
                if_exists="append",
                index=False
            )

            self.logger.info(f"Loaded {len(df)} rows into {table_name}")

            return len(df)

        except SQLAlchemyError as e:
            self.logger.error(f"Database error while loading {table_name}: {e}")
            return 0

        except Exception as e:
            self.logger.error(f"Unexpected error while loading {table_name}: {e}")
            return 0

    def load_from_csv(self, csv_path: str, table_name: str) -> int:
        """Load CSV into database"""

        try:
            df = pd.read_csv(csv_path)
            return self._load_dataframe(df, table_name)

        except Exception as e:
            self.logger.error(f"Error loading CSV: {e}")
            return 0

    def get_jobs(self, limit: int = 100) -> pd.DataFrame:
        """Fetch jobs"""

        try:
            query = text(f"SELECT * FROM jobs LIMIT {limit}")

            with self.engine.connect() as conn:
                return pd.read_sql(query, conn)

        except Exception as e:
            self.logger.error(f"Error fetching jobs: {e}")
            return pd.DataFrame()

    def get_skills_mapping(self):
        """Fetch skill mappings"""

        try:
            query = text(
                "SELECT skill_name, category, domain FROM skill_mappings"
            )

            with self.engine.connect() as conn:
                df = pd.read_sql(query, conn)

            return df.to_dict("records")

        except Exception as e:
            self.logger.error(f"Error fetching skill mappings: {e}")
            return []