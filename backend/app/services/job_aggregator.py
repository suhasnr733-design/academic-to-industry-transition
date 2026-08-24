# backend/app/services/job_aggregator.py

from typing import Dict, List, Any, Optional
import logging
import re
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.config import Config
from app.services.job_providers import (
    RemotiveProvider,
    ArbeitnowProvider,
    JSearchProvider,
    AdzunaProvider,
    WeWorkRemotelyProvider,
    RemoteOKProvider,
    UnstopProvider,
    InternshalaProvider,
    NaukriProvider
)
from app.services.job_matcher import JobMatcher

logger = logging.getLogger(__name__)

class JobAggregatorService:
    """
    Unified orchestrator for all real-time job providers (LinkedIn, Indeed, Unstop, Internshala, Naukri, WeWorkRemotely, RemoteOK, Remotive, Arbeitnow, Adzuna).
    Deduplicates results, runs ML skill matching against student resumes, and calculates Academic-to-Industry Fit.
    """
    
    def __init__(self):
        self.remotive = RemotiveProvider(base_url=getattr(Config, 'REMOTIVE_API_BASE_URL', None))
        self.arbeitnow = ArbeitnowProvider(base_url=getattr(Config, 'ARBEITNOW_API_BASE_URL', None))
        self.jsearch = JSearchProvider(api_key=getattr(Config, 'RAPIDAPI_KEY', None))
        self.adzuna = AdzunaProvider(
            app_id=getattr(Config, 'ADZUNA_APP_ID', None),
            app_key=getattr(Config, 'ADZUNA_APP_KEY', None)
        )
        self.weworkremotely = WeWorkRemotelyProvider()
        self.remoteok = RemoteOKProvider()
        self.unstop = UnstopProvider()
        self.internshala = InternshalaProvider()
        self.naukri = NaukriProvider()
        self.matcher = JobMatcher()

    def search_all_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        sources: Optional[List[str]] = None,
        limit_per_source: int = 10,
        total_limit: int = 35,
        auto_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Query all active providers in parallel and return deduplicated jobs with Academic Fit scoring.
        """
        provider_map = {
            'remotive': self.remotive,
            'arbeitnow': self.arbeitnow,
            'jsearch': self.jsearch,
            'adzuna': self.adzuna,
            'weworkremotely': self.weworkremotely,
            'remoteok': self.remoteok,
            'unstop': self.unstop,
            'internshala': self.internshala,
            'naukri': self.naukri
        }

        if not sources or 'all' in sources:
            active_providers = list(provider_map.values())
        else:
            active_providers = [provider_map[s] for s in sources if s in provider_map]

        all_jobs: List[Dict[str, Any]] = []
        
        # Parallel fetch across providers for sub-second response times
        with ThreadPoolExecutor(max_workers=len(active_providers) or 1) as executor:
            future_to_provider = {
                executor.submit(p.search, query, location, limit_per_source): p.name
                for p in active_providers
            }
            for future in as_completed(future_to_provider):
                p_name = future_to_provider[future]
                try:
                    results = future.result()
                    all_jobs.extend(results)
                    logger.debug(f"Provider {p_name} returned {len(results)} jobs")
                except Exception as exc:
                    logger.warning(f"Provider {p_name} raised exception: {exc}")

        # Deduplicate by (company, title)
        seen_keys = set()
        deduped_jobs = []
        for job in all_jobs:
            c_norm = (job.get('company') or '').strip().lower()
            t_norm = (job.get('title') or '').strip().lower()
            dedup_key = f"{c_norm}::{t_norm}"
            
            if dedup_key not in seen_keys:
                seen_keys.add(dedup_key)
                
                # Enrich with Academic Fit Score & Tagging
                fit_info = self._calculate_academic_fit(
                    job.get('title', ''),
                    job.get('description', ''),
                    job.get('required_skills', [])
                )
                job['academic_fit_score'] = fit_info['score']
                job['academic_tags'] = fit_info['tags']
                job['research_skills'] = fit_info['research_skills']
                job['industry_gap_skills'] = fit_info['gap_skills']
                
                deduped_jobs.append(job)

        # Sort jobs within each source by academic fit score
        deduped_jobs.sort(key=lambda x: x.get('academic_fit_score', 0), reverse=True)

        # Group jobs by source platform for Round-Robin Fair Distribution
        from collections import defaultdict
        jobs_by_source = defaultdict(list)
        for job in deduped_jobs:
            src = job.get('source', 'other')
            jobs_by_source[src].append(job)

        # Interleave 1 job from each provider in round-robin fashion
        interleaved_jobs = []
        max_source_len = max(len(v) for v in jobs_by_source.values()) if jobs_by_source else 0

        for i in range(max_source_len):
            for src_name, src_list in list(jobs_by_source.items()):
                if i < len(src_list):
                    interleaved_jobs.append(src_list[i])
                    if len(interleaved_jobs) >= total_limit:
                        break
            if len(interleaved_jobs) >= total_limit:
                break

        final_jobs = interleaved_jobs if interleaved_jobs else deduped_jobs[:total_limit]

        logger.info(f"JobAggregator: aggregated {len(final_jobs)} unique live jobs for query '{query}' across {list(jobs_by_source.keys())}")

        # Asynchronously cache newly found jobs to DB in the background
        if auto_cache and final_jobs:
            threading.Thread(target=self._async_cache_to_db, args=(final_jobs,), daemon=True).start()

        return final_jobs

    def match_live_jobs_with_student(
        self,
        student_skills: List[str],
        query: Optional[str] = None,
        domain: Optional[str] = None,
        location: Optional[str] = None,
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Fetch real-time jobs matching student skills/query and calculate
        ML skill match % and gap analysis in real time.
        """
        search_query = query
        if not search_query:
            if domain:
                search_query = domain
            elif student_skills:
                search_query = ' '.join(student_skills[:3])
            else:
                search_query = 'Software Engineer'

        raw_live_jobs = self.search_all_jobs(
            query=search_query,
            location=location or getattr(Config, 'DEFAULT_JOB_LOCATION', 'India'),
            limit_per_source=8,
            total_limit=35,
            auto_cache=True
        )

        student_data = {
            'skills': student_skills or []
        }

        # Run NLP skill matching
        matches = self.matcher.match_jobs(student_data, raw_live_jobs)
        
        # Flatten response structure for easy frontend rendering
        formatted_matches = []
        for m in matches:
            details = m.get('job_details', {})
            formatted_matches.append({
                'id': details.get('id'),
                'external_id': details.get('external_id'),
                'title': details.get('title'),
                'company': details.get('company'),
                'location': details.get('location'),
                'job_type': details.get('job_type'),
                'salary_range': details.get('salary_range'),
                'description': details.get('description'),
                'apply_url': details.get('apply_url'),
                'source': details.get('source'),
                'is_live': True,
                'match_score': m.get('combined_score', 0),
                'skill_match': m.get('skill_match', 0),
                'academic_fit_score': details.get('academic_fit_score', 65),
                'academic_tags': details.get('academic_tags', []),
                'matching_skills': m.get('matching_skills', []),
                'missing_skills': m.get('missing_skills', []),
                'required_skills': details.get('required_skills', []),
                'posted_date': details.get('posted_date')
            })

        return formatted_matches[:limit]

    def match_live_jobs_for_resume(
        self,
        resume_id: int,
        location: Optional[str] = None,
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Look up a saved Resume, extract its parsed skills, and match against live jobs.
        """
        from app.models.resume import Resume
        from app import db
        
        resume = db.session.get(Resume, resume_id)
        if not resume:
            logger.warning(f"Resume with id {resume_id} not found")
            return []

        skills = []
        if hasattr(resume, 'skills') and resume.skills:
            if isinstance(resume.skills, list):
                skills = resume.skills
            elif isinstance(resume.skills, dict):
                skills = resume.skills.get('hard_skills', []) + resume.skills.get('soft_skills', [])

        target_domain = getattr(resume, 'target_role', None) or getattr(resume, 'domain', None)

        return self.match_live_jobs_with_student(
            student_skills=skills,
            domain=target_domain,
            location=location,
            limit=limit
        )

    def _calculate_academic_fit(self, title: str, description: str, skills: List[str]) -> Dict[str, Any]:
        """Calculates academic-to-industry transition relevance, tags, and gap skills"""
        score = 55
        tags = []
        text = (title + " " + description).lower()
        
        if any(w in text for w in ['phd', 'doctorate', 'postdoc', 'post-doc']):
            score += 25
            tags.append('PhD Preferred')
        if any(w in text for w in ['research scientist', 'research engineer', 'applied scientist', 'r&d']):
            score += 20
            tags.append('R&D / Research')
        if any(w in text for w in ['publication', 'publications', 'patents', 'peer-reviewed']):
            score += 15
            tags.append('Publication Track Record')
        if any(w in text for w in ['statistical modeling', 'deep learning', 'quantitative', 'machine learning']):
            score += 10
            tags.append('Quantitative Methods')

        research_set = {'python', 'r', 'pytorch', 'tensorflow', 'statistics', 'nlp', 'deep learning', 'computer vision', 'data science', 'matlab', 'c++', 'latex'}
        matched_research = [s for s in skills if s.lower() in research_set]

        industry_bridge_set = {'docker', 'kubernetes', 'aws', 'gcp', 'ci/cd', 'microservices', 'git', 'fastapi', 'terraform', 'kafka'}
        gap_skills = [s for s in industry_bridge_set if s in text and s not in [r.lower() for r in matched_research]]

        final_score = min(max(score, 40), 98)
        if not tags:
            tags.append('Industry Direct')

        return {
            'score': final_score,
            'tags': tags[:3],
            'research_skills': matched_research,
            'gap_skills': gap_skills[:4]
        }

    def _async_cache_to_db(self, jobs: List[Dict[str, Any]]) -> None:
        """Background worker to upsert live jobs to local database without blocking search response"""
        try:
            from app import create_app, db
            from app.models.job import Job
            from datetime import datetime

            app = create_app()
            with app.app_context():
                for job_data in jobs:
                    title = job_data.get('title')
                    company = job_data.get('company')
                    ext_id = job_data.get('external_id')
                    
                    if not title or not company:
                        continue

                    # Check if already exists by external_id or title+company
                    existing = None
                    if ext_id:
                        existing = Job.query.filter_by(external_id=str(ext_id)).first()
                    if not existing:
                        existing = Job.query.filter_by(title=title, company=company).first()

                    if not existing:
                        new_job = Job(
                            title=title,
                            company=company,
                            description=job_data.get('description', ''),
                            required_skills=job_data.get('required_skills', []),
                            location=job_data.get('location', 'Remote'),
                            job_type=job_data.get('job_type', 'Full-time'),
                            domain=job_data.get('domain', 'Tech'),
                            salary_range=job_data.get('salary_range'),
                            source=job_data.get('source', 'live_web'),
                            external_id=str(ext_id) if ext_id else None,
                            apply_url=job_data.get('apply_url'),
                            is_live=True,
                            is_active=True,
                            posted_date=datetime.utcnow(),
                            raw_data=job_data
                        )
                        db.session.add(new_job)

                db.session.commit()
                logger.debug(f"Successfully cached {len(jobs)} live jobs to local DB")
        except Exception as e:
            logger.debug(f"Async DB cache note: {e}")
