# data_pipeline/monitoring/quality_dashboard.py

from collections import deque
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Optional
import pandas as pd

from data_pipeline.quality.data_quality_framework import DataQualityFramework

logger = logging.getLogger(__name__)


class QualityDashboard:
    """Dashboard to manage, log, and summarize data quality assessments."""

    def __init__(self, quality_framework: Optional[DataQualityFramework] = None):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.quality_framework = quality_framework or DataQualityFramework()
        self.quality_history = deque(maxlen=1000)

    def assess_and_log(self, df: pd.DataFrame, data_type: str) -> Dict[str, Any]:
        """
        Assess data quality for a DataFrame and log it into history.

        Args:
            df (pd.DataFrame): DataFrame to assess.
            data_type (str): Type identifier ('jobs', 'courses', 'students', etc.).

        Returns:
            dict: Assessment result containing score and breakdown metrics.
        """
        try:
            assessment = self.quality_framework.assess_data_quality(df, data_type)
            record = {
                "timestamp": assessment.get("timestamp", datetime.now().isoformat()),
                "data_type": assessment.get("data_type", data_type),
                "overall_score": float(assessment.get("overall_score", 0.0)),
                "completeness": float(assessment.get("completeness", 0.0)),
                "accuracy": float(assessment.get("accuracy", 0.0)),
                "row_count": int(assessment.get("row_count", 0)),
                "raw_assessment": assessment
            }
            self.quality_history.append(record)
            self.logger.info(
                f"Assessed & logged quality for '{data_type}': "
                f"overall_score={record['overall_score']}, row_count={record['row_count']}"
            )
            return record
        except Exception as e:
            self.logger.error(f"Error assessing quality for '{data_type}': {e}")
            fallback = {
                "timestamp": datetime.now().isoformat(),
                "data_type": data_type,
                "overall_score": 0.0,
                "completeness": 0.0,
                "accuracy": 0.0,
                "row_count": len(df) if df is not None else 0,
                "error": str(e)
            }
            self.quality_history.append(fallback)
            return fallback

    def get_current_quality(self) -> Dict[str, Any]:
        """
        Get the most recent quality assessments grouped by data_type and overall latest.


        Returns:
            dict: Latest quality assessment info.
        """
        if not self.quality_history:
            return {
                "latest": None,
                "by_data_type": {},
                "timestamp": datetime.now().isoformat()
            }

        latest_by_type = {}
        for record in reversed(self.quality_history):
            dtype = record.get("data_type")
            if dtype and dtype not in latest_by_type:
                latest_by_type[dtype] = record

        return {
            "latest": self.quality_history[-1],
            "by_data_type": latest_by_type,
            "timestamp": datetime.now().isoformat()
        }

    def get_quality_trend(self, hours: int = 24) -> List[Dict[str, Any]]:
        """
        Get quality records logged within the specified past hours.

        Args:
            hours (int): Timeframe window in hours.

        Returns:
            list[dict]: Matching quality records.
        """
        now = datetime.now()
        cutoff = now - timedelta(hours=hours)

        trend = []
        for item in self.quality_history:
            try:
                ts = datetime.fromisoformat(item["timestamp"])
                if ts >= cutoff:
                    trend.append(item)
            except (KeyError, ValueError, TypeError):
                continue
        return trend

    def get_summary(self) -> Dict[str, Any]:
        """
        Get aggregated summary metrics across all recorded quality history.

        Returns:
            dict: Summary metrics including averages and record counts.
        """
        if not self.quality_history:
            return {
                "total_assessments": 0,
                "avg_overall_score": 0.0,
                "avg_completeness": 0.0,
                "avg_accuracy": 0.0,
                "latest": None
            }

        total = len(self.quality_history)
        overall_scores = [r["overall_score"] for r in self.quality_history if "overall_score" in r]
        completeness_scores = [r["completeness"] for r in self.quality_history if "completeness" in r]
        accuracy_scores = [r["accuracy"] for r in self.quality_history if "accuracy" in r]

        avg_overall = float(sum(overall_scores) / len(overall_scores)) if overall_scores else 0.0
        avg_comp = float(sum(completeness_scores) / len(completeness_scores)) if completeness_scores else 0.0
        avg_acc = float(sum(accuracy_scores) / len(accuracy_scores)) if accuracy_scores else 0.0

        return {
            "total_assessments": total,
            "avg_overall_score": round(avg_overall, 4),
            "avg_completeness": round(avg_comp, 4),
            "avg_accuracy": round(avg_acc, 4),
            "latest": self.quality_history[-1]
        }


quality_dashboard = QualityDashboard()
