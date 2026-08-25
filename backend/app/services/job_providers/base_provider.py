# backend/app/services/job_providers/base_provider.py

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import logging
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import create_urllib3_context

logger = logging.getLogger(__name__)

class TLSAdapter(HTTPAdapter):
    """
    Custom HTTPAdapter that sets TLS cipher suite to DEFAULT:@SECLEVEL=1
    to bypass Cloudflare TLS fingerprint drops on Windows Python OpenSSL 3.x.
    """
    def init_poolmanager(self, *args, **kwargs):
        context = create_urllib3_context(ciphers='DEFAULT:@SECLEVEL=1')
        kwargs['ssl_context'] = context
        return super().init_poolmanager(*args, **kwargs)

    def proxy_manager_for(self, *args, **kwargs):
        context = create_urllib3_context(ciphers='DEFAULT:@SECLEVEL=1')
        kwargs['ssl_context'] = context
        return super().proxy_manager_for(*args, **kwargs)

class BaseJobProvider(ABC):
    """Abstract base class for all job data providers"""
    
    def __init__(self, name: str):
        self.name = name
        # Unified session with TLS adapter and standard browser headers
        self.session = requests.Session()
        self.session.mount('https://', TLSAdapter())
        self.session.mount('http://', HTTPAdapter())
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, application/xml, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9'
        })

    @abstractmethod
    def search(self, query: str, location: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search jobs matching query and location.
        Returns a list of standardized job dictionaries.
        """
        pass

    def normalize_job(
        self,
        external_id: str,
        title: str,
        company: str,
        description: str,
        apply_url: str,
        source: str,
        location: Optional[str] = 'Remote',
        required_skills: Optional[List[str]] = None,
        job_type: Optional[str] = 'Full-time',
        domain: Optional[str] = None,
        experience_required: Optional[int] = 0,
        salary_range: Optional[str] = None,
        salary_min: Optional[float] = None,
        salary_max: Optional[float] = None,
        currency: Optional[str] = 'USD',
        posted_date: Optional[str] = None,
        raw_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Produce a uniform schema dictionary consistent across all providers
        and compatible with the Job model and frontend expectations.
        """
        return {
            'id': f"ext_{source}_{external_id}",
            'external_id': str(external_id),
            'title': title.strip() if title else 'Untitled Position',
            'company': company.strip() if company else 'Confidential',
            'description': description.strip() if description else '',
            'required_skills': required_skills or [],
            'experience_required': experience_required or 0,
            'location': location or 'Remote',
            'salary_range': salary_range,
            'salary_min': salary_min,
            'salary_max': salary_max,
            'currency': currency or 'USD',
            'job_type': job_type or 'Full-time',
            'domain': domain or 'Tech',
            'source': source,
            'apply_url': apply_url,
            'is_live': True,
            'posted_date': posted_date,
            'raw_data': raw_data or {}
        }
