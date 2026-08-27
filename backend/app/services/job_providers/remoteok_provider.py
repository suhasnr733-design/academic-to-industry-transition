# backend/app/services/job_providers/remoteok_provider.py

import requests
import re
from typing import Dict, List, Any, Optional
import logging
from app.services.job_providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

class RemoteOKProvider(BaseJobProvider):
    """
    Live global remote tech & AI jobs from RemoteOK (No API key needed)
    API Docs: https://remoteok.com/api
    """
    
    BASE_URL = "https://remoteok.com/api"
    
    def __init__(self, base_url: Optional[str] = None):
        super().__init__(name="remoteok")
        self.base_url = base_url or self.BASE_URL

    def search(self, query: str, location: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch remote tech jobs from RemoteOK"""
        jobs = []
        try:
            response = self.session.get(self.base_url, timeout=10)
            if response.status_code != 200:
                logger.warning(f"RemoteOK API returned status {response.status_code}")
                return []
            
            data = response.json()
            raw_jobs = [item for item in data if isinstance(item, dict) and item.get('id')]
            
            for item in raw_jobs:
                title = item.get('position', '')
                company = item.get('company', '')
                raw_tags = item.get('tags', []) or []
                clean_tags = [str(t).strip() for t in raw_tags if str(t).strip()]
                raw_desc = item.get('description', '')
                clean_desc = re.sub(r'<[^>]+>', ' ', raw_desc).strip()

                # Filter by query terms with title priority & strict match
                if query:
                    if not self.is_query_relevant(query, title, clean_tags, clean_desc):
                        continue
                
                salary_min = item.get('salary_min')
                salary_max = item.get('salary_max')
                salary_range = f"${salary_min:,} - ${salary_max:,}" if salary_min and salary_max else None
                apply_url = item.get('url') or item.get('apply_url') or f"https://remoteok.com/l/{item.get('id')}"

                normalized = self.normalize_job(
                    external_id=str(item.get('id', '')),
                    title=title or 'Software Engineer',
                    company=company or 'Tech Employer',
                    description=clean_desc[:1500] if clean_desc else 'Remote role.',
                    apply_url=apply_url,
                    source='remoteok',
                    location=str(item.get('location') or 'Remote / Worldwide').strip().rstrip(','),
                    required_skills=clean_tags[:6],
                    job_type='Full-time',
                    domain='Tech & Software',
                    salary_range=salary_range,
                    salary_min=float(salary_min) if salary_min else None,
                    salary_max=float(salary_max) if salary_max else None,
                    posted_date=item.get('date'),
                    raw_data={'tags': clean_tags}
                )
                jobs.append(normalized)
                
                if len(jobs) >= limit:
                    break
                    
            logger.info(f"RemoteOKProvider: fetched {len(jobs)} jobs for query '{query}'")
            return jobs
            
        except Exception as e:
            logger.debug(f"RemoteOKProvider unavailable/network drop: {e}")
            return []
