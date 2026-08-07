# backend/app/services/api_composer.py

import asyncio
import aiohttp
from typing import Dict, Any, List
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class APIComposer:
    """API composition and aggregation service"""
    
    def __init__(self):
        self.services = {
            'user': 'http://user-service:5001',
            'resume': 'http://resume-service:5002',
            'job': 'http://job-service:5003',
            'ml': 'http://ml-service:8000',
            'notification': 'http://notification-service:5004'
        }
    
    async def fetch_service(self, session: aiohttp.ClientSession, 
                           service: str, endpoint: str, 
                           params: dict = None) -> Dict[str, Any]:
        """Fetch data from a service"""
        url = f"{self.services[service]}{endpoint}"
        
        try:
            async with session.get(url, params=params, timeout=10) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {'error': f"Service {service} returned {response.status}"}
        except Exception as e:
            logger.error(f"Error fetching from {service}: {e}")
            return {'error': str(e)}
    
    async def compose_user_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Compose user dashboard data from multiple services"""
        async with aiohttp.ClientSession() as session:
            # Fetch all data in parallel
            tasks = [
                self.fetch_service(session, 'user', f'/users/{user_id}'),
                self.fetch_service(session, 'resume', f'/resumes/user/{user_id}'),
                self.fetch_service(session, 'job', '/jobs/matches', {'user_id': user_id}),
                self.fetch_service(session, 'ml', f'/predict/user/{user_id}'),
                self.fetch_service(session, 'notification', f'/notifications/user/{user_id}')
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Compose dashboard
            dashboard = {
                'user': None,
                'resumes': [],
                'job_matches': [],
                'employability': {},
                'notifications': [],
                'timestamp': datetime.now().isoformat()
            }
            
            # Process results
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Error in service {i}: {result}")
                    continue
                
                if i == 0 and not result.get('error'):
                    dashboard['user'] = result
                elif i == 1 and not result.get('error'):
                    dashboard['resumes'] = result.get('resumes', [])
                elif i == 2 and not result.get('error'):
                    dashboard['job_matches'] = result.get('matches', [])
                elif i == 3 and not result.get('error'):
                    dashboard['employability'] = result
                elif i == 4 and not result.get('error'):
                    dashboard['notifications'] = result.get('notifications', [])
            
            return dashboard
    
    async def compose_analytics_dashboard(self) -> Dict[str, Any]:
        """Compose analytics dashboard"""
        async with aiohttp.ClientSession() as session:
            tasks = [
                self.fetch_service(session, 'user', '/users/stats'),
                self.fetch_service(session, 'resume', '/resumes/stats'),
                self.fetch_service(session, 'job', '/jobs/stats'),
                self.fetch_service(session, 'ml', '/model/metrics')
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            dashboard = {
                'user_stats': {},
                'resume_stats': {},
                'job_stats': {},
                'model_metrics': {},
                'timestamp': datetime.now().isoformat()
            }
            
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    continue
                if i == 0:
                    dashboard['user_stats'] = result
                elif i == 1:
                    dashboard['resume_stats'] = result
                elif i == 2:
                    dashboard['job_stats'] = result
                elif i == 3:
                    dashboard['model_metrics'] = result
            
            return dashboard
    
    def sync_compose(self, user_id: int) -> Dict[str, Any]:
        """Synchronous composition wrapper"""
        return asyncio.run(self.compose_user_dashboard(user_id))