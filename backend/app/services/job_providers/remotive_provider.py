# backend/app/services/job_providers/remotive_provider.py

import requests
import re
from typing import Dict, List, Any, Optional
import logging
from app.services.job_providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

class RemotiveProvider(BaseJobProvider):
    """
    Option A: Live free remote tech jobs from Remotive API (No API key needed)
    API Docs: https://remotive.com/api/remote-jobs
    """
    
    BASE_URL = "https://remotive.com/api/remote-jobs"
    
    def __init__(self, base_url: Optional[str] = None):
        super().__init__(name="remotive")
        self.base_url = base_url or self.BASE_URL

    def search(self, query: str, location: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch remote tech jobs from Remotive"""
        jobs = []
        try:
            params = {
                'search': query or 'developer',
                'limit': limit * 2  # Fetch slightly more to filter effectively
            }
            
            response = self.session.get(self.base_url, params=params, timeout=10)
            if response.status_code != 200:
                logger.warning(f"Remotive API returned status {response.status_code}")
                return []
            
            data = response.json()
            raw_jobs = data.get('jobs', [])
            
            for item in raw_jobs[:limit]:
                raw_desc = item.get('description', '')
                clean_desc = re.sub(r'<[^>]+>', ' ', raw_desc).strip()
                
                tags = item.get('tags', []) or []
                category = item.get('category', 'Software Development')
                
                normalized = self.normalize_job(
                    external_id=str(item.get('id', '')),
                    title=item.get('title', 'Software Engineer'),
                    company=item.get('company_name', 'Tech Company'),
                    description=clean_desc[:1500] if clean_desc else 'Remote tech opportunity.',
                    apply_url=item.get('url', 'https://remotive.com'),
                    source='remotive',
                    location=item.get('candidate_required_location') or 'Remote',
                    required_skills=tags,
                    job_type=item.get('job_type', 'full_time').replace('_', ' ').title(),
                    domain=category,
                    salary_range=item.get('salary') or 'Competitive',
                    posted_date=item.get('publication_date'),
                    raw_data={
                        'company_logo': item.get('company_logo'),
                        'salary': item.get('salary')
                    }
                )
                jobs.append(normalized)
                
            logger.info(f"RemotiveProvider: fetched {len(jobs)} jobs for query '{query}'")
            return jobs
            
        except Exception as e:
            logger.warning(f"RemotiveProvider error during search: {e}")
            return []
