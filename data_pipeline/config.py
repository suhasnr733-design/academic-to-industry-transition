import os
from dotenv import load_dotenv
import yaml

load_dotenv(".env.data")


class DataConfig:
    """Data pipeline configuration"""

    # Directories
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))

    RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
    PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "data", "processed")
    CURATED_DATA_DIR = os.path.join(BASE_DIR, "data", "curated")
    LOGS_DIR = os.path.join(BASE_DIR, "data", "logs")
    MODELS_DIR = os.path.join(BASE_DIR, "data", "models")

    # Database
    DATABASE_URL = os.environ.get(
        "DATABASE_URL",
        "sqlite:///data/processed/industry_data.db"
    )

    # API Keys
    COURSERA_API_KEY = os.environ.get("COURSERA_API_KEY")
    UDEMY_API_KEY = os.environ.get("UDEMY_API_KEY")

    # Scraping
    SCRAPING_DELAY = 2
    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36"
    )

    # Validation
    MAX_FILE_SIZE = 50 * 1024 * 1024
    REQUIRED_SKILLS = ["Python", "Java", "SQL", "Git"]
    MIN_SKILLS_PER_JOB = 3

    # Logging
    LOG_LEVEL = "INFO"
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    @staticmethod
    def load_scraping_config():
        config_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "config",
            "scraping_config.yaml"
        )

        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                return yaml.safe_load(f)

        return {}