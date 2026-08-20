# data_pipeline/quality/automated_quality.py

from collections import deque
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Callable, Optional
import pandas as pd

logger = logging.getLogger(__name__)


class AutomatedQuality:
    """Automates quality rule execution, DataFrame validation, and quality metrics logging."""

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.rules: Dict[str, Callable[[pd.DataFrame], Dict[str, Any]]] = {}
        self.quality_history = deque(maxlen=1000)
        self._register_default_rules()

    def _register_default_rules(self):
        """Register default quality rules for jobs/courses/students datasets."""
        
        def required_columns_check(df: pd.DataFrame) -> Dict[str, Any]:
            if df is None or df.empty:
                return {"passed": False, "message": "DataFrame is empty"}
            
            missing = {}
            for col in ['title', 'company']:
                if col in df.columns:
                    nulls = int(df[col].isnull().sum())
                    if nulls > 0:
                        missing[col] = nulls
            passed = len(missing) == 0
            return {"passed": passed, "missing_or_null": missing}

        def skills_validation_check(df: pd.DataFrame) -> Dict[str, Any]:
            if df is None or df.empty:
                return {"passed": True, "empty_skills_count": 0}

            if 'skills' not in df.columns:
                return {"passed": True, "note": "No skills column present"}

            empty_count = 0
            for val in df['skills']:
                if val is None:
                    empty_count += 1
                elif isinstance(val, (list, tuple, set)) and len(val) == 0:
                    empty_count += 1
                elif isinstance(val, str) and not val.strip():
                    empty_count += 1

            passed = empty_count == 0
            return {"passed": passed, "empty_skills_count": empty_count}

        self.add_rule("required_columns_check", required_columns_check)
        self.add_rule("skills_validation_check", skills_validation_check)

    def add_rule(self, rule_name: str, rule_func: Callable[[pd.DataFrame], Dict[str, Any]]) -> None:
        """
        Add a custom validation rule.

        Args:
            rule_name (str): Unique rule identifier.
            rule_func (callable): Function taking DataFrame and returning dict with 'passed' boolean.
        """
        self.rules[rule_name] = rule_func
        self.logger.info(f"Registered data quality rule: '{rule_name}'")

    def validate_dataframe(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Run all registered quality rules against DataFrame safely without crashing on rule exceptions.

        Args:
            df (pd.DataFrame): Input DataFrame.

        Returns:
            dict: Comprehensive quality report.
        """
        now_iso = datetime.now().isoformat()
        total_rows = len(df) if df is not None else 0

        rule_results = {}
        all_passed = True

        for name, rule_fn in self.rules.items():
            try:
                res = rule_fn(df)
                if not isinstance(res, dict):
                    res = {"passed": bool(res)}
                rule_passed = bool(res.get("passed", False))
                rule_results[name] = {
                    "passed": rule_passed,
                    "details": res
                }
                if not rule_passed:
                    all_passed = False
            except Exception as e:
                self.logger.error(f"Rule '{name}' raised an exception: {e}")
                rule_results[name] = {
                    "passed": False,
                    "error": str(e),
                    "details": {"passed": False, "error": str(e)}
                }
                all_passed = False

        record = {
            "timestamp": now_iso,
            "total_rows": total_rows,
            "rules": rule_results,
            "passed": all_passed
        }
        self.quality_history.append(record)
        self.logger.info(f"Quality validation complete: overall passed={all_passed}, rows={total_rows}")
        return record

    def get_quality_summary(self, hours: int = 24) -> Dict[str, Any]:
        """
        Get summarized data quality statistics for checks run in past hours.

        Args:
            hours (int): Timeframe window in hours.

        Returns:
            dict: Aggregated validation metrics.
        """
        now = datetime.now()
        cutoff = now - timedelta(hours=hours)

        relevant = []
        for item in self.quality_history:
            try:
                ts = datetime.fromisoformat(item["timestamp"])
                if ts >= cutoff:
                    relevant.append(item)
            except (KeyError, ValueError, TypeError):
                continue

        total = len(relevant)
        if total == 0:
            return {
                "total_checks": 0,
                "passed": 0,
                "failed": 0,
                "pass_rate": 0.0,
                "latest": self.quality_history[-1] if self.quality_history else None,
                "timestamp": now.isoformat()
            }

        passed_count = sum(1 for r in relevant if r.get("passed") is True)
        failed_count = total - passed_count
        pass_rate = float((passed_count / total) * 100.0)

        return {
            "total_checks": total,
            "passed": passed_count,
            "failed": failed_count,
            "pass_rate": round(pass_rate, 2),
            "latest": relevant[-1],
            "timestamp": now.isoformat()
        }


automated_quality = AutomatedQuality()
