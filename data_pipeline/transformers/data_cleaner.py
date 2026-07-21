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

        # Remove duplicates only if columns exist
        duplicate_cols = [col for col in ['title', 'company'] if col in df_clean.columns]
        if duplicate_cols:
            df_clean = df_clean.drop_duplicates(subset=duplicate_cols, keep="first")

        self.logger.info(f"Removed duplicates. Remaining rows: {len(df_clean)}")

        # Create missing columns
        if 'title' not in df_clean.columns:
            df_clean['title'] = ""

        if 'description' not in df_clean.columns:
            df_clean['description'] = ""

        if 'location' not in df_clean.columns:
            df_clean['location'] = "Unknown"
        else:
            df_clean['location'] = df_clean['location'].fillna("Unknown")

        if 'salary' not in df_clean.columns:
            df_clean['salary'] = "Not Specified"
        else:
            df_clean['salary'] = df_clean['salary'].fillna("Not Specified")

        if 'company' not in df_clean.columns:
            df_clean['company'] = "Unknown"

        # Clean skills
        if 'skills' in df_clean.columns:
            df_clean['skills'] = df_clean['skills'].apply(self._clean_skills)
        else:
            df_clean['skills'] = df_clean.apply(
                self._extract_skills_from_description,
                axis=1
            )

        # Domain
        df_clean['domain'] = df_clean['title'].apply(self._extract_domain)

        # City
        df_clean['city'] = df_clean['location'].apply(self._extract_city)

        # Experience
        if 'experience' in df_clean.columns:
            exp = df_clean['experience']
        elif 'experience_required' in df_clean.columns:
            exp = df_clean['experience_required']
        else:
            exp = pd.Series(["0"] * len(df_clean))

        df_clean['experience_years'] = exp.apply(
            self._extract_experience_years
        )

        self.logger.info(f"Cleaned job data. Shape: {df_clean.shape}")

        return df_clean

    def clean_course_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean course data"""

        self.logger.info("Cleaning course data...")

        df_clean = df.copy()

        duplicate_cols = [c for c in ['title', 'platform'] if c in df_clean.columns]
        if duplicate_cols:
            df_clean = df_clean.drop_duplicates(subset=duplicate_cols)

        if 'title' not in df_clean.columns:
            df_clean['title'] = ""

        if 'platform' not in df_clean.columns:
            df_clean['platform'] = "Unknown"

        if 'description' not in df_clean.columns:
            df_clean['description'] = ""
        else:
            df_clean['description'] = df_clean['description'].fillna("")

        if 'skills' in df_clean.columns:
            df_clean['skills'] = df_clean['skills'].apply(
                lambda x: x if isinstance(x, list) else []
            )
        else:
            df_clean['skills'] = df_clean['description'].apply(
                self._extract_skills_from_text
            )

        self.logger.info(f"Cleaned course data. Shape: {df_clean.shape}")

        return df_clean

    def clean_student_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean student data"""

        self.logger.info("Cleaning student data...")

        df_clean = df.copy()

        df_clean['cgpa'] = df_clean['cgpa'].fillna(df_clean['cgpa'].median())
        df_clean['skill_count'] = df_clean['skill_count'].fillna(0)
        df_clean['internship_months'] = df_clean['internship_months'].fillna(0)

        categorical_cols = ['department', 'year_of_study']

        for col in categorical_cols:
            if col in df_clean.columns:

                df_clean[col] = df_clean[col].astype(str)

                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()

                    df_clean[f"{col}_encoded"] = self.label_encoders[col].fit_transform(
                        df_clean[col]
                    )

                else:
                    df_clean[f"{col}_encoded"] = self.label_encoders[col].transform(
                        df_clean[col]
                    )

        df_clean['project_ratio'] = (
            df_clean['projects'] /
            (df_clean['skill_count'] + 1)
        )

        df_clean['experience_score'] = (
            df_clean['internship_months'] +
            df_clean['projects'] * 2
        )

        df_clean['certification_score'] = (
            df_clean['certifications'] * 2 +
            df_clean['workshops']
        )

        numerical_cols = [
            'cgpa',
            'skill_count',
            'internship_months',
            'projects',
            'certifications',
            'workshops'
        ]

        for col in numerical_cols:
            if col in df_clean.columns:
                minimum = df_clean[col].min()
                maximum = df_clean[col].max()

                if maximum != minimum:
                    df_clean[f"{col}_normalized"] = (
                        (df_clean[col] - minimum) /
                        (maximum - minimum)
                    )
                else:
                    df_clean[f"{col}_normalized"] = 0

        self.logger.info(f"Cleaned student data. Shape: {df_clean.shape}")

        return df_clean

    def _clean_skills(self, skills):
        if isinstance(skills, list):
            return list(set([s.strip() for s in skills if s]))

        elif isinstance(skills, str):
            skills = re.split(r'[,;|]', skills)
            return list(set([s.strip() for s in skills if s.strip()]))

        return []

    def _extract_skills_from_description(self, row):
        description = str(row.get("description", ""))
        title = str(row.get("title", ""))

        return self._extract_skills_from_text(
            description + " " + title
        )

    def _extract_skills_from_text(self, text):

        skills_pool = [
            "Python",
            "Java",
            "SQL",
            "Git",
            "Docker",
            "AWS",
            "Machine Learning",
            "Deep Learning",
            "React",
            "Angular",
            "Node.js",
            "Django",
            "Flask"
        ]

        found = []

        text = str(text)

        for skill in skills_pool:
            if skill.lower() in text.lower():
                found.append(skill)

        return found

    def _extract_domain(self, title):

        title = str(title)

        domains = {
            "Data Scientist": "AI/ML",
            "Machine Learning": "AI/ML",
            "Data Engineer": "Data",
            "Software Engineer": "Software Development",
            "Developer": "Software Development",
            "DevOps": "Cloud/DevOps",
            "Cloud": "Cloud/DevOps",
            "Frontend": "Web Development",
            "Backend": "Software Development",
            "Full Stack": "Web Development",
        }

        for key, value in domains.items():
            if key.lower() in title.lower():
                return value

        return "Other"

    def _extract_city(self, location):

        if pd.isna(location):
            return "Unknown"

        location = str(location)

        cities = [
            "Bangalore",
            "Hyderabad",
            "Chennai",
            "Delhi",
            "Mumbai",
            "Pune",
            "Noida",
            "Gurgaon",
            "Kolkata",
            "Ahmedabad",
        ]

        for city in cities:
            if city.lower() in location.lower():
                return city

        return "Other"

    def _extract_experience_years(self, experience):

        if pd.isna(experience):
            return 0

        experience = str(experience)

        match = re.search(r"(\d+)", experience)

        if match:
            return int(match.group(1))

        return 0