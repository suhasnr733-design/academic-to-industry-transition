import logging
import time
from datetime import datetime
from typing import Any, Dict, List

from data_pipeline.production.config import ProductionConfig
from data_pipeline.scrapers.job_scraper import JobScraper
from data_pipeline.scrapers.course_scraper import CourseScraper
from data_pipeline.transformers.data_cleaner import DataCleaner
from data_pipeline.validators.data_validator import DataValidator
from data_pipeline.loaders.database_loader import DatabaseLoader
from data_pipeline.monitoring.data_quality_monitor import DataQualityMonitor


class ProductionDataPipeline:
    """
    Production pipeline orchestrator.

    Flow:
        Scrape
          ↓
        Clean
          ↓
        Validate
          ↓
        Load
          ↓
        Quality Check
    """

    def __init__(self):
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s"
        )

        self.logger = logging.getLogger("ProductionDataPipeline")

        self.config = ProductionConfig()

        # Configuration required by the existing scrapers
        scraper_config = {
            "user_agent": "Mozilla/5.0",
            "job_portals": ["naukri", "linkedin", "indeed"],
            "udemy_api_key": "",
        }

        self.job_scraper = JobScraper(scraper_config)
        self.course_scraper = CourseScraper(scraper_config)

        self.cleaner = DataCleaner()
        self.validator = DataValidator()
        self.loader = DatabaseLoader()
        self.quality_monitor = DataQualityMonitor()

        self.logger.info("ProductionDataPipeline initialized")

    def run_pipeline(self) -> Dict[str, Any]:
        """Run the complete production pipeline."""

        start_time = time.time()

        self.logger.info("=" * 60)
        self.logger.info("Starting Production Data Pipeline")
        self.logger.info("=" * 60)

        results = {
            "status": "started",
            "start_time": datetime.now().isoformat(),
            "job_pipeline": None,
            "course_pipeline": None,
        }

        try:
            self.logger.info("Starting job pipeline...")
            results["job_pipeline"] = self.run_job_pipeline()

            self.logger.info("Starting course pipeline...")
            results["course_pipeline"] = self.run_course_pipeline()

            elapsed_time = time.time() - start_time

            results["status"] = "completed"
            results["end_time"] = datetime.now().isoformat()
            results["elapsed_seconds"] = round(elapsed_time, 4)

            self.logger.info("=" * 60)
            self.logger.info(
                "Production pipeline completed in %.4f seconds",
                elapsed_time
            )
            self.logger.info("=" * 60)

            return results

        except Exception as error:
            elapsed_time = time.time() - start_time

            results["status"] = "failed"
            results["error"] = str(error)
            results["end_time"] = datetime.now().isoformat()
            results["elapsed_seconds"] = round(elapsed_time, 4)

            self.logger.exception("Production pipeline failed")

            return results

        finally:
            # Close scraper resources safely
            try:
                self.job_scraper.close()
            except Exception:
                pass

            try:
                self.course_scraper.close()
            except Exception:
                pass

    def run_job_pipeline(self) -> Dict[str, Any]:
        """Scrape, clean, validate and load job data."""

        start_time = time.time()

        self.logger.info("Job pipeline started")

        try:
            keywords = [
                "python",
                "data scientist",
                "machine learning",
                "software engineer",
            ]

            # 1. Scrape
            self.logger.info("Scraping job data...")

            jobs = self.job_scraper.scrape_all(
                keywords=keywords,
                location="Bangalore"
            )

            self.logger.info(
                "Scraped %d job records",
                len(jobs)
            )

            if not jobs:
                return {
                    "status": "completed",
                    "records_scraped": 0,
                    "records_cleaned": 0,
                    "records_loaded": 0,
                    "message": "No job records were returned by the scraper."
                }

            # 2. Convert to DataFrame
            import pandas as pd

            jobs_df = pd.DataFrame(jobs)

            # 3. Clean
            self.logger.info("Cleaning job data...")

            cleaned_jobs = self.cleaner.clean_job_data(jobs_df)

            # 4. Validate
            self.logger.info("Validating job data...")

            validation = self.validator.validate_job_data(
                cleaned_jobs
            )

            self.logger.info(
                "Job validation result: %s",
                validation
            )

            # Stop if validation explicitly fails
            if isinstance(validation, dict):
                if (validation.get("valid") is False or validation.get("is_valid") is False):
                    return {
                        "status": "failed",
                        "records_scraped": len(jobs),
                        "records_cleaned": len(cleaned_jobs),
                        "validation": validation
                    }

            # 5. Load into database
            self.logger.info("Loading job data into database...")

            loaded_jobs = self.loader.load_jobs(cleaned_jobs)

            elapsed_time = time.time() - start_time

            self.logger.info(
                "Job pipeline completed in %.4f seconds",
                elapsed_time
            )

            return {
                "status": "completed",
                "records_scraped": len(jobs),
                "records_cleaned": len(cleaned_jobs),
                "records_loaded": loaded_jobs,
                "validation": validation,
                "elapsed_seconds": round(elapsed_time, 4)
            }

        except Exception as error:
            self.logger.exception(
                "Job pipeline failed: %s",
                error
            )

            return {
                "status": "failed",
                "error": str(error)
            }

    def run_course_pipeline(self) -> Dict[str, Any]:
        """Scrape, clean, validate and load course data."""

        start_time = time.time()

        self.logger.info("Course pipeline started")

        try:
            # 1. Scrape courses
            self.logger.info("Scraping course data...")

            courses = self.course_scraper.scrape(
                search_term="Python",
                max_items=50
            )

            self.logger.info(
                "Scraped %d course records",
                len(courses)
            )

            if not courses:
                return {
                    "status": "completed",
                    "records_scraped": 0,
                    "records_cleaned": 0,
                    "records_loaded": 0,
                    "message": "No course records were returned by the scraper."
                }

            # 2. Convert to DataFrame
            import pandas as pd

            courses_df = pd.DataFrame(courses)

            # 3. Clean
            self.logger.info("Cleaning course data...")

            cleaned_courses = self.cleaner.clean_course_data(
                courses_df
            )

            # 4. Validate
            self.logger.info("Validating course data...")

            validation = self.validator.validate_course_data(
                cleaned_courses
            )

            self.logger.info(
                "Course validation result: %s",
                validation
            )

            # Stop if validation explicitly fails
            if isinstance(validation, dict):
                if (validation.get("valid") is False or validation.get("is_valid") is False):
                    return {
                        "status": "failed",
                        "records_scraped": len(courses),
                        "records_cleaned": len(cleaned_courses),
                        "validation": validation
                    }

            # 5. Load into database
            self.logger.info(
                "Loading course data into database..."
            )

            loaded_courses = self.loader.load_courses(
                cleaned_courses
            )

            elapsed_time = time.time() - start_time

            self.logger.info(
                "Course pipeline completed in %.4f seconds",
                elapsed_time
            )

            return {
                "status": "completed",
                "records_scraped": len(courses),
                "records_cleaned": len(cleaned_courses),
                "records_loaded": loaded_courses,
                "validation": validation,
                "elapsed_seconds": round(elapsed_time, 4)
            }

        except Exception as error:
            self.logger.exception(
                "Course pipeline failed: %s",
                error
            )

            return {
                "status": "failed",
                "error": str(error)
            }


if __name__ == "__main__":
    pipeline = ProductionDataPipeline()

    result = pipeline.run_pipeline()

    print("\nPipeline Result:")
    print(result)