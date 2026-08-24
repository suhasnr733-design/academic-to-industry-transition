# backend/app/services/job_providers/jsearch_provider.py

import requests
from typing import Dict, List, Any, Optional
import logging
from app.services.job_providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

class JSearchProvider(BaseJobProvider):
    """
    Live jobs from LinkedIn, Indeed, Glassdoor & Enterprise career portals via RapidAPI JSearch v5
    API Docs: https://rapidapi.com/letscrape-6bRBa3qguO5/api/jsearch
    """
    
    API_URL_V5 = "https://jsearch.p.rapidapi.com/search-v2"
    API_URL_V1 = "https://jsearch.p.rapidapi.com/search"
    API_HOST = "jsearch.p.rapidapi.com"
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(name="jsearch")
        self.api_key = api_key

    def search(self, query: str, location: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Search LinkedIn/Indeed live jobs via JSearch v5 (with v1 fallback)"""
        if not self.api_key:
            logger.debug("JSearchProvider: RAPIDAPI_KEY is not configured, skipping.")
            return []
            
        jobs = []
        try:
            search_query = query or "Software Engineer"
            if location and location.lower() != 'remote':
                search_query = f"{search_query} in {location}"
                
            headers = {
                "x-rapidapi-key": self.api_key,
                "x-rapidapi-host": self.API_HOST
            }
            
            params = {
                "query": search_query,
                "num_pages": "1"
            }
            
            # Try search-v2 endpoint first (JSearch v5)
            response = self.session.get(self.API_URL_V5, headers=headers, params=params, timeout=10)
            if response.status_code != 200:
                # Fallback to search v1 endpoint
                response = self.session.get(self.API_URL_V1, headers=headers, params=params, timeout=10)

            if response.status_code != 200:
                logger.debug(f"JSearchProvider: API returned status {response.status_code}, skipping JSearch.")
                return []
                
            data = response.json()
            raw_data = data.get('data', [])
            
            # JSearch v5 returns {'data': {'jobs': [...]}} while v1 returns {'data': [...]}
            if isinstance(raw_data, dict):
                raw_jobs = raw_data.get('jobs', [])
            elif isinstance(raw_data, list):
                raw_jobs = raw_data
            else:
                raw_jobs = []
            
            for item in raw_jobs[:limit]:
                title = item.get('job_title') or item.get('title') or 'Software Engineer'
                company = item.get('employer_name') or item.get('company_name') or 'Employer'
                desc = item.get('job_description') or item.get('description') or ''
                apply_link = item.get('job_apply_link') or item.get('apply_link') or item.get('url') or 'https://www.linkedin.com/jobs'
                raw_publisher = str(item.get('job_publisher') or item.get('source') or '').strip().lower()
                if 'linkedin' in raw_publisher:
                    source_tag = 'linkedin'
                elif 'indeed' in raw_publisher:
                    source_tag = 'indeed'
                elif 'glassdoor' in raw_publisher:
                    source_tag = 'glassdoor'
                elif 'ziprecruiter' in raw_publisher:
                    source_tag = 'ziprecruiter'
                elif raw_publisher:
                    source_tag = f"jsearch_{raw_publisher.replace(' ', '_')}"
                else:
                    source_tag = 'linkedin'
                
                skills = []
                highlights = item.get('job_highlights') or {}
                qualifications = highlights.get('Qualifications') or []
                for q in qualifications[:5]:
                    skills.append(q[:40])
                
                min_sal = item.get('job_min_salary') or item.get('min_salary')
                max_sal = item.get('job_max_salary') or item.get('max_salary')
                sal_period = item.get('job_salary_period', 'YEAR')
                salary_range = None
                if min_sal and max_sal:
                    salary_range = f"${min_sal:,.0f} - ${max_sal:,.0f} / {sal_period.lower()}"
                elif min_sal:
                    salary_range = f"From ${min_sal:,.0f} / {sal_period.lower()}"
                    
                city = item.get('job_city') or item.get('city')
                state = item.get('job_state') or item.get('state')
                country = item.get('job_country') or item.get('country')
                loc_parts = [p for p in [city, state, country] if p]
                loc_str = ", ".join(loc_parts) if loc_parts else (location or "Remote")
                if item.get('job_is_remote') or item.get('is_remote'):
                    loc_str = f"Remote ({loc_str})" if loc_str != "Remote" else "Remote"

                normalized = self.normalize_job(
                    external_id=str(item.get('job_id') or item.get('id') or hash(title + company)),
                    title=title,
                    company=company,
                    description=desc[:1500],
                    apply_url=apply_link,
                    source=source_tag,
                    location=loc_str,
                    required_skills=skills,
                    salary_range=salary_range,
                    salary_min=float(min_sal) if min_sal else None,
                    salary_max=float(max_sal) if max_sal else None,
                    currency=item.get('job_salary_currency', 'USD'),
                    job_type=item.get('job_employment_type', 'Full-time').replace('_', ' ').title(),
                    domain='Software & Technology',
                    posted_date=item.get('job_posted_at_datetime_utc') or item.get('posted_at'),
                    raw_data={
                        'publisher': raw_publisher,
                        'employer_logo': item.get('employer_logo') or item.get('company_logo')
                    }
                )
                jobs.append(normalized)
                
            logger.info(f"JSearchProvider: fetched {len(jobs)} jobs for query '{query}'")
            return jobs
            
        except Exception as e:
            logger.debug(f"JSearchProvider error during search: {e}")
            return []
