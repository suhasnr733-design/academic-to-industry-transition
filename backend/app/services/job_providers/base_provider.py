# backend/app/services/job_providers/base_provider.py

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import logging
import html
import re
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

logger = logging.getLogger(__name__)

class BaseJobProvider(ABC):
    """Abstract base class for all job data providers"""
    
    def __init__(self, name: str):
        self.name = name
        # Standard requests session with retry strategy and modern browser headers
        self.session = requests.Session()
        retry_strategy = Retry(
            total=2,
            backoff_factor=0.3,
            status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False
        )
        adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=15, pool_maxsize=25)
        self.session.mount('https://', adapter)
        self.session.mount('http://', adapter)
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json, application/xml, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'close'
        })

    @staticmethod
    def is_query_relevant(query: str, title: str, tags: Optional[List[Any]] = None, description: str = '', domain: str = '') -> bool:
        """
        Pure Title-Based Search.
        Matches strictly against the Job Title to guarantee 100% role accuracy
        and eliminates description boilerplate false positives.
        """
        if not query or not query.strip():
            return True

        query_clean = query.lower().strip()
        query_words = [w for w in query_clean.split() if len(w) > 1]
        if not query_words:
            return True

        title_lower = (title or '').lower()

        # Multi-word query (e.g. "DevOps Engineer", "Data Analyst", "Frontend Developer"):
        # ALL words in the query MUST be present in the job title
        if len(query_words) > 1:
            return all(w in title_lower for w in query_words)

        # Single-word query (e.g. "Python", "DevOps", "React"):
        # Must be in the title
        return query_clean in title_lower

    @staticmethod
    def is_location_relevant(target_location: Optional[str], job_location: Optional[str]) -> bool:
        """
        Strict Location Matching:
        If a user specifies a location (e.g. Mangalore), ONLY show jobs matching that location.
        """
        if not target_location or not target_location.strip():
            return True

        target = target_location.lower().strip()
        job_loc = (job_location or '').lower().strip()

        # If user explicitly searched "remote", accept remote/worldwide/global jobs
        if 'remote' in target:
            return any(w in job_loc for w in ['remote', 'worldwide', 'global', 'anywhere'])

        # For specific city search (e.g. Mangalore, Bangalore, Mumbai):
        # The target location or its official name (e.g. mangaluru for mangalore) MUST be in the job's location
        if target in job_loc:
            return True
        if target == 'mangalore' and 'mangaluru' in job_loc:
            return True
        if target == 'bangalore' and 'bengaluru' in job_loc:
            return True

        return False

    @staticmethod
    def is_domain_relevant(title: Optional[str], description: Optional[str] = '') -> bool:
        """
        Filters out low-skill retail, manual labor, single-word brand titles, and foreign non-English roles.
        """
        if not title or not title.strip():
            return False

        t_clean = title.strip()
        t_lower = t_clean.lower()
        d_lower = (description or '').lower()

        # 1. Reject German-only job title markers (m/w/d, m/w/x, d/m/w, *in)
        if any(marker in t_lower for marker in ['(m/w/d)', '(m/w/x)', '(d/m/w)', '(w/m/d)', '*in']):
            german_words = ['und', 'für', 'mit', 'wir', 'deine', 'aufgaben', 'unser', 'ihre', 'erfahrung', 'kenntnisse']
            if any(f" {gw} " in f" {d_lower[:400]} " for gw in german_words):
                return False

        # 2. Reject meaningless single-word titles under 5 chars (e.g. "LEGO", "Vaga")
        # unless it is an established tech abbreviation
        if len(t_clean) < 5 and t_lower not in ['qa', 'sre', 'dba', 'sdr', 'dev']:
            return False

        # 3. Excluded non-tech, retail, sales, business development, and trade categories
        excluded_keywords = [
            'account executive', 'account manager', 'sales manager', 'sales representative',
            'sales advisor', 'store associate', 'cashier', 'retail sales', 'retail assistant',
            'business development', ' bdr ', ' sdr ', 'recruiter', 'talent acquisition',
            'human resources', 'customer success', 'customer support', 'client success',
            'copywriter', 'content writer', 'tax preparer', 'tax accountant', 'tax manager',
            ' cpa ', 'cpa firm', 'gardener', 'landscaping', 'groundskeeping', 'chiropract',
            'security guard', 'delivery driver', 'warehouse worker', 'housekeeping',
            'tobacco', 'giftbox', 'counter staff', 'offline merchant qr', 'now hiring',
            'tmt bar', 'facility services', 'medical assistant', 'dental', 'nurse',
            'nursing', 'caregiver', 'cook', 'chef', 'plumber', 'welder', 'carpenter',
            'real estate agent', 'insurance agent', 'bookkeeper', 'paralegal', 'legal assistant'
        ]

        if any(bad in t_lower or bad in d_lower[:350] for bad in excluded_keywords):
            return False

        # 4. Filter out closed/expired postings
        if not BaseJobProvider.is_job_active(t_clean, d_lower):
            return False

        return True

    @staticmethod
    def is_job_active(title: Optional[str], description: Optional[str] = '', posted_date: Any = None) -> bool:
        """
        Validates whether a job posting is actively accepting applications.
        Filters out closed listings, expired deadlines, and posts older than 30 days.
        """
        t_lower = (title or '').lower()
        d_lower = (description or '').lower()
        
        # 1. Reject explicit closed status markers
        closed_markers = [
            'applications closed', 'application closed', 'no longer accepting applications',
            'position has been filled', 'position filled', 'job expired', 'listing expired',
            'deadline has passed', 'deadline passed', 'hiring closed', 'no longer available',
            'offer expired', 'this job is closed', 'not accepting new applicants', 'opportunity closed'
        ]
        if any(marker in t_lower or marker in d_lower[:400] for marker in closed_markers):
            return False

        # 2. 30-Day Freshness Filter
        if posted_date:
            try:
                from datetime import datetime, timezone, timedelta
                now = datetime.now(timezone.utc)
                parsed_dt = None

                if isinstance(posted_date, (int, float)):
                    parsed_dt = datetime.fromtimestamp(posted_date, tz=timezone.utc)
                elif isinstance(posted_date, str):
                    cleaned_str = posted_date.replace('Z', '+00:00')
                    try:
                        parsed_dt = datetime.fromisoformat(cleaned_str)
                    except Exception:
                        pass

                if parsed_dt:
                    if parsed_dt.tzinfo is None:
                        parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
                    if now - parsed_dt > timedelta(days=30):
                        return False
            except Exception:
                pass

        return True

    @abstractmethod
    def search(self, query: str, location: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search jobs matching query and location.
        Returns a list of standardized job dictionaries.
        """
        pass

    @staticmethod
    def clean_text_field(text: Optional[str]) -> str:
        """
        Cleans HTML tags, unescapes entities (&nbsp;, &amp;), fixes Mojibake (Orca Bioâs -> Orca Bio's),
        and normalizes whitespace into clean, single spaces.
        """
        if not text:
            return ''
        
        raw = str(text)
        
        # 1. Fix common Mojibake encoding artifacts (UTF-8 decoded as Windows-1252/ISO-8859-1)
        mojibake_replacements = {
            'â€™': "'",
            'â€˜': "'",
            'â€œ': '"',
            'â€': '"',
            'â€“': '-',
            'â€”': '—',
            'â€¦': '...',
            'âs': "'s",
            'Ã©': 'é',
            'Ã¡': 'á',
            'Ã¼': 'ü',
            'Ã¤': 'ä',
            'Ã¶': 'ö',
            'Ãª': 'ê',
            'â': "'"
        }
        for bad, good in mojibake_replacements.items():
            raw = raw.replace(bad, good)

        # 2. Unescape HTML entities (&nbsp;, &amp;, &#39;, &quot;, etc.)
        raw = html.unescape(raw)
        
        # 3. Replace non-breaking spaces (\xa0) and &nbsp; explicitly with space
        raw = raw.replace('\xa0', ' ').replace('&nbsp;', ' ')
        
        # 4. Strip any residual HTML tags
        raw = re.sub(r'<[^>]+>', ' ', raw)
        
        # 5. Handle literal escaped newlines (e.g. string "\\n" or "\\r")
        raw = raw.replace('\\n', ' ').replace('\\r', ' ').replace('\\t', ' ')
        
        # 6. Collapse multiple whitespaces and newlines into single spaces
        raw = re.sub(r'\s+', ' ', raw).strip()
        
        return raw

    @staticmethod
    def standardize_salary(
        salary_range: Optional[str],
        salary_min: Optional[float] = None,
        salary_max: Optional[float] = None,
        currency: Optional[str] = 'USD'
    ) -> Optional[str]:
        """
        Standardizes disparate international & Indian salary formats:
        - $14/hour -> $14 / hr (≈ $29,120 / yr)
        - $120 - $170 /hour -> $120 - $170 / hr
        - 'Competitive' / empty with min-max -> formatted clean ranges
        """
        if not salary_range or not str(salary_range).strip():
            if salary_min and salary_max:
                sym = "₹" if currency == "INR" else ("$" if currency == "USD" else "")
                return f"{sym}{int(salary_min):,} - {sym}{int(salary_max):,} / yr"
            return "Competitive"

        s = str(salary_range).strip()

        # Handle 'Competitive' variants
        if s.lower() in ['competitive', 'none', 'null', 'not specified', 'unspecified']:
            return "Competitive"

        # Standardize hourly rates (e.g. $14/hour -> $14 / hr)
        if re.search(r'(?:/|\s+per\s+)(?:hr|hour)', s, re.IGNORECASE):
            nums = re.findall(r'\d+(?:\.\d+)?', s)
            clean_s = re.sub(r'(?i)(?:/|\s+per\s+)(?:hr|hour)s?', ' / hr', s)
            if nums and len(nums) == 1:
                hourly_val = float(nums[0])
                annual_val = int(hourly_val * 2080)
                if annual_val > 0:
                    return f"{clean_s} (≈ ${annual_val:,} / yr)"
            return clean_s

        # Standardize annual rates (e.g. /year -> / yr)
        if re.search(r'(?:/|\s+per\s+)(?:yr|year|annum|annual)', s, re.IGNORECASE):
            return re.sub(r'(?i)(?:/|\s+per\s+)(?:yr|year|annum|annual)', ' / yr', s)

        # Standardize monthly rates (e.g. /month -> / mo)
        if re.search(r'(?:/|\s+per\s+)(?:mo|month)', s, re.IGNORECASE):
            return re.sub(r'(?i)(?:/|\s+per\s+)(?:mo|month)', ' / mo', s)

        return s

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
        clean_title = self.clean_text_field(title) or 'Untitled Position'
        clean_company = self.clean_text_field(company) or 'Confidential'
        clean_desc = self.clean_text_field(description)
        clean_salary = self.standardize_salary(
            salary_range=salary_range,
            salary_min=salary_min,
            salary_max=salary_max,
            currency=currency
        )

        # Clean and sanitize location: remove trailing/leading commas and dangling punctuation
        raw_loc = self.clean_text_field(location)
        clean_loc = re.sub(r'^[,\s\-/|;]+|[,\s\-/|;]+$', '', raw_loc)
        clean_loc = re.sub(r',\s*,+', ',', clean_loc).strip()
        final_location = clean_loc if clean_loc else 'Remote'

        # Clean, format, and deduplicate skill tags
        clean_skills = []
        raw_skills = required_skills or []
        if isinstance(raw_skills, str):
            raw_skills = [s.strip() for s in raw_skills.split(',') if s.strip()]
            
        for skill in raw_skills:
            s_str = self.clean_text_field(skill)
            if not s_str or len(s_str) > 35:
                continue
            # Properly capitalize tech keywords (e.g. 'go' -> 'Go', 'python' -> 'Python')
            formatted_skill = s_str if (any(c.isupper() for c in s_str) or '/' in s_str) else s_str.capitalize()
            if formatted_skill not in clean_skills:
                clean_skills.append(formatted_skill)

        return {
            'id': f"ext_{source}_{external_id}",
            'external_id': str(external_id),
            'title': clean_title,
            'company': clean_company,
            'description': clean_desc,
            'required_skills': clean_skills,
            'experience_required': experience_required or 0,
            'location': final_location,
            'salary_range': clean_salary,
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
