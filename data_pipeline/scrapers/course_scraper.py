# data_pipeline/scrapers/course_scraper.py

import requests
import json
from typing import Dict, List, Any
from data_pipeline.scrapers.base_scraper import BaseScraper

class CourseScraper(BaseScraper):
    """Collect course data from various platforms"""
    
    def scrape_coursera(self, search_term: str = None, max_items: int = 100) -> List[Dict[str, Any]]:
        """Scrape courses from Coursera"""
        courses = []
        api_url = "https://api.coursera.org/api/courses.v1"
        
        params = {
            'fields': 'primaryDescription,skills,workload,createdAt',
            'limit': min(max_items, 100)
        }
        
        if search_term:
            params['q'] = 'search'
            params['query'] = search_term
        
        try:
            response = requests.get(api_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            for course in data.get('elements', []):
                course_data = {
                    'title': course.get('name'),
                    'description': course.get('primaryDescription'),
                    'skills': course.get('skills', []),
                    'workload': course.get('workload'),
                    'platform': 'coursera',
                    'url': f"https://www.coursera.org/learn/{course.get('slug')}",
                    'created_at': course.get('createdAt')
                }
                courses.append(course_data)
            
            self.logger.info(f"Scraped {len(courses)} courses from Coursera")
            
        except Exception as e:
            self.logger.error(f"Error scraping Coursera: {e}")
        
        return courses
    
    def scrape_udemy(self, search_term: str = None, max_items: int = 50) -> List[Dict[str, Any]]:
        """Scrape courses from Udemy"""
        courses = []
        api_url = "https://www.udemy.com/api-2.0/courses/"
        
        headers = {
            'Authorization': f"Bearer {self.config.get('udemy_api_key', '')}"
        }
        
        params = {
            'fields[course]': 'title,headline,description,created,objectives_summary',
            'page_size': min(max_items, 100),
            'ordering': 'created'
        }
        
        if search_term:
            params['search'] = search_term
        
        try:
            response = requests.get(api_url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            for course in data.get('results', []):
                course_data = {
                    'title': course.get('title'),
                    'description': course.get('headline'),
                    'full_description': course.get('description'),
                    'objectives': course.get('objectives_summary', []),
                    'platform': 'udemy',
                    'url': course.get('url'),
                    'created_at': course.get('created')
                }
                courses.append(course_data)
            
            self.logger.info(f"Scraped {len(courses)} courses from Udemy")
            
        except Exception as e:
            self.logger.error(f"Error scraping Udemy: {e}")
        
        return courses
    
    def scrape_nptel(self, domain: str = None) -> List[Dict[str, Any]]:
        """Scrape courses from NPTEL"""
        courses = []
        # NPTEL doesn't have public API, using web scraping
        base_url = "https://nptel.ac.in/courses"
        
        try:
            html = self.get_page(base_url)
            soup = self.parse_html(html)
            
            course_links = soup.find_all('a', class_='course-listing')
            
            for link in course_links[:50]:  # Limit to 50 courses
                course_url = link.get('href')
                if course_url:
                    course_data = {
                        'title': link.text.strip(),
                        'url': f"{base_url}/{course_url}",
                        'platform': 'nptel'
                    }
                    courses.append(course_data)
            
            self.logger.info(f"Scraped {len(courses)} courses from NPTEL")
            
        except Exception as e:
            self.logger.error(f"Error scraping NPTEL: {e}")
        
        return courses
    
    def scrape(self, **kwargs) -> List[Dict[str, Any]]:
        """Main scrape method"""

        all_courses = []

        # Skip Coursera
        self.logger.warning("Skipping Coursera (API unavailable)")

        # Skip Udemy
        self.logger.warning("Skipping Udemy (API unavailable)")

        # Only scrape NPTEL
        nptel_courses = self.scrape_nptel(kwargs.get("domain"))
        all_courses.extend(nptel_courses)

        return all_courses
    
    def parse_item(self, item):
        
        """
        Required implementation of abstract method from BaseScraper.
        """
        return item