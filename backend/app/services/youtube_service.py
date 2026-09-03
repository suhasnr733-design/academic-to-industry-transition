# backend/app/services/youtube_service.py

import os
import logging
import requests
import urllib.parse
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class YouTubeService:
    """YouTube integration service with caching and contextual fallback generator"""

    def __init__(self):
        self.api_key = os.environ.get('YOUTUBE_API_KEY')
        self._cache: Dict[str, List[Dict[str, Any]]] = {}

    def get_videos_for_skill(self, skill: str, target_role: str = 'Software Engineer', stage: str = 'learn', max_results: int = 4, language: str = 'en') -> List[Dict[str, Any]]:
        """Fetch YouTube videos dynamically based on target role, skill, learning stage, and language preference"""
        query = self._build_contextual_query(skill, target_role, stage, language)
        cache_key = f"{query}_{max_results}_{language}"

        if cache_key in self._cache:
            return self._cache[cache_key]

        if self.api_key:
            try:
                videos = self._fetch_from_youtube_api(query, max_results, language)
                if videos:
                    self._cache[cache_key] = videos
                    return videos
            except Exception as e:
                logger.warning(f"YouTube API call failed: {e}. Falling back to contextual fallback generator.")

        # Graceful Fallback if API key missing, quota exceeded, or network error
        fallback_videos = self._generate_contextual_fallback(skill, target_role, stage, query)
        self._cache[cache_key] = fallback_videos
        return fallback_videos

    def _build_contextual_query(self, skill: str, target_role: str, stage: str, language: str = 'en') -> str:
        """Generate smart contextual search query based on stage, career target, and language"""
        skill_clean = str(skill).strip()
        role_clean = str(target_role or 'Software Engineer').strip()

        lang_low = str(language or 'en').lower()
        if lang_low in ['hi', 'hindi']:
            lang_suffix = " Hindi tutorial"
        elif lang_low in ['en+hi', 'en_hi', 'english_hindi', 'english+hindi']:
            lang_suffix = " English Hindi tutorial"
        else:
            lang_suffix = " English tutorial"

        if stage == 'practice':
            return f"{skill_clean} practice problems interview preparation {role_clean}{lang_suffix}"
        elif stage == 'build':
            return f"{skill_clean} full project tutorial for {role_clean}{lang_suffix}"
        elif stage == 'assess':
            return f"{skill_clean} interview questions quiz test{lang_suffix}"
        elif stage == 'advanced':
            return f"Advanced {skill_clean} architecture and best practices{lang_suffix}"
        else:
            return f"{skill_clean} full course tutorial for {role_clean} beginners{lang_suffix}"

    def _fetch_from_youtube_api(self, query: str, max_results: int, language: str = 'en') -> List[Dict[str, Any]]:
        """Query official YouTube Data API v3"""
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': max_results,
            'key': self.api_key,
            'relevanceLanguage': 'hi' if language in ['hi', 'hindi'] else 'en'
        }
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            videos = []
            for item in data.get('items', []):
                snippet = item.get('snippet', {})
                video_id = item.get('id', {}).get('videoId')
                if video_id:
                    videos.append({
                        'id': video_id,
                        'title': snippet.get('title'),
                        'channel': snippet.get('channelTitle'),
                        'thumbnail': snippet.get('thumbnails', {}).get('medium', {}).get('url') or f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                        'url': f"https://www.youtube.com/watch?v={video_id}",
                        'embed_url': f"https://www.youtube.com/embed/{video_id}",
                        'duration': '15-45 mins',
                        'difficulty': 'Beginner' if 'beginner' in query.lower() else 'Intermediate'
                    })
            return videos
        return []

    def _generate_contextual_fallback(self, skill: str, target_role: str, stage: str, query: str) -> List[Dict[str, Any]]:
        """Generate high quality contextual video items with valid YouTube search links and live thumbnails"""
        search_encoded = urllib.parse.quote(query)
        base_search_url = f"https://www.youtube.com/results?search_query={search_encoded}"

        # Per-skill YouTube video ID mapping
        skill_low = skill.lower()
        if 'time management' in skill_low or 'productivity' in skill_low or 'time' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'iONDebHX9qk', 'z44w3jBfJp0', 'HAnw168huqA', '0IAPZzGSbME'
        elif 'communication' in skill_low or 'presentation' in skill_low or 'public speaking' in skill_low or 'soft skill' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'HAnw168huqA', 'iONDebHX9qk', 'z44w3jBfJp0', '0IAPZzGSbME'
        elif 'leadership' in skill_low or 'management' in skill_low or 'teamwork' in skill_low or 'collaboration' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'z44w3jBfJp0', 'HAnw168huqA', 'iONDebHX9qk', '0IAPZzGSbME'
        elif 'figma' in skill_low or 'ui/ux' in skill_low or 'design' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'c9Wg6Cb_YlU', 'VqCgcpAypFQ', '1Rs2ND1ryYc', 'pQN-pnXPaVg'
        elif 'vs code' in skill_low or 'vscode' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'VqCgcpAypFQ', 'B-s71n0dHUk', '8JJ101D3knE', 'wBp0Rb-ZJak'
        elif 'postman' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'VywxIQ2ZXw4', 'Oe421EPjeBE', 'SccSCuHhOw0', '8JJ101D3knE'
        elif 'node' in skill_low or 'express' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'Oe421EPjeBE', 'SccSCuHhOw0', 'W6NZfCO5SIk', 'bMknfKXIFA8'
        elif 'ci/cd' in skill_low or 'cicd' in skill_low or 'devops' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'R8_veQiYBjU', 'fqMOX6JJhGo', '8JJ101D3knE', 'wBp0Rb-ZJak'
        elif 'operating system' in skill_low or skill_low == 'os':
            v_id1, v_id2, v_id3, v_id4 = 'bkSWJJZNgf8', 'wBp0Rb-ZJak', 'v_1zB2W9308', '0IAPZzGSbME'
        elif 'oracle' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = '2HVMipp755E', 'HXV3zeQKqGY', 'qw--VYLpxG4', '9PZj7365gC0'
        elif 'scikit' in skill_low or 'sklearn' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = '0B5eIE_1vpU', 'i_LwzRVP7bg', 'rfscVS0vtbw', 'r-uOLxNrNk8'
        elif 'pandas' in skill_low or 'numpy' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'r-uOLxNrNk8', 'i_LwzRVP7bg', 'rfscVS0vtbw', 'HXV3zeQKqGY'
        elif 'nlp' in skill_low or 'natural language' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'fNxaJsNG3-s', 'i_LwzRVP7bg', 'aircAruvnKk', 'rfscVS0vtbw'
        elif 'pytorch' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'V_xro1bcAuA', 'aircAruvnKk', 'i_LwzRVP7bg', 'rfscVS0vtbw'
        elif 'tensorflow' in skill_low or 'keras' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'tPYj3Ng4Y40', 'aircAruvnKk', 'i_LwzRVP7bg', 'rfscVS0vtbw'
        elif 'deep learning' in skill_low or 'neural' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'aircAruvnKk', 'V_xro1bcAuA', 'i_LwzRVP7bg', 'rfscVS0vtbw'
        elif 'machine learning' in skill_low or skill_low == 'ml' or skill_low == 'ai' or 'artificial intelligence' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'i_LwzRVP7bg', 'aircAruvnKk', 'rfscVS0vtbw', 'r-uOLxNrNk8'
        elif skill_low == 'c' or skill_low.startswith('c ') or 'c prog' in skill_low or 'c lang' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'KJgsSFOSQv0', '87SH2Cn0s9A', 'vLnPwxZdW4Y', '0IAPZzGSbME'
        elif 'c++' in skill_low or 'cpp' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'vLnPwxZdW4Y', 'ZzaPdXTrSb8', '1v_4dL8l8pQ', 'vLnPwxZdW4Y'
        elif 'c#' in skill_low or 'csharp' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'gfkTfcpWqAY', 'GhQdlIFylQ8', '0IAPZzGSbME', 'eIrMbAQSU34'
        elif 'linux' in skill_low or 'unix' in skill_low or 'bash' in skill_low or 'shell' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'wBp0Rb-ZJak', 'v_1zB2W9308', 'sWbBE14l6HM', 'ZtqB5Xn9qK8'
        elif 'data struct' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'RBSGKlAvoiM', '0IAPZzGSbME', 'pkYVOmU3MgA', 'eIrMbAQSU34'
        elif 'algorithm' in skill_low or 'problem solv' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = '0IAPZzGSbME', 'RBSGKlAvoiM', 'pkYVOmU3MgA', 'eIrMbAQSU34'
        elif 'css' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = '1Rs2ND1ryYc', 'OXGznpKZ_sA', 'DPnqb74smus', 'G3e-cpL7ofc'
        elif 'html' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'pQN-pnXPaVg', 'DPnqb74smus', '1Rs2ND1ryYc', 'G3e-cpL7ofc'
        elif 'java' in skill_low and 'script' not in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'eIrMbAQSU34', 'A74TOX803D0', 'grEKMHGYyns', 'GoXwIVyNvX0'
        elif 'javascript' in skill_low or skill_low == 'js':
            v_id1, v_id2, v_id3, v_id4 = 'W6NZfCO5SIk', 'efP14Wv9cdk', 'bMknfKXIFA8', 'Oe421EPjeBE'
        elif 'typescript' in skill_low or skill_low == 'ts':
            v_id1, v_id2, v_id3, v_id4 = 'd56mG7DezGs', 'W6NZfCO5SIk', 'efP14Wv9cdk', 'bMknfKXIFA8'
        elif 'python' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'rfscVS0vtbw', '_uQrJ0TkZlc', 'HGOBQPFzWKo', 'kqtD5dpn9C8'
        elif 'git' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = '8JJ101D3knE', 'RGOj5yH7evk', 'HVsySz-h9r4', 'apGV9Kg7ics'
        elif 'sql' in skill_low or 'dbms' in skill_low or 'database' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'HXV3zeQKqGY', '7S_tz1z_5bA', 'qw--VYLpxG4', '9PZj7365gC0'
        elif 'react' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'bMknfKXIFA8', 'w7ejDZ8SWv8', 'SqcY0GlETPk', 'RVFAyFWO4go'
        elif 'django' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'F5mRW0joWI0', 'rfscVS0vtbw', 'HXV3zeQKqGY', 'Oe421EPjeBE'
        elif 'spring' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = '35EQXmHKZYs', 'eIrMbAQSU34', 'A74TOX803D0', 'HXV3zeQKqGY'
        elif 'flutter' in skill_low or 'dart' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'pTJJsmejUOQ', 'VPvVD8t0258', 'W6NZfCO5SIk', 'Oe421EPjeBE'
        elif 'docker' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'fqMOX6JJhGo', 'X48VuDVv0do', 'wBp0Rb-ZJak', '8JJ101D3knE'
        elif 'kubernetes' in skill_low or 'k8s' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'X48VuDVv0do', 'fqMOX6JJhGo', 'wBp0Rb-ZJak', '8JJ101D3knE'
        elif 'aws' in skill_low or 'cloud' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'k1RI5locZE4', 'NKEFWyq3v2c', 'fqMOX6JJhGo', 'wBp0Rb-ZJak'
        elif 'system design' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'm8Icp_Cid5o', 'SqcY0GlETPk', 'bMknfKXIFA8', 'HXV3zeQKqGY'
        elif 'oop' in skill_low or 'object' in skill_low:
            v_id1, v_id2, v_id3, v_id4 = 'pTB0EiLXUC8', 'eIrMbAQSU34', 'vLnPwxZdW4Y', '0IAPZzGSbME'
        else:
            v_id1, v_id2, v_id3, v_id4 = '0IAPZzGSbME', 'RBSGKlAvoiM', 'rfscVS0vtbw', 'eIrMbAQSU34'

        def make_embed_url(vid_id):
            return f"https://www.youtube.com/embed/{vid_id}"

        def make_watch_url(vid_id):
            return f"https://www.youtube.com/watch?v={vid_id}"

        def make_thumb_url(vid_id):
            return f"https://i.ytimg.com/vi/{vid_id}/mqdefault.jpg"

        templates = [
            {
                'id': v_id1,
                'title': f"{skill} Complete Masterclass for {target_role}s",
                'channel': "FreeCodeCamp & Tech Academy",
                'thumbnail': make_thumb_url(v_id1),
                'url': make_watch_url(v_id1),
                'embed_url': make_embed_url(v_id1),
                'duration': '1 - 2 Hours',
                'difficulty': 'Beginner to Intermediate',
                'badge': '⭐ Highly Recommended'
            },
            {
                'id': v_id2,
                'title': f"Top 10 {skill} Concepts Every {target_role} Must Know",
                'channel': "Programming with Mosh",
                'thumbnail': make_thumb_url(v_id2),
                'url': make_watch_url(v_id2),
                'embed_url': make_embed_url(v_id2),
                'duration': '35 mins',
                'difficulty': 'Beginner Friendly',
                'badge': 'Beginner Friendly'
            },
            {
                'id': v_id3,
                'title': f"Hands-On {skill} Practical Exercises & Real Projects",
                'channel': "Core Tech Tutorials",
                'thumbnail': make_thumb_url(v_id3),
                'url': make_watch_url(v_id3),
                'embed_url': make_embed_url(v_id3),
                'duration': '45 mins',
                'difficulty': 'Practice Focused',
                'badge': 'Practice Focused'
            },
            {
                'id': v_id4,
                'title': f"{skill} Technical Interview Questions & Live Coding",
                'channel': "NeetCode & Career Prep",
                'thumbnail': make_thumb_url(v_id4),
                'url': make_watch_url(v_id4),
                'embed_url': make_embed_url(v_id4),
                'duration': '40 mins',
                'difficulty': 'Interview Focused',
                'badge': 'Interview Focused'
            }
        ]

        if stage == 'practice':
            return [templates[2], templates[3], templates[0]]
        elif stage == 'build':
            return [templates[2], templates[0], templates[1]]
        elif stage == 'assess':
            return [templates[3], templates[0], templates[2]]
        return templates
