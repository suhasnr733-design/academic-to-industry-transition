# backend/app/services/job_providers/__init__.py

from app.services.job_providers.base_provider import BaseJobProvider
from app.services.job_providers.remotive_provider import RemotiveProvider
from app.services.job_providers.arbeitnow_provider import ArbeitnowProvider
from app.services.job_providers.jsearch_provider import JSearchProvider
from app.services.job_providers.adzuna_provider import AdzunaProvider
from app.services.job_providers.weworkremotely_provider import WeWorkRemotelyProvider
from app.services.job_providers.remoteok_provider import RemoteOKProvider
from app.services.job_providers.unstop_provider import UnstopProvider
from app.services.job_providers.internshala_provider import InternshalaProvider
from app.services.job_providers.naukri_provider import NaukriProvider

__all__ = [
    'BaseJobProvider',
    'RemotiveProvider',
    'ArbeitnowProvider',
    'JSearchProvider',
    'AdzunaProvider',
    'WeWorkRemotelyProvider',
    'RemoteOKProvider',
    'UnstopProvider',
    'InternshalaProvider',
    'NaukriProvider'
]
