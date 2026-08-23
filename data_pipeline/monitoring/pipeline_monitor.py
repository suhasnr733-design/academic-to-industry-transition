# data_pipeline/monitoring/pipeline_monitor.py

from collections import deque
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Optional

try:
    from data_pipeline.loaders.database_loader import DatabaseLoader
except ImportError:
    DatabaseLoader = None

logger = logging.getLogger(__name__)


class PipelineMonitor:
    """Monitor pipeline executions, track metrics, and calculate performance trends."""

    def __init__(self, db_loader: Optional[Any] = None):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.execution_history = deque(maxlen=1000)
        self.db_loader = db_loader or (DatabaseLoader() if DatabaseLoader else None)

    def log_execution(
        self,
        pipeline_name: str,
        duration: float,
        status: str,
        records_processed: int = 0
    ) -> Dict[str, Any]:
        """
        Record a pipeline execution event.

        Args:
            pipeline_name (str): Name of the pipeline/job.
            duration (float): Duration in seconds.
            status (str): Execution status ('success', 'failed', 'partial_success', etc.).
            records_processed (int): Number of records processed.

        Returns:
            dict: The recorded execution entry.
        """
        try:
            record = {
                "timestamp": datetime.now().isoformat(),
                "pipeline_name": pipeline_name,
                "duration_seconds": float(duration),
                "status": str(status),
                "records_processed": int(records_processed)
            }
            self.execution_history.append(record)
            self.logger.info(
                f"Logged execution for '{pipeline_name}': status={status}, "
                f"duration={duration:.2f}s, records={records_processed}"
            )
            return record
        except Exception as e:
            self.logger.error(f"Error logging execution for '{pipeline_name}': {e}")
            fallback = {
                "timestamp": datetime.now().isoformat(),
                "pipeline_name": pipeline_name,
                "duration_seconds": float(duration) if isinstance(duration, (int, float)) else 0.0,
                "status": str(status),
                "records_processed": int(records_processed) if isinstance(records_processed, int) else 0
            }
            self.execution_history.append(fallback)
            return fallback

    def get_metrics(self, hours: int = 24) -> Dict[str, Any]:
        """
        Calculate metrics for pipeline executions within the specified past hours.

        Args:
            hours (int): Timeframe window in hours.

        Returns:
            dict: Aggregated execution metrics.
        """
        now = datetime.now()
        cutoff = now - timedelta(hours=hours)

        relevant_records = []
        for item in self.execution_history:
            try:
                ts = datetime.fromisoformat(item["timestamp"])
                if ts >= cutoff:
                    relevant_records.append(item)
            except (KeyError, ValueError, TypeError):
                continue

        total = len(relevant_records)
        if total == 0:
            return {
                "total_executions": 0,
                "successful": 0,
                "failed": 0,
                "success_rate": 0.0,
                "avg_duration_seconds": 0.0,
                "max_duration_seconds": 0.0,
                "min_duration_seconds": 0.0,
                "period_hours": hours,
                "timestamp": now.isoformat()
            }

        successful = sum(1 for r in relevant_records if r.get("status") in ("success", "partial_success"))
        failed = sum(1 for r in relevant_records if r.get("status") == "failed")
        durations = [r["duration_seconds"] for r in relevant_records if "duration_seconds" in r]

        avg_dur = float(sum(durations) / len(durations)) if durations else 0.0
        max_dur = float(max(durations)) if durations else 0.0
        min_dur = float(min(durations)) if durations else 0.0
        success_rate = float((successful / total) * 100.0)

        return {
            "total_executions": total,
            "successful": successful,
            "failed": failed,
            "success_rate": round(success_rate, 2),
            "avg_duration_seconds": round(avg_dur, 2),
            "max_duration_seconds": round(max_dur, 2),
            "min_duration_seconds": round(min_dur, 2),
            "period_hours": hours,
            "timestamp": now.isoformat()
        }

    def get_daily_trend(self, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get daily summary trends for the past N days.

        Args:
            days (int): Number of days to include.

        Returns:
            list[dict]: Daily summary dicts with date, total, success, success_rate.
        """
        now = datetime.now().date()
        date_list = [now - timedelta(days=i) for i in range(days - 1, -1, -1)]
        trends_by_date = {d.strftime("%Y-%m-%d"): {"total": 0, "success": 0} for d in date_list}

        for item in self.execution_history:
            try:
                ts = datetime.fromisoformat(item["timestamp"]).date()
                date_str = ts.strftime("%Y-%m-%d")
                if date_str in trends_by_date:
                    trends_by_date[date_str]["total"] += 1
                    if item.get("status") in ("success", "partial_success"):
                        trends_by_date[date_str]["success"] += 1
            except (KeyError, ValueError, TypeError):
                continue

        result = []
        for date_str in sorted(trends_by_date.keys()):
            tot = trends_by_date[date_str]["total"]
            succ = trends_by_date[date_str]["success"]
            rate = float((succ / tot) * 100.0) if tot > 0 else 0.0
            result.append({
                "date": date_str,
                "total": tot,
                "success": succ,
                "success_rate": round(rate, 2)
            })

        return result


pipeline_monitor = PipelineMonitor()
