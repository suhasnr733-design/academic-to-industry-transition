# backend/app/services/job_providers/arbeitnow_provider.py

import requests
import re
from typing import Dict, List, Any, Optional
import logging
from app.services.job_providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

class ArbeitnowProvider(BaseJobProvider):
    """
    Option A: Live free tech jobs from Arbeitnow Job Board API (No API key needed)
    API Docs: https://www.arbeitnow.com/api/job-board-api
    """
    
    BASE_URL = "https://www.arbeitnow.com/api/job-board-api"
    
    def __init__(self, base_url: Optional[str] = None):
        super().__init__(name="arbeitnow")
        self.base_url = base_url or self.BASE_URL

    def search(self, query: str, location: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch developer and tech jobs from Arbeitnow"""
        jobs = []
        try:
            response = self.session.get(self.base_url, timeout=10)
            if response.status_code != 200:
                logger.warning(f"Arbeitnow API returned status {response.status_code}")
                return []
            
            data = response.json()
            raw_jobs = data.get('data', [])
            
            query_terms = [t.lower() for t in query.split()] if query else []
            query_phrase = query.lower() if query else ''

            for item in raw_jobs:
                title = item.get('title', '')
                title_lower = title.lower()
                company = item.get('company_name', '')
                tags = item.get('tags', []) or []
                tags_str = ' '.join(tags).lower()
                clean_desc = re.sub(r'<[^>]+>', ' ', item.get('description', '')).strip()

                if query:
                    if not self.is_query_relevant(query, title, tags, clean_desc):
                        continue
                
                job_location = item.get('location', 'Remote / Global')
                if item.get('remote'):
                    job_location = f"Remote ({job_location})"
                
                normalized = self.normalize_job(
                    external_id=str(item.get('slug', '')),
                    title=title or 'Software Developer',
                    company=company or 'Tech Employer',
                    description=clean_desc[:1500] if clean_desc else 'Engineering opening.',
                    apply_url=item.get('url', 'https://www.arbeitnow.com'),
                    source='arbeitnow',
                    location=job_location,
                    required_skills=tags,
                    job_type='Full-time' if 'Full-time' in item.get('job_types', []) else 'Full-time',
                    domain='Software Engineering',
                    salary_range='Competitive',
                    posted_date=item.get('created_at'),
                    raw_data={'slug': item.get('slug')}
                )
                jobs.append(normalized)
                
                if len(jobs) >= limit:
                    break
                    
            logger.info(f"ArbeitnowProvider: fetched {len(jobs)} matching jobs for query '{query}'")
            return jobs
            
        except Exception as e:
            logger.debug(f"ArbeitnowProvider network drop: {e}")
            return []
