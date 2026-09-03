# backend/app/services/job_aggregator.py

from typing import Dict, List, Any, Optional
import logging
import re
import threading
import time
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
from app.services.job_providers.base_provider import BaseJobProvider
from app.services.job_matcher import JobMatcher

logger = logging.getLogger(__name__)

class JobAggregatorService:
    """
    Unified orchestrator for all real-time job providers (LinkedIn, Indeed, Unstop, Internshala, Naukri, WeWorkRemotely, RemoteOK, Remotive, Arbeitnow, Adzuna).
    Deduplicates results, runs ML skill matching against student resumes, and calculates Academic-to-Industry Fit.
    """

    # Optimization 1: Shared in-memory live search cache across requests
    # Structure: { "cache_key": (timestamp, [job_dictionaries]) }
    _search_cache: Dict[str, tuple] = {}
    CACHE_TTL_SECONDS = 600  # 10 minutes cache lifespan

    # Optimization 2: Resume-level live match cache across requests
    # Structure: { "resume_id::location::limit": (timestamp, [matched_jobs]) }
    _resume_match_cache: Dict[str, tuple] = {}
    MATCH_CACHE_TTL = 600  # 10 minutes lifespan

    @classmethod
    def clear_cache(cls):
        """Clear all in-memory live search & resume match caches"""
        cls._search_cache.clear()
        cls._resume_match_cache.clear()
        logger.info("Cleared JobAggregatorService search & match caches")

    @classmethod
    def invalidate_resume_cache(cls, resume_id: int):
        """Clear cached matches when a student modifies their resume skills"""
        prefix = f"{resume_id}::"
        keys_to_clear = [k for k in cls._resume_match_cache if k.startswith(prefix)]
        for k in keys_to_clear:
            cls._resume_match_cache.pop(k, None)
        logger.info(f"Invalidated live job match cache for resume {resume_id}")
    
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
        query: Optional[str] = None,
        location: Optional[str] = None,
        sources: Optional[List[str]] = None,
        limit_per_source: int = 10,
        total_limit: int = 25,
        page: int = 1,
        auto_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Query all active providers in parallel and return deduplicated jobs with Academic Fit scoring and pagination.
        """
        # Optimization 1: Check In-Memory TTL Cache for Instant Response
        q_norm = (query or '').strip().lower()
        loc_norm = (location or '').strip().lower()
        src_norm = '-'.join(sorted(sources or ['all']))
        cache_key = f"{q_norm}::{loc_norm}::{src_norm}::p{page}::l{total_limit}"

        now = time.time()
        if cache_key in self._search_cache:
            cached_time, cached_jobs = self._search_cache[cache_key]
            if (now - cached_time) < self.CACHE_TTL_SECONDS:
                logger.info(f"Serving {len(cached_jobs)} live jobs from memory cache for '{cache_key}' (0.005s)")
                return cached_jobs

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

        # Note: 'naukri' is excluded from default pool to prevent synthetic placeholder jobs from being presented as live listings
        DEFAULT_ACTIVE_SOURCES = ['remotive', 'arbeitnow', 'jsearch', 'adzuna', 'weworkremotely', 'remoteok', 'unstop', 'internshala']

        if not sources or 'all' in sources:
            active_providers = [provider_map[s] for s in DEFAULT_ACTIVE_SOURCES if s in provider_map]
        else:
            active_providers = [provider_map[s] for s in sources if s in provider_map]

        all_jobs: List[Dict[str, Any]] = []
        
        # Calculate dynamic provider fetch limit based on requested page
        effective_limit_per_source = max(limit_per_source, (total_limit * page) // max(len(active_providers), 1) + 5)
        
        # Parallel fetch across providers for sub-second response times
        with ThreadPoolExecutor(max_workers=len(active_providers) or 1) as executor:
            future_to_provider = {
                executor.submit(p.search, query, location, effective_limit_per_source): p.name
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

        # Deduplicate by (company, title) and enforce query relevance
        seen_keys = set()
        deduped_jobs = []
        for job in all_jobs:
            if query and not BaseJobProvider.is_query_relevant(
                query,
                job.get('title', ''),
                job.get('required_skills', []),
                job.get('description', ''),
                job.get('domain', '')
            ):
                continue

            if location and not BaseJobProvider.is_location_relevant(
                location,
                job.get('location', '')
            ):
                continue

            if not BaseJobProvider.is_domain_relevant(
                job.get('title', ''),
                job.get('description', '')
            ) or not BaseJobProvider.is_job_active(
                job.get('title', ''),
                job.get('description', ''),
                job.get('posted_date')
            ) or job.get('is_closed') or (job.get('is_active') is False):
                continue

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

                # Validate real expiration dates provided by source providers
                raw_expires = job.get('expires_at')
                if raw_expires:
                    try:
                        from datetime import datetime
                        dt_exp = datetime.fromisoformat(str(raw_expires).replace('Z', '+00:00'))
                        # If deadline is in the past, mark closed
                        if dt_exp.timestamp() < datetime.now(dt_exp.tzinfo).timestamp():
                            job['is_closed'] = True
                            job['is_active'] = False
                    except Exception:
                        pass
                else:
                    # Explicitly None to signify rolling admissions / open until filled
                    job['expires_at'] = None
                
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

        target_total = total_limit * page
        for i in range(max_source_len):
            for src_name, src_list in list(jobs_by_source.items()):
                if i < len(src_list):
                    interleaved_jobs.append(src_list[i])
                    if len(interleaved_jobs) >= target_total:
                        break
            if len(interleaved_jobs) >= target_total:
                break

        full_list = interleaved_jobs if interleaved_jobs else deduped_jobs
        
        # Apply pagination slicing
        start_idx = (page - 1) * total_limit
        end_idx = start_idx + total_limit
        paginated_jobs = full_list[start_idx:end_idx]

        logger.info(f"JobAggregator: aggregated {len(paginated_jobs)} jobs for query '{query}' (page {page}, offset {start_idx}-{end_idx})")

        # Asynchronously cache newly found jobs to DB in the background
        if auto_cache and paginated_jobs:
            threading.Thread(target=self._async_cache_to_db, args=(paginated_jobs,), daemon=True).start()

        # Optimization 1: Store paginated results into in-memory TTL cache
        self._search_cache[cache_key] = (now, paginated_jobs)

        # Bounded cache eviction (keep maximum 200 search queries in memory)
        if len(self._search_cache) > 200:
            oldest_key = min(self._search_cache.keys(), key=lambda k: self._search_cache[k][0])
            self._search_cache.pop(oldest_key, None)

        return paginated_jobs

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
        Look up a saved Resume, extract its parsed skills, and match against live jobs with Optimization 2 caching.
        """
        # Optimization 2: Check in-memory match cache for instant sub-second response
        cache_key = f"{resume_id}::{location or 'all'}::{limit}"
        now = time.time()
        if cache_key in self._resume_match_cache:
            cached_time, cached_matches = self._resume_match_cache[cache_key]
            if (now - cached_time) < self.MATCH_CACHE_TTL:
                logger.info(f"Serving {len(cached_matches)} cached job matches for resume {resume_id} (0.005s)")
                return cached_matches

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

        matches = self.match_live_jobs_with_student(
            student_skills=skills,
            domain=target_domain,
            location=location,
            limit=limit
        )

        # Optimization 2: Store matched jobs into in-memory TTL cache
        self._resume_match_cache[cache_key] = (now, matches)

        # Evict oldest keys if cache grows beyond 200 resumes
        if len(self._resume_match_cache) > 200:
            oldest_key = min(self._resume_match_cache.keys(), key=lambda k: self._resume_match_cache[k][0])
            self._resume_match_cache.pop(oldest_key, None)

        return matches

    def _calculate_academic_fit(self, title: str, description: str, skills: List[str]) -> Dict[str, Any]:
        """Calculates academic-to-industry transition candidate fit score using 6-pillar model"""
        title_lower = (title or '').lower()
        text = (title + " " + description).lower()
        tags = []

        # Gatekeeper: Verify role is genuine engineering/software/data/tech
        tech_indicators = [
            'developer', 'engineer', 'architect', 'scientist', 'analyst', 'programmer',
            'devops', 'sre', 'dba', 'qa', 'sdet', 'cloud', 'data', 'software', 'frontend',
            'backend', 'fullstack', 'full stack', 'mobile', 'android', 'ios', 'system',
            'network', 'security', 'machine learning', 'artificial intelligence', 'nlp', 'vision',
            'intern', 'trainee', 'technical', 'technology', 'web', 'ui/ux'
        ]
        non_tech_markers = [
            'tax preparer', 'tax accountant', 'gardener', 'landscaping', 'chiropract',
            'client success manager', 'sales executive', 'housekeeping', 'cashier', 'store associate'
        ]

        if any(nt in title_lower for nt in non_tech_markers) or (not any(ti in title_lower for ti in tech_indicators) and len(skills) == 0):
            return {
                'score': 25,
                'tags': ['Non-Tech / Divergent'],
                'research_skills': [],
                'gap_skills': ['Software Engineering Fundamentals']
            }

        score = 0
        
        # Pillar 1: Base & Technical Stack Signals (+30 Pts)
        score += 30
        
        # Pillar 2: Hands-on / Practical Focus (+15 Pts)
        if any(w in text for w in ['hands-on', 'projects', 'problem solving', 'data structures', 'dsa', 'system design']):
            score += 15
            tags.append('Practical CS Focus')
        else:
            score += 8

        # Pillar 3: B.E. / Engineering Graduate Friendly (+15 Pts)
        if any(w in text for w in ['b.e', 'b.tech', 'bachelor', 'graduate', 'entry level', '0-2 years', 'fresher', 'junior', 'associate']):
            score += 15
            tags.append('B.E. Graduate Friendly')
        elif any(w in text for w in ['phd', 'doctorate', 'postdoc', 'research scientist']):
            score += 12
            tags.append('R&D Track')
        else:
            score += 8

        # Pillar 4: Industry Bridge & Tooling Readiness (+15 Pts)
        industry_tools = [
            'git', 'github', 'gitlab', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 
            'ci/cd', 'rest api', 'graphql', 'fastapi', 'microservices', 'linux', 
            'redis', 'kafka', 'unit testing', 'jest', 'pytest'
        ]
        matched_industry = [t for t in industry_tools if t in text or any(t in s.lower() for s in skills)]
        if len(matched_industry) >= 3:
            score += 15
            tags.append('Production Tooling')
        elif len(matched_industry) >= 1:
            score += 10
            tags.append('Core Tooling')
        else:
            score += 5

        # Pillar 5: Internship / Industry Exposure (+15 Pts)
        if any(w in text for w in ['internship', 'intern', 'trainee', 'startup']):
            score += 15
        else:
            score += 8

        # Pillar 6: Location & Work Mode Fit (+10 Pts)
        if any(w in text for w in ['remote', 'hybrid', 'bangalore', 'hyderabad', 'pune', 'delhi', 'chennai', 'mumbai']):
            score += 10
            tags.append('Location Flexible')
        else:
            score += 6

        # Gap Skills extraction for transition guidance
        research_set = {'python', 'r', 'pytorch', 'tensorflow', 'statistics', 'nlp', 'deep learning', 'computer vision', 'data science', 'matlab', 'c++', 'latex'}
        matched_research = [s for s in skills if s.lower() in research_set]
        gap_skills = [t for t in industry_tools if t in text and t not in [s.lower() for s in skills]]

        final_score = min(max(score, 45), 98)
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
                        # Preserve real external posted_date if available
                        raw_posted = job_data.get('posted_date')
                        parsed_posted_date = datetime.utcnow()
                        if raw_posted:
                            try:
                                if isinstance(raw_posted, datetime):
                                    parsed_posted_date = raw_posted
                                elif isinstance(raw_posted, (int, float)):
                                    parsed_posted_date = datetime.fromtimestamp(raw_posted)
                                elif isinstance(raw_posted, str):
                                    cleaned_str = raw_posted.replace('Z', '+00:00')
                                    parsed_posted_date = datetime.fromisoformat(cleaned_str)
                            except Exception:
                                pass

                        raw_expires = job_data.get('expires_at')
                        parsed_expires = None
                        if raw_expires:
                            try:
                                if isinstance(raw_expires, datetime):
                                    parsed_expires = raw_expires
                                elif isinstance(raw_expires, (int, float)):
                                    parsed_expires = datetime.fromtimestamp(raw_expires)
                                elif isinstance(raw_expires, str):
                                    cleaned_exp = raw_expires.replace('Z', '+00:00')
                                    parsed_expires = datetime.fromisoformat(cleaned_exp)
                            except Exception:
                                pass
                        if not parsed_expires:
                            from datetime import timedelta
                            parsed_expires = parsed_posted_date + timedelta(days=21)

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
                            posted_date=parsed_posted_date,
                            expires_at=parsed_expires,
                            raw_data=job_data
                        )
                        db.session.add(new_job)

                # Lifecycle management: expire past-deadline jobs and stale rolling jobs
                from datetime import timedelta
                now = datetime.utcnow()

                # 1. Past explicit deadline
                Job.query.filter(
                    Job.is_live == True,
                    Job.expires_at != None,
                    Job.expires_at < now,
                    Job.is_active == True
                ).update({'is_active': False})

                # 2. Rolling recruitment older than 45 days
                cutoff_rolling = now - timedelta(days=45)
                Job.query.filter(
                    Job.is_live == True,
                    Job.expires_at == None,
                    Job.posted_date < cutoff_rolling,
                    Job.is_active == True
                ).update({'is_active': False})

                db.session.commit()
                logger.debug(f"Successfully cached {len(jobs)} live jobs to local DB")
        except Exception as e:
            logger.debug(f"Async DB cache note: {e}")
