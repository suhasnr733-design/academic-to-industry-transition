# data_pipeline/scrapers/feed_collector.py

import logging
import requests
import xml.etree.ElementTree as ET
import re
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class FeedCollector:
    """
    Collector for open RSS and JSON feeds from major job platforms
    (We Work Remotely, RemoteOK, Nature Careers, etc.)
    Zero API key required, zero ban risk, reliable and fast.
    """

    WWR_FEEDS = {
        'all': 'https://weworkremotely.com/remote-jobs.rss',
        'programming': 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
        'backend': 'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss'
    }

    REMOTEOK_API = 'https://remoteok.com/api'

    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AcademicToIndustryBot/1.0'
        }

    def collect_weworkremotely(self, category: str = 'all', query: Optional[str] = None, limit: int = 25) -> List[Dict[str, Any]]:
        """Fetch and parse jobs from We Work Remotely RSS feeds."""
        url = self.WWR_FEEDS.get(category, self.WWR_FEEDS['all'])
        jobs = []

        try:
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            if response.status_code != 200:
                logger.warning(f"WeWorkRemotely RSS returned status {response.status_code}")
                return []

            root = ET.fromstring(response.content)
            channel = root.find('channel')
            if channel is None:
                return []

            for item in channel.findall('item'):
                title_elem = item.find('title')
                link_elem = item.find('link')
                desc_elem = item.find('description')
                pub_date_elem = item.find('pubDate')

                raw_title = title_elem.text if title_elem is not None else 'Untitled'
                link = link_elem.text if link_elem is not None else ''
                desc = desc_elem.text if desc_elem is not None else ''
                pub_date = pub_date_elem.text if pub_date_elem is not None else ''

                # WWR titles are usually "Company Name: Job Title"
                company = 'We Work Remotely Partner'
                title = raw_title
                if ':' in raw_title:
                    parts = raw_title.split(':', 1)
                    company = parts[0].strip()
                    title = parts[1].strip()

                # Clean HTML from description
                clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()
                clean_desc = re.sub(r'\s+', ' ', clean_desc)

                # Filter by keyword if provided
                if query:
                    q_lower = query.lower()
                    if q_lower not in title.lower() and q_lower not in clean_desc.lower():
                        continue

                # Extract basic skills from description
                skills = self._extract_basic_skills(clean_desc)

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': 'Remote / Global',
                    'job_type': 'Full-time',
                    'domain': 'Tech & Software',
                    'description': clean_desc[:2000],
                    'required_skills': skills,
                    'apply_url': link,
                    'source': 'weworkremotely',
                    'is_live': True,
                    'posted_date': pub_date or datetime.utcnow().isoformat(),
                    'academic_fit_score': self._calculate_academic_fit(title, clean_desc, skills)
                })

                if len(jobs) >= limit:
                    break

            logger.info(f"Collected {len(jobs)} jobs from WeWorkRemotely RSS")
        except Exception as e:
            logger.error(f"Error collecting WeWorkRemotely RSS: {e}")

        return jobs

    def collect_remoteok(self, query: Optional[str] = None, limit: int = 25) -> List[Dict[str, Any]]:
        """Fetch and parse jobs from RemoteOK public JSON API."""
        jobs = []
        try:
            response = requests.get(self.REMOTEOK_API, headers=self.headers, timeout=self.timeout)
            if response.status_code != 200:
                logger.warning(f"RemoteOK API returned status {response.status_code}")
                return []

            data = response.json()
            # RemoteOK returns metadata in the first element, jobs in subsequent
            raw_items = [item for item in data if isinstance(item, dict) and item.get('id')]

            for item in raw_items:
                title = item.get('position', 'Untitled')
                company = item.get('company', 'Unknown')
                desc = item.get('description', '')
                clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()
                tags = item.get('tags', [])
                apply_url = item.get('url') or item.get('apply_url') or f"https://remoteok.com/l/{item.get('id')}"

                if query:
                    q_lower = query.lower()
                    if q_lower not in title.lower() and q_lower not in clean_desc.lower() and not any(q_lower in t.lower() for t in tags):
                        continue

                jobs.append({
                    'title': title,
                    'company': company,
                    'location': item.get('location') or 'Remote',
                    'job_type': 'Full-time',
                    'domain': 'Tech & Software',
                    'description': clean_desc[:2000],
                    'required_skills': tags,
                    'salary_range': f"${item.get('salary_min', '')} - ${item.get('salary_max', '')}" if item.get('salary_min') else None,
                    'apply_url': apply_url,
                    'source': 'remoteok',
                    'is_live': True,
                    'posted_date': item.get('date') or datetime.utcnow().isoformat(),
                    'academic_fit_score': self._calculate_academic_fit(title, clean_desc, tags)
                })

                if len(jobs) >= limit:
                    break

            logger.info(f"Collected {len(jobs)} jobs from RemoteOK API")
        except Exception as e:
            logger.error(f"Error collecting RemoteOK API: {e}")

        return jobs

    def collect_all(self, query: Optional[str] = None, limit_per_feed: int = 15) -> List[Dict[str, Any]]:
        """Collect and combine all available free feeds."""
        wwr = self.collect_weworkremotely(query=query, limit=limit_per_feed)
        remoteok = self.collect_remoteok(query=query, limit=limit_per_feed)
        return wwr + remoteok

    def _extract_basic_skills(self, text: str) -> List[str]:
        """Simple skill tag extraction from text."""
        skill_vocab = [
            'Python', 'R', 'SQL', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow',
            'Data Science', 'Statistics', 'NLP', 'Computer Vision', 'Docker', 'Kubernetes',
            'AWS', 'GCP', 'Azure', 'React', 'JavaScript', 'TypeScript', 'Node.js', 'Java',
            'C++', 'Rust', 'Go', 'Linux', 'Git', 'CI/CD', 'Bioinformatics', 'Genomics'
        ]
        found = []
        text_lower = text.lower()
        for skill in skill_vocab:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found.append(skill)
        return found[:8]

    def _calculate_academic_fit(self, title: str, description: str, skills: List[str]) -> int:
        """Heuristic score (0-100) estimating how relevant the role is for academic/research transition."""
        score = 50
        content = (title + ' ' + description).lower()
        
        # High academic relevance keywords
        academic_keywords = ['phd', 'master', 'research', 'scientist', 'r&d', 'publications', 'statistical', 'algorithm', 'machine learning', 'deep learning', 'quantitative']
        for kw in academic_keywords:
            if kw in content:
                score += 7

        # Practical software skills boost
        research_skills = {'python', 'r', 'pytorch', 'tensorflow', 'statistics', 'nlp', 'data science', 'bioinformatics'}
        matched_research = sum(1 for s in skills if s.lower() in research_skills)
        score += (matched_research * 4)

        return min(max(score, 30), 98)
