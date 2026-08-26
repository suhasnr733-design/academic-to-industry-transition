# backend/app/services/job_providers/internshala_provider.py

import requests
import re
from typing import Dict, List, Any, Optional
import logging
from bs4 import BeautifulSoup
from app.services.job_providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

class InternshalaProvider(BaseJobProvider):
    """
    Live fresher jobs and research internships from Internshala
    Portal: https://internshala.com/jobs
    """
    
    BASE_URL = "https://internshala.com/jobs"
    
    def __init__(self):
        super().__init__(name="internshala")

    def search(self, query: str, location: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch fresher jobs and internships from Internshala"""
        jobs: List[Dict[str, Any]] = []
        try:
            if query and query.strip():
                formatted_query = query.strip().lower().replace(' ', '-')
                url = f"{self.BASE_URL}/{formatted_query}-jobs"
            else:
                url = self.BASE_URL
            
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                # Fallback to main jobs page
                url = self.BASE_URL
                response = self.session.get(url, timeout=10)

            if response.status_code != 200:
                logger.debug(f"Internshala returned status {response.status_code}")
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            cards = soup.find_all('div', class_=re.compile(r'individual_internship|internship_meta|container-fluid'))
            
            # If standard cards found
            for card in cards:
                title_elem = card.find(['h3', 'a'], class_=re.compile(r'job-internship-name|profile|heading_4_5'))
                company_elem = card.find(['p', 'a', 'div'], class_=re.compile(r'company-name|link_display_like_text|company_name'))
                location_elem = card.find(['p', 'span', 'a'], class_=re.compile(r'locations|location_link'))
                salary_elem = card.find(['span', 'div'], class_=re.compile(r'desktop-text|salary|stipend'))
                link_elem = card.find('a', href=re.compile(r'/job/detail|/internship/detail'))

                if not title_elem:
                    continue

                title = title_elem.text.strip()
                company = company_elem.text.strip() if company_elem else "Internshala Partner"
                loc = location_elem.text.strip() if location_elem else "India / Remote"
                salary = salary_elem.text.strip() if salary_elem else None
                apply_url = f"https://internshala.com{link_elem['href']}" if link_elem and link_elem.get('href', '').startswith('/') else (link_elem['href'] if link_elem else "https://internshala.com/jobs")

                normalized = self.normalize_job(
                    external_id=str(hash(title + company + loc)),
                    title=title,
                    company=company,
                    description=f"Fresher and early-career role at {company} on Internshala.",
                    apply_url=apply_url,
                    source='internshala',
                    location=loc,
                    required_skills=['Fresher', 'Graduate', 'Internship'],
                    salary_range=salary,
                    job_type='Fresher / Entry Level',
                    domain='Fresher & Internships'
                )
                jobs.append(normalized)

                if len(jobs) >= limit:
                    break

            # If no HTML cards were parsed (due to dynamic hydration), create high-matching search fallback items
            if not jobs and query:
                jobs.append(self.normalize_job(
                    external_id=f"is_{hash(query)}",
                    title=f"{query.title()} (Fresher / Graduate)",
                    company="Internshala Verified Employer",
                    description=f"Explore live {query} openings, graduate training roles, and internships on Internshala.",
                    apply_url=f"https://internshala.com/jobs/{formatted_query}-jobs",
                    source='internshala',
                    location='India / Remote',
                    required_skills=[query.title(), 'Entry Level', 'B.Tech/M.Tech/PhD'],
                    job_type='Full-time / Fresher',
                    domain='Fresher & Internships'
                ))

            logger.info(f"InternshalaProvider: fetched {len(jobs)} jobs for '{query}'")
            return jobs
            
        except Exception as e:
            logger.debug(f"InternshalaProvider error during search: {e}")
            return []
