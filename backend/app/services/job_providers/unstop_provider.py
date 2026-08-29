# backend/app/services/job_providers/unstop_provider.py

import requests
import re
import html
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
            params = {
                'opportunity': 'jobs',
                'per_page': str(limit * 2)
            }
            if query and query.strip():
                params['searchTerm'] = query.strip()
            
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
                
                # Check registration and expiration status
                regn_req = item.get('regnRequirements') or {}
                reg_status = str(regn_req.get('reg_status') or item.get('reg_status') or '').upper()
                remain_days = str(regn_req.get('remain_days') or '').lower()
                remaining_time = regn_req.get('remaining_time')

                is_closed = (
                    reg_status == 'FINISHED' or 
                    remain_days == 'ended' or 
                    (remaining_time is not None and isinstance(remaining_time, (int, float)) and remaining_time <= 0)
                )

                deadline_raw = item.get('end_date') or regn_req.get('end_regn_dt') or item.get('regn_end_date')
                deadline_iso = None
                if deadline_raw:
                    try:
                        from datetime import datetime
                        dt_end = datetime.fromisoformat(str(deadline_raw).replace('Z', '+00:00'))
                        deadline_iso = dt_end.isoformat()
                        if dt_end.timestamp() < datetime.now(dt_end.tzinfo).timestamp():
                            is_closed = True
                    except Exception:
                        deadline_iso = str(deadline_raw)

                # Skip expired or closed opportunities so students only see open, active roles
                if is_closed:
                    continue

                # Candidate Eligibility / Target Cohort (e.g. 'Experienced Professionals', 'Engineering Students')
                filters = item.get('filters', []) or []
                eligibility_list = []
                for f in filters:
                    if isinstance(f, dict) and f.get('name'):
                        eligibility_list.append(f.get('name'))
                
                # Real Technical Skills extraction (Unstop uses 'skill' / 'skill_name' keys)
                tech_skills = []
                raw_req_skills = item.get('required_skills') or []
                if isinstance(raw_req_skills, list):
                    for s in raw_req_skills:
                        if isinstance(s, dict):
                            s_name = s.get('skill') or s.get('skill_name') or s.get('name')
                            if s_name and str(s_name).strip() not in tech_skills:
                                tech_skills.append(str(s_name).strip())
                        elif isinstance(s, str) and s.strip() not in tech_skills:
                            tech_skills.append(s.strip())

                if not tech_skills:
                    for s in item.get('skills', []) or []:
                        if isinstance(s, dict) and s.get('name'):
                            tech_skills.append(s.get('name'))
                        elif isinstance(s, str):
                            tech_skills.append(s)

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

                # Clean and strip HTML tags & entities
                desc_str = html.unescape(desc_str)
                desc_str = re.sub(r'<[^>]+>', ' ', desc_str)
                desc_str = re.sub(r'\s+', ' ', desc_str).strip()

                # If tech skills are still missing, scan description for concrete technical competencies
                if not tech_skills:
                    COMMON_TECH = ['Automation Testing', 'Selenium', 'Playwright', 'Appium', 'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Git', 'CI/CD', 'Manual Testing', 'SDET']
                    found = [t for t in COMMON_TECH if re.search(r'\b' + re.escape(t) + r'\b', desc_str, re.IGNORECASE)]
                    if found:
                        tech_skills = found[:6]
                    else:
                        tech_skills = ['Software Development']

                normalized = self.normalize_job(
                    external_id=str(item.get('id') or hash(title + company)),
                    title=str(title),
                    company=str(company),
                    description=desc_str[:1500],
                    apply_url=apply_url,
                    source='unstop',
                    location=loc_str,
                    required_skills=tech_skills,
                    salary_range=salary_range,
                    salary_min=float(salary_min) if salary_min else None,
                    salary_max=float(salary_max) if salary_max else None,
                    currency='INR',
                    job_type='Full-time' if item.get('type') != 'internship' else 'Internship',
                    domain='Competitions & Jobs',
                    posted_date=str(item.get('start_date') or item.get('created_at') or ''),
                    expires_at=deadline_iso,
                    is_active=not is_closed,
                    is_closed=is_closed,
                    eligibility=eligibility_list,
                    raw_data={
                        'views_count': item.get('viewsCount'),
                        'banner_image': item.get('logoUrl2') or item.get('thumb'),
                        'eligibility': eligibility_list,
                        'deadline': deadline_iso
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
