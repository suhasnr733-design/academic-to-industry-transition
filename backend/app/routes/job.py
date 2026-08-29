# backend/app/routes/job.py
"""
DEPRECATION NOTICE:
-------------------
This file (backend/app/routes/job.py) is a legacy route module from v0 and is NOT registered
in backend/app/__init__.py.

The canonical, production-active REST Blueprint for jobs is located at:
  -> backend/app/api/v1/jobs/routes.py
  -> Mounted at URL prefix: /api/v1/jobs

To ensure backward compatibility for any script or test importing `job_bp`, this module
aliases `job_bp` to `jobs_bp` from `app.api.v1.jobs.routes` and issues a DeprecationWarning.
"""

import warnings
from app.api.v1.jobs.routes import jobs_bp as canonical_jobs_bp

warnings.warn(
    "backend.app.routes.job is deprecated and unmounted. "
    "Please import or register backend.app.api.v1.jobs.routes.jobs_bp instead.",
    DeprecationWarning,
    stacklevel=2
)

# Alias for backward compatibility
job_bp = canonical_jobs_bp