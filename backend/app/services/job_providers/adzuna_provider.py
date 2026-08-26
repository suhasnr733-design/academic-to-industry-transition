# backend/app/services/job_providers/adzuna_provider.py

import requests
import re
from typing import Dict, List, Any, Optional
import logging
from app.services.job_providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

class AdzunaProvider(BaseJobProvider):
    """
    Option B: Live jobs from Adzuna Global Job Directory
    API Docs: https://developer.adzuna.com/
    """
    
    COUNTRY_MAPPING = {
        'india': 'in',
        'in': 'in',
        'us': 'us',
        'united states': 'us',
        'uk': 'gb',
        'united kingdom': 'gb',
        'canada': 'ca'
    }
    
    def __init__(self, app_id: Optional[str] = None, app_key: Optional[str] = None):
        super().__init__(name="adzuna")
        self.app_id = app_id
        self.app_key = app_key

    def search(self, query: str, location: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch jobs from Adzuna API"""
        if not self.app_id or not self.app_key:
            logger.debug("AdzunaProvider: ADZUNA_APP_ID or ADZUNA_APP_KEY not set, skipping.")
            return []
            
        jobs = []
        try:
            # Determine country code
            country_code = 'in'  # default to India
            if location:
                loc_lower = location.lower()
                for key, code in self.COUNTRY_MAPPING.items():
                    if key in loc_lower:
                        country_code = code
                        break
            
            url = f"https://api.adzuna.com/v1/api/jobs/{country_code}/search/1"
            params = {
                'app_id': self.app_id,
                'app_key': self.app_key,
                'results_per_page': limit,
                'what': query or 'Technology',
                'content-type': 'application/json'
            }
            
            if location and location.lower() != 'remote':
                params['where'] = location
                
            response = self.session.get(url, params=params, timeout=10)
            if response.status_code != 200:
                logger.debug(f"AdzunaProvider returned status {response.status_code}")
                return []
                
            data = response.json()
            raw_results = data.get('results', []) or []
            
            for item in raw_results:
                clean_desc = re.sub(r'<[^>]+>', ' ', item.get('description', '')).strip()
                company_obj = item.get('company') or {}
                location_obj = item.get('location') or {}
                loc_name = location_obj.get('display_name') or location or 'Remote'
                
                min_sal = item.get('salary_min')
                max_sal = item.get('salary_max')
                salary_range = None
                if min_sal and max_sal:
                    salary_range = f"{min_sal:,.0f} - {max_sal:,.0f}"
                elif min_sal:
                    salary_range = f"From {min_sal:,.0f}"
                
                normalized = self.normalize_job(
                    external_id=str(item.get('id', '')),
                    title=item.get('title', 'Engineer'),
                    company=company_obj.get('display_name', 'Company'),
                    description=clean_desc[:1500],
                    apply_url=item.get('redirect_url', 'https://www.adzuna.com'),
                    source='adzuna',
                    location=loc_name,
                    salary_range=salary_range,
                    salary_min=float(min_sal) if min_sal else None,
                    salary_max=float(max_sal) if max_sal else None,
                    job_type='Full-time' if item.get('contract_type') == 'permanent' else 'Contract',
                    domain=item.get('category', {}).get('label', 'IT Jobs'),
                    posted_date=item.get('created'),
                    raw_data={'category': item.get('category')}
                )
                jobs.append(normalized)
                
            logger.info(f"AdzunaProvider: fetched {len(jobs)} jobs from Adzuna")
            return jobs
            
        except Exception as e:
            logger.warning(f"AdzunaProvider error: {e}")
            return []
