# data_pipeline/production/health_checks.py

from datetime import datetime
import logging
import os
from typing import Dict, Any, Optional
from sqlalchemy import text

try:
    from data_pipeline.loaders.database_loader import DatabaseLoader
except ImportError:
    DatabaseLoader = None

try:
    import psutil
except ImportError:
    psutil = None

try:
    import redis
except ImportError:
    redis = None

logger = logging.getLogger(__name__)


class PipelineHealthCheck:
    """Production health check utility for database, Redis, system resources, and full status reports."""

    def __init__(self, db_loader: Optional[Any] = None):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.db_loader = db_loader or (DatabaseLoader() if DatabaseLoader else None)

    def check_database(self) -> Dict[str, Any]:
        """
        Verify database connectivity using project's DatabaseLoader.

        Returns:
            dict: Database health status.
        """
        if not self.db_loader or not getattr(self.db_loader, "engine", None):
            return {
                "status": "unhealthy",
                "message": "Database engine is not connected or initialized."
            }

        try:
            with self.db_loader.engine.connect() as conn:
                # Use SELECT 1 or SQLite equivalent query
                conn.execute(text("SELECT 1;"))
            return {
                "status": "healthy",
                "message": "Database connection verified successfully."
            }
        except Exception as e:
            self.logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "message": f"Database connectivity error: {e}"
            }

    def check_redis(self) -> Dict[str, Any]:
        """
        Check Redis status if configured in the environment.

        Returns:
            dict: Redis health status.
        """
        redis_url = os.environ.get("REDIS_URL")
        if not redis_url:
            return {
                "status": "warning",
                "message": "Redis is not configured in environment variables."
            }

        if not redis:
            return {
                "status": "warning",
                "message": "redis-python library is not installed."
            }

        try:
            client = redis.from_url(redis_url, socket_timeout=2.0)
            if client.ping():
                return {
                    "status": "healthy",
                    "message": "Redis server ping successful."
                }
            return {
                "status": "unhealthy",
                "message": "Redis server ping returned False."
            }
        except Exception as e:
            self.logger.warning(f"Redis health check ping failed: {e}")
            return {
                "status": "warning",
                "message": f"Redis connectivity check warning: {e}"
            }

    def check_system_resources(self) -> Dict[str, Any]:
        """
        Check CPU, Memory, and Disk usage statistics via psutil.

        Returns:
            dict: System resource metrics.
        """
        now_iso = datetime.now().isoformat()
        if not psutil:
            return {
                "cpu_percent": 0.0,
                "memory_percent": 0.0,
                "disk_percent": 0.0,
                "note": "psutil is not installed",
                "timestamp": now_iso
            }

        try:
            cpu_pct = float(psutil.cpu_percent(interval=None))
            mem_pct = float(psutil.virtual_memory().percent)
            
            # Disk usage for current working directory drive
            cwd = os.getcwd()
            disk_pct = float(psutil.disk_usage(cwd).percent)

            return {
                "cpu_percent": round(cpu_pct, 2),
                "memory_percent": round(mem_pct, 2),
                "disk_percent": round(disk_pct, 2),
                "timestamp": now_iso
            }
        except Exception as e:
            self.logger.error(f"Error fetching system resource stats: {e}")
            return {
                "cpu_percent": 0.0,
                "memory_percent": 0.0,
                "disk_percent": 0.0,
                "error": str(e),
                "timestamp": now_iso
            }

    def get_full_health_report(self) -> Dict[str, Any]:
        """
        Consolidate database, Redis, and resource stats into a full health report.

        Returns:
            dict: Complete health report.
        """
        now_iso = datetime.now().isoformat()
        db_health = self.check_database()
        redis_health = self.check_redis()
        resources_health = self.check_system_resources()

        # Aggregate overall status
        if db_health["status"] == "unhealthy":
            overall = "unhealthy"
        elif redis_health["status"] == "unhealthy":
            overall = "unhealthy"
        elif db_health["status"] == "warning" or redis_health["status"] == "warning":
            overall = "warning"
        else:
            overall = "healthy"

        return {
            "status": overall,
            "timestamp": now_iso,
            "database": db_health,
            "redis": redis_health,
            "resources": resources_health
        }


health_check = PipelineHealthCheck()
