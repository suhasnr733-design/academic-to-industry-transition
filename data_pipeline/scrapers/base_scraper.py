# data_pipeline/scrapers/base_scraper.py

import requests
import time
import logging
from typing import Dict, List, Any
from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import random

class BaseScraper(ABC):
    """Base scraper class for all data sources"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': config.get('user_agent', 'Mozilla/5.0')
        })
        self.driver = None
        
    def setup_selenium(self):
        """Setup Selenium WebDriver for dynamic content"""
        if not self.driver:
            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            self.driver = webdriver.Chrome(options=options)
    
    def get_page(self, url: str, use_selenium: bool = False, retries: int = 3):
        """Get page content with retries"""
        for attempt in range(retries):
            try:
                if use_selenium:
                    self.setup_selenium()
                    self.driver.get(url)
                    time.sleep(random.uniform(1, 3))
                    return self.driver.page_source
                else:
                    response = self.session.get(url, timeout=30)
                    response.raise_for_status()
                    return response.text
            except Exception as e:
                self.logger.warning(f"Attempt {attempt + 1} failed: {e}")
                time.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception(f"Failed to fetch page after {retries} attempts: {url}")
    
    def parse_html(self, html: str) -> BeautifulSoup:
        """Parse HTML content"""
        return BeautifulSoup(html, 'html.parser')
    
    def close(self):
        """Close resources"""
        if self.driver:
            self.driver.quit()
    
    @abstractmethod
    def scrape(self, **kwargs) -> List[Dict[str, Any]]:
        """Main scraping method to be implemented"""
        pass
    
    @abstractmethod
    def parse_item(self, item) -> Dict[str, Any]:
        """Parse individual item"""
        pass