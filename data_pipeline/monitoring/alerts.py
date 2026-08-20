# data_pipeline/monitoring/alerts.py

from collections import deque
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class PipelineAlerts:
    """Alerting engine for monitoring data pipeline metrics and threshold violations."""

    DEFAULT_THRESHOLDS = {
        "success_rate": 95.0,        # Minimum expected success rate (%)
        "max_duration": 300.0,       # Maximum allowed execution duration (seconds)
        "quality_score": 70.0,       # Minimum expected data quality score (%)
        "data_freshness": 24.0,      # Maximum allowed data age (hours)
    }

    def __init__(self, thresholds: Optional[Dict[str, float]] = None):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.thresholds = {**self.DEFAULT_THRESHOLDS, **(thresholds or {})}
        self.alerts = deque(maxlen=1000)

    def trigger_alert(self, message: str, severity: str = "WARNING") -> Dict[str, Any]:
        """
        Trigger and store a pipeline alert event.

        Args:
            message (str): Alert description.
            severity (str): Alert severity level ('INFO', 'WARNING', 'CRITICAL', 'ERROR').

        Returns:
            dict: The created alert record.
        """
        alert = {
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "severity": severity.upper()
        }
        self.alerts.append(alert)
        self.logger.warning(f"PIPELINE ALERT [{alert['severity']}]: {alert['message']}")
        return alert

    def check_and_alert(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Evaluate execution or quality metrics against defined thresholds and generate alerts.

        Args:
            metrics (dict): Metrics dictionary containing execution or quality indicators.

        Returns:
            list[dict]: Newly generated alerts during this evaluation.
        """
        new_alerts = []

        if not metrics or not isinstance(metrics, dict):
            return new_alerts

        # 1. Check success rate
        if "success_rate" in metrics and metrics.get("total_executions", 1) > 0:
            success_rate = float(metrics["success_rate"])
            target_sr = self.thresholds["success_rate"]
            if success_rate < target_sr:
                alert = self.trigger_alert(
                    f"Success rate drop detected: {success_rate:.2f}% (Threshold: {target_sr:.2f}%)",
                    severity="CRITICAL" if success_rate < (target_sr - 20) else "WARNING"
                )
                new_alerts.append(alert)

        # 2. Check max duration
        if "max_duration_seconds" in metrics:
            duration = float(metrics["max_duration_seconds"])
            target_dur = self.thresholds["max_duration"]
            if duration > target_dur:
                alert = self.trigger_alert(
                    f"Pipeline execution duration exceeded threshold: {duration:.2f}s (Threshold: {target_dur:.2f}s)",
                    severity="WARNING"
                )
                new_alerts.append(alert)
        elif "duration_seconds" in metrics:
            duration = float(metrics["duration_seconds"])
            target_dur = self.thresholds["max_duration"]
            if duration > target_dur:
                alert = self.trigger_alert(
                    f"Pipeline duration exceeded threshold: {duration:.2f}s (Threshold: {target_dur:.2f}s)",
                    severity="WARNING"
                )
                new_alerts.append(alert)

        # 3. Check quality score (handles both 0-100 scale and 0.0-1.0 scale)
        if "overall_score" in metrics or "avg_overall_score" in metrics or "quality_score" in metrics:
            raw_score = metrics.get("overall_score", metrics.get("avg_overall_score", metrics.get("quality_score")))
            if raw_score is not None:
                score = float(raw_score)
                # Convert 0.0-1.0 to 0-100 scale if needed
                score_pct = score * 100.0 if score <= 1.0 else score
                target_qs = self.thresholds["quality_score"]
                if score_pct < target_qs:
                    alert = self.trigger_alert(
                        f"Data quality score below threshold: {score_pct:.2f}% (Threshold: {target_qs:.2f}%)",
                        severity="CRITICAL" if score_pct < (target_qs - 20) else "WARNING"
                    )
                    new_alerts.append(alert)

        # 4. Check data freshness
        if "data_freshness_hours" in metrics or "hours_since_last_run" in metrics:
            freshness = float(metrics.get("data_freshness_hours", metrics.get("hours_since_last_run", 0.0)))
            target_df = self.thresholds["data_freshness"]
            if freshness > target_df:
                alert = self.trigger_alert(
                    f"Data freshness threshold exceeded: {freshness:.2f} hours (Threshold: {target_df:.2f}h)",
                    severity="WARNING"
                )
                new_alerts.append(alert)

        return new_alerts

    def get_alerts(self, hours: int = 24) -> List[Dict[str, Any]]:
        """
        Retrieve alerts triggered within the specified past hours.

        Args:
            hours (int): Timeframe window in hours.

        Returns:
            list[dict]: Filtered alerts list.
        """
        now = datetime.now()
        cutoff = now - timedelta(hours=hours)

        filtered = []
        for alert in self.alerts:
            try:
                ts = datetime.fromisoformat(alert["timestamp"])
                if ts >= cutoff:
                    filtered.append(alert)
            except (KeyError, ValueError, TypeError):
                continue
        return filtered

    def clear_alerts(self) -> None:
        """Clear all stored alerts."""
        self.alerts.clear()
        self.logger.info("Cleared all pipeline alerts.")


pipeline_alerts = PipelineAlerts()
