# backend/app/services/job_providers/weworkremotely_provider.py

import requests
import xml.etree.ElementTree as ET
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

from .base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

class WeWorkRemotelyProvider(BaseJobProvider):
    """
    Job provider for We Work Remotely via public RSS feed.
    Zero API key required, reliable and instant.
    """

    RSS_URL = 'https://weworkremotely.com/remote-jobs.rss'

    def __init__(self, timeout: int = 8):
        super().__init__(name='weworkremotely')
        self.timeout = timeout

    def search(self, query: str, location: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Search WeWorkRemotely RSS feed for matching jobs"""
        jobs: List[Dict[str, Any]] = []

        try:
            url = self.RSS_URL
            response = self.session.get(url, timeout=self.timeout)
            if response.status_code != 200:
                logger.warning(f"WeWorkRemotelyProvider returned status {response.status_code}")
                return []

            root = ET.fromstring(response.content)
            channel = root.find('channel')
            if channel is None:
                return []

            query_lower = query.lower() if query else ''

            for item in channel.findall('item'):
                title_elem = item.find('title')
                link_elem = item.find('link')
                desc_elem = item.find('description')
                pub_date_elem = item.find('pubDate')
                guid_elem = item.find('guid')

                raw_title = title_elem.text if title_elem is not None else 'Untitled'
                link = link_elem.text if link_elem is not None else ''
                desc = desc_elem.text if desc_elem is not None else ''
                pub_date = pub_date_elem.text if pub_date_elem is not None else ''
                guid = guid_elem.text if guid_elem is not None else link

                company = 'We Work Remotely Partner'
                title = raw_title
                if ':' in raw_title:
                    parts = raw_title.split(':', 1)
                    company = parts[0].strip()
                    title = parts[1].strip()

                clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()
                clean_desc = re.sub(r'\s+', ' ', clean_desc)

                if query_lower:
                    if query_lower not in title.lower() and query_lower not in clean_desc.lower():
                        continue

                skills = self._extract_skills(clean_desc)

                job = self.normalize_job(
                    external_id=guid or str(hash(title + company)),
                    title=title,
                    company=company,
                    description=clean_desc[:2500],
                    apply_url=link,
                    source='weworkremotely',
                    location='Remote / Global',
                    required_skills=skills,
                    job_type='Full-time',
                    domain='Tech & Software',
                    posted_date=pub_date or datetime.utcnow().isoformat()
                )
                jobs.append(job)

                if len(jobs) >= limit:
                    break

            logger.info(f"WeWorkRemotelyProvider returned {len(jobs)} jobs for query '{query}'")
        except Exception as exc:
            logger.error(f"WeWorkRemotelyProvider error during search: {exc}")

        return jobs

    def _extract_skills(self, text: str) -> List[str]:
        skill_vocab = [
            'Python', 'R', 'SQL', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow',
            'Data Science', 'Statistics', 'NLP', 'Computer Vision', 'Docker', 'Kubernetes',
            'AWS', 'GCP', 'Azure', 'React', 'JavaScript', 'TypeScript', 'Node.js', 'Java',
            'C++', 'Rust', 'Go', 'Linux', 'Git', 'CI/CD', 'Bioinformatics'
        ]
        found = []
        text_lower = text.lower()
        for skill in skill_vocab:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found.append(skill)
        return found[:8]
