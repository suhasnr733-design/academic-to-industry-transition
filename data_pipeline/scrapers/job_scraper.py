# data_pipeline/scrapers/job_scraper.py

from data_pipeline.scrapers.base_scraper import BaseScraper
from typing import Dict, List, Any
import json
import time
import random
import re

class JobScraper(BaseScraper):
    """Scrape job listings from various portals"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.job_portals = config.get('job_portals', [])
    
    def scrape_naukri(self, keyword: str, location: str = 'Bangalore', max_pages: int = 10) -> List[Dict[str, Any]]:
        """Scrape jobs from Naukri.com"""
        jobs = []
        base_url = "https://www.naukri.com/"
        
        for page in range(1, max_pages + 1):
            try:
                search_url = f"{base_url}?keyword={keyword}&location={location}&page={page}"
                html = self.get_page(search_url, use_selenium=True)
                soup = self.parse_html(html)
                
                job_cards = soup.find_all('div', class_='jobTuple')
                if not job_cards:
                    break
                
                for card in job_cards:
                    job = self._parse_naukri_job(card)
                    if job:
                        jobs.append(job)
                
                self.logger.info(f"Scraped page {page} for {keyword} in {location}")
                time.sleep(random.uniform(1, 3))
                
            except Exception as e:
                self.logger.error(f"Error scraping page {page}: {e}")
                continue
        
        return jobs
    
    def _parse_naukri_job(self, card) -> Dict[str, Any]:
        """Parse individual Naukri job card"""
        try:
            # Extract job title
            title_elem = card.find('h3', class_='jobTupleHeaderTitle')
            title = title_elem.text.strip() if title_elem else None
            
            # Extract company
            company_elem = card.find('span', class_='basicInformation')
            company = company_elem.text.strip() if company_elem else None
            
            # Extract location
            location_elem = card.find('span', class_='location')
            location = location_elem.text.strip() if location_elem else None
            
            # Extract skills
            skill_elems = card.find_all('li', class_='tags')
            skills = [skill.text.strip() for skill in skill_elems] if skill_elems else []
            
            # Extract experience
            exp_elem = card.find('span', class_='experience')
            experience = exp_elem.text.strip() if exp_elem else None
            
            # Extract salary
            salary_elem = card.find('span', class_='salary')
            salary = salary_elem.text.strip() if salary_elem else None
            
            # Extract description
            desc_elem = card.find('div', class_='job-description')
            description = desc_elem.text.strip() if desc_elem else None
            
            return {
                'title': title,
                'company': company,
                'location': location,
                'skills': skills,
                'experience': experience,
                'salary': salary,
                'description': description,
                'source': 'naukri'
            }
        except Exception as e:
            self.logger.error(f"Error parsing Naukri job: {e}")
            return None
    
    def scrape_linkedin(self, keyword: str, location: str = 'India', max_pages: int = 5) -> List[Dict[str, Any]]:
        """Scrape jobs from LinkedIn"""
        jobs = []
        base_url = "https://www.linkedin.com/jobs/search/"
        
        for page in range(1, max_pages + 1):
            try:
                params = {
                    'keywords': keyword,
                    'location': location,
                    'start': (page - 1) * 25
                }
                search_url = f"{base_url}?{requests.compat.urlencode(params)}"
                html = self.get_page(search_url, use_selenium=True)
                soup = self.parse_html(html)
                
                job_cards = soup.find_all('div', class_='base-search-card')
                if not job_cards:
                    break
                
                for card in job_cards:
                    job = self._parse_linkedin_job(card)
                    if job:
                        jobs.append(job)
                
                self.logger.info(f"Scraped page {page} from LinkedIn for {keyword}")
                time.sleep(random.uniform(2, 4))
                
            except Exception as e:
                self.logger.error(f"Error scraping LinkedIn page {page}: {e}")
                continue
        
        return jobs
    
    def _parse_linkedin_job(self, card) -> Dict[str, Any]:
        """Parse individual LinkedIn job card"""
        try:
            # Extract job title
            title_elem = card.find('h3', class_='base-search-card__title')
            title = title_elem.text.strip() if title_elem else None
            
            # Extract company
            company_elem = card.find('h4', class_='base-search-card__subtitle')
            company = company_elem.text.strip() if company_elem else None
            
            # Extract location
            location_elem = card.find('span', class_='job-search-card__location')
            location = location_elem.text.strip() if location_elem else None
            
            # Extract URL
            url_elem = card.find('a', class_='base-card__full-link')
            url = url_elem.get('href') if url_elem else None
            
            # Extract date
            date_elem = card.find('time', class_='job-search-card__listdate')
            date = date_elem.get('datetime') if date_elem else None
            
            return {
                'title': title,
                'company': company,
                'location': location,
                'url': url,
                'date_posted': date,
                'source': 'linkedin'
            }
        except Exception as e:
            self.logger.error(f"Error parsing LinkedIn job: {e}")
            return None
    
    def scrape_indeed(self, keyword: str, location: str = 'India', max_pages: int = 10) -> List[Dict[str, Any]]:
        """Scrape jobs from Indeed"""
        jobs = []
        base_url = "https://www.indeed.com/jobs"
        
        for page in range(1, max_pages + 1):
            try:
                params = {
                    'q': keyword,
                    'l': location,
                    'start': (page - 1) * 10
                }
                search_url = f"{base_url}?{requests.compat.urlencode(params)}"
                html = self.get_page(search_url)
                soup = self.parse_html(html)
                
                job_cards = soup.find_all('div', class_='job_seen_beacon')
                if not job_cards:
                    break
                
                for card in job_cards:
                    job = self._parse_indeed_job(card)
                    if job:
                        jobs.append(job)
                
                self.logger.info(f"Scraped page {page} from Indeed for {keyword}")
                time.sleep(random.uniform(1, 2))
                
            except Exception as e:
                self.logger.error(f"Error scraping Indeed page {page}: {e}")
                continue
        
        return jobs
    
    def _parse_indeed_job(self, card) -> Dict[str, Any]:
        """Parse individual Indeed job card"""
        try:
            # Extract job title
            title_elem = card.find('h2', class_='jobTitle')
            title = title_elem.text.strip() if title_elem else None
            
            # Extract company
            company_elem = card.find('span', class_='companyName')
            company = company_elem.text.strip() if company_elem else None
            
            # Extract location
            location_elem = card.find('div', class_='companyLocation')
            location = location_elem.text.strip() if location_elem else None
            
            # Extract salary
            salary_elem = card.find('div', class_='salary-snippet-container')
            salary = salary_elem.text.strip() if salary_elem else None
            
            return {
                'title': title,
                'company': company,
                'location': location,
                'salary': salary,
                'source': 'indeed'
            }
        except Exception as e:
            self.logger.error(f"Error parsing Indeed job: {e}")
            return None
    
    def scrape_all(self, keywords: List[str], location: str = 'Bangalore') -> List[Dict[str, Any]]:
        """Scrape from all portals for given keywords"""
        all_jobs = []
        
        for keyword in keywords:
            self.logger.info(f"Scraping for keyword: {keyword}")
            
            # Scrape from each portal
            naukri_jobs = self.scrape_naukri(keyword, location)
            all_jobs.extend(naukri_jobs)
            
            linkedin_jobs = self.scrape_linkedin(keyword, location)
            all_jobs.extend(linkedin_jobs)
            
            indeed_jobs = self.scrape_indeed(keyword, location)
            all_jobs.extend(indeed_jobs)
            
            self.logger.info(f"Total jobs for {keyword}: {len(naukri_jobs) + len(linkedin_jobs) + len(indeed_jobs)}")
        
        return all_jobs
    
    def scrape(self, **kwargs) -> List[Dict[str, Any]]:
        """Main scrape method"""
        keywords = kwargs.get('keywords', ['Software Engineer', 'Data Scientist'])
        location = kwargs.get('location', 'Bangalore')
        return self.scrape_all(keywords, location)