# backend/app/tasks/job_sync_task.py

import logging
from datetime import datetime
from typing import Dict, List, Any

from app import db
from app.models.job import Job
from app.services.job_aggregator import JobAggregatorService

logger = logging.getLogger(__name__)

def sync_live_jobs_to_db(queries: List[str] = None, limit_per_query: int = 10) -> Dict[str, Any]:
    """
    Background sync task (Option C):
    Fetches fresh live job listings from external providers and upserts them
    into the database so local queries stay up-to-date with real market postings.
    """
    if not queries:
        queries = [
            'Software Engineer',
            'Python Developer',
            'Frontend Developer',
            'Data Scientist',
            'DevOps Engineer'
        ]

    aggregator = JobAggregatorService()
    total_found = 0
    total_inserted = 0
    total_updated = 0

    for query in queries:
        try:
            logger.info(f"JobSyncTask: fetching live jobs for query '{query}'")
            live_jobs = aggregator.search_all_jobs(query=query, limit_per_source=limit_per_query, total_limit=30)
            total_found += len(live_jobs)

            for item in live_jobs:
                ext_id = item.get('external_id')
                source = item.get('source', 'internal')
                
                # Check for existing job by external_id or title+company
                existing = None
                if ext_id:
                    existing = Job.query.filter_by(source=source, external_id=str(ext_id)).first()
                if not existing:
                    existing = Job.query.filter_by(
                        title=item.get('title'),
                        company=item.get('company')
                    ).first()

                if existing:
                    # Update status and freshness
                    existing.is_live = True
                    existing.is_active = True
                    if item.get('apply_url'):
                        existing.apply_url = item.get('apply_url')
                    if item.get('salary_range'):
                        existing.salary_range = item.get('salary_range')
                    total_updated += 1
                else:
                    # Insert new record
                    new_job = Job(
                        title=item.get('title', 'Software Engineer'),
                        company=item.get('company', 'Tech Company'),
                        description=item.get('description', ''),
                        required_skills=item.get('required_skills', []),
                        experience_required=item.get('experience_required', 0),
                        location=item.get('location', 'Remote'),
                        salary_range=item.get('salary_range'),
                        salary_min=item.get('salary_min'),
                        salary_max=item.get('salary_max'),
                        currency=item.get('currency', 'USD'),
                        job_type=item.get('job_type', 'Full-time'),
                        domain=item.get('domain', 'Software Engineering'),
                        source=source,
                        external_id=str(ext_id) if ext_id else None,
                        apply_url=item.get('apply_url'),
                        is_live=True,
                        is_active=True,
                        posted_date=datetime.utcnow(),
                        raw_data=item.get('raw_data')
                    )
                    db.session.add(new_job)
                    total_inserted += 1

            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"JobSyncTask error processing query '{query}': {e}")

    summary = {
        'status': 'completed',
        'queries_processed': len(queries),
        'total_found': total_found,
        'total_inserted': total_inserted,
        'total_updated': total_updated,
        'timestamp': datetime.utcnow().isoformat()
    }
    logger.info(f"JobSyncTask completed: {summary}")
    return summary
