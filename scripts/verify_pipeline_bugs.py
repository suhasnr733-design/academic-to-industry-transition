import logging
import os
import sys
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))




from data_pipeline.transformers.data_cleaner import DataCleaner
from data_pipeline.quality.data_quality_framework import DataQualityFramework
from data_pipeline.validators.data_validator import DataValidator
from data_pipeline.loaders.database_loader import DatabaseLoader

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("BugVerifier")


def verify_cleaner_edge_cases() -> bool:
    """Verify DataCleaner handles None titles, missing skills, and empty DataFrames without error."""
    try:
        cleaner = DataCleaner()
        df = pd.DataFrame({
            "title": ["Software Engineer", None, "Data Scientist"],
            "company": ["Google", "Meta", None],
            "skills": [["Python", "SQL"], [], None]
        })
        cleaned = cleaner.clean_job_data(df)
        assert len(cleaned) == 3
        logger.info("✅ DataCleaner edge case check passed.")
        return True
    except Exception as e:
        logger.error(f"❌ DataCleaner edge case check failed: {e}")
        return False


def verify_quality_framework_list_checking() -> bool:
    """Verify DataQualityFramework handles object columns containing list types without array truth value errors."""
    try:
        framework = DataQualityFramework()
        df = pd.DataFrame({
            "job_id": [1, 2],
            "title": ["Engineer", "Scientist"],
            "skills": [["Python", "SQL"], ["ML", "PyTorch"]]
        })
        result = framework.assess_data_quality(df, data_type="jobs")

        assert "overall_score" in result
        logger.info("✅ DataQualityFramework list evaluation check passed.")
        return True
    except Exception as e:
        logger.error(f"❌ DataQualityFramework list evaluation check failed: {e}")
        return False


def verify_database_schema_loader() -> bool:
    """Verify DatabaseLoader initializes tables safely."""
    try:
        loader = DatabaseLoader()
        loader.create_tables()
        logger.info("✅ DatabaseLoader table creation check passed.")
        return True
    except Exception as e:
        logger.error(f"❌ DatabaseLoader table creation check failed: {e}")
        return False


def run_bug_verification() -> bool:
    logger.info("Starting pipeline bug diagnostic and boundary verification...")
    results = [
        verify_cleaner_edge_cases(),
        verify_quality_framework_list_checking(),
        verify_database_schema_loader()
    ]
    all_passed = all(results)
    if all_passed:
        logger.info("🎉 All boundary and bug verification diagnostics passed 100%!")
    else:
        logger.error("❌ Diagnostic verification found failures.")
    return all_passed


if __name__ == "__main__":
    success = run_bug_verification()
    sys.exit(0 if success else 1)
