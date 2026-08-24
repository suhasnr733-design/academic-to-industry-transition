# backend/app/services/job_providers/unstop_provider.py

import requests
import re
from typing import Dict, List, Any, Optional
import logging
from app.services.job_providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

class UnstopProvider(BaseJobProvider):
    """
    Live jobs, internships, and hiring challenges from Unstop (formerly Dare2Compete)
    Public API: https://unstop.com/api/public/opportunity/search-result
    """
    
    API_URL = "https://unstop.com/api/public/opportunity/search-result"
    
    def __init__(self):
        super().__init__(name="unstop")

    def search(self, query: str, location: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch jobs and hiring opportunities from Unstop"""
        jobs: List[Dict[str, Any]] = []
        try:
            search_query = query or "Developer"
            params = {
                'opportunity': 'jobs',
                'searchTerm': search_query,
                'per_page': str(limit * 2)
            }
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://unstop.com/jobs'
            }
            
            response = self.session.get(self.API_URL, headers=headers, params=params, timeout=10)
            if response.status_code != 200:
                logger.debug(f"Unstop API returned status {response.status_code}")
                return []
                
            res_json = response.json()
            data_wrapper = res_json.get('data', {})
            raw_items = []
            if isinstance(data_wrapper, dict):
                raw_items = data_wrapper.get('data', [])
            elif isinstance(data_wrapper, list):
                raw_items = data_wrapper

            for item in raw_items:
                if not isinstance(item, dict):
                    continue
                    
                title = item.get('title') or item.get('name') or 'Job Opportunity'
                org = item.get('organisation') or {}
                company = org.get('name') if isinstance(org, dict) else str(item.get('company_name') or 'Hiring Organization')
                
                slug = item.get('public_url') or item.get('seo_url') or item.get('id')
                if slug and str(slug).startswith('http'):
                    apply_url = str(slug)
                elif slug:
                    apply_url = f"https://unstop.com/{str(slug).lstrip('/')}"
                else:
                    apply_url = 'https://unstop.com/jobs'
                
                # Eligibility / Filters
                filters = item.get('filters', []) or []
                eligible_degrees = []
                for f in filters:
                    if isinstance(f, dict) and f.get('name'):
                        eligible_degrees.append(f.get('name'))
                
                req_skills = item.get('required_skills') or []
                if isinstance(req_skills, list):
                    for s in req_skills:
                        if isinstance(s, dict) and s.get('name'):
                            eligible_degrees.append(s.get('name'))
                        elif isinstance(s, str):
                            eligible_degrees.append(s)

                # Salary / CTC
                sal = item.get('jobDetail') or item.get('job_detail') or {}
                salary_min = sal.get('min_salary') if isinstance(sal, dict) else None
                salary_max = sal.get('max_salary') if isinstance(sal, dict) else None
                salary_range = f"₹{salary_min:,.0f} - ₹{salary_max:,.0f} / yr" if salary_min and salary_max else None
                
                loc_list = item.get('locations') or ['India']
                if isinstance(loc_list, list):
                    extracted_locs = []
                    for l in loc_list:
                        if isinstance(l, dict) and l.get('name'):
                            extracted_locs.append(l.get('name'))
                        elif isinstance(l, str):
                            extracted_locs.append(l)
                    loc_str = ", ".join(extracted_locs) if extracted_locs else "India"
                else:
                    loc_str = str(loc_list)

                raw_desc = item.get('details') or item.get('regnRequirements')
                if isinstance(raw_desc, dict):
                    desc_str = str(raw_desc.get('text') or raw_desc.get('description') or f"Hiring opportunity on Unstop for {title} at {company}.")
                else:
                    desc_str = str(raw_desc or f"Hiring opportunity on Unstop for {title} at {company}.")

                normalized = self.normalize_job(
                    external_id=str(item.get('id') or hash(title + company)),
                    title=str(title),
                    company=str(company),
                    description=desc_str[:1500],
                    apply_url=apply_url,
                    source='unstop',
                    location=loc_str,
                    required_skills=eligible_degrees[:5] or ['Fresher / Graduate', 'B.Tech/M.Tech/PhD'],
                    salary_range=salary_range,
                    salary_min=float(salary_min) if salary_min else None,
                    salary_max=float(salary_max) if salary_max else None,
                    currency='INR',
                    job_type='Full-time' if item.get('type') != 'internship' else 'Internship',
                    domain='Competitions & Jobs',
                    posted_date=str(item.get('start_date') or item.get('created_at') or ''),
                    raw_data={
                        'views_count': item.get('viewsCount'),
                        'banner_image': item.get('logoUrl2') or item.get('thumb')
                    }
                )
                jobs.append(normalized)
                
                if len(jobs) >= limit:
                    break

            logger.info(f"UnstopProvider: fetched {len(jobs)} opportunities for '{query}'")
            return jobs
            
        except Exception as e:
            logger.debug(f"UnstopProvider error during search: {e}")
            return []
