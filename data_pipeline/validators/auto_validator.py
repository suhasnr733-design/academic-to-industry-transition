# data_pipeline/validators/auto_validator.py

from collections import deque
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Union, Optional
import pandas as pd

from data_pipeline.validators.data_validator import DataValidator

logger = logging.getLogger(__name__)


class AutoValidator:
    """Automates and logs schema and data quality validations for DataFrames."""

    def __init__(self, validator: Optional[DataValidator] = None):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.validator = validator or DataValidator()
        self.validation_history = deque(maxlen=1000)

    def validate_and_log(self, df: pd.DataFrame, data_type: str) -> Dict[str, Any]:
        """
        Validate DataFrame using the underlying DataValidator and log the result.

        Args:
            df (pd.DataFrame): DataFrame to validate.
            data_type (str): Type identifier ('jobs', 'courses', 'students', etc.).

        Returns:
            dict: Validation outcome details.
        """
        try:
            if df is None:
                df = pd.DataFrame()

            dtype = data_type.lower()
            if dtype in ("jobs", "job"):
                val_result = self.validator.validate_job_data(df)
            elif dtype in ("students", "student"):
                val_result = self.validator.validate_student_data(df)
            elif dtype in ("courses", "course"):
                val_result = self.validator.validate_course_data(df)
            else:
                val_result = {
                    "total_rows": len(df),
                    "valid": not df.empty,
                    "issues": [] if not df.empty else ["Empty DataFrame"]
                }

            is_valid = bool(val_result.get("valid", False))
            record = {
                "timestamp": datetime.now().isoformat(),
                "data_type": data_type,
                "total_rows": len(df),
                "valid": is_valid,
                "status": "PASS" if is_valid else "FAIL",
                "issues": val_result.get("issues", []),
                "details": val_result
            }
            self.validation_history.append(record)
            self.logger.info(f"Validated '{data_type}': status={record['status']}, rows={record['total_rows']}")
            return record

        except Exception as e:
            self.logger.error(f"Error during automated validation for '{data_type}': {e}")
            fallback = {
                "timestamp": datetime.now().isoformat(),
                "data_type": data_type,
                "total_rows": len(df) if df is not None else 0,
                "valid": False,
                "status": "FAIL",
                "issues": [f"Validation exception: {e}"],
                "details": {}
            }
            self.validation_history.append(fallback)
            return fallback

    def get_validation_summary(self, hours: int = 24) -> Dict[str, Any]:
        """
        Summarize validation runs recorded in the specified past hours window.

        Args:
            hours (int): Timeframe window in hours.

        Returns:
            dict: Validation summary metrics.
        """
        now = datetime.now()
        cutoff = now - timedelta(hours=hours)

        relevant = []
        for record in self.validation_history:
            try:
                ts = datetime.fromisoformat(record["timestamp"])
                if ts >= cutoff:
                    relevant.append(record)
            except (KeyError, ValueError, TypeError):
                continue

        total = len(relevant)
        if total == 0:
            return {
                "total_validations": 0,
                "passed": 0,
                "failed": 0,
                "pass_rate": 0.0,
                "latest": self.validation_history[-1] if self.validation_history else None,
                "period_hours": hours,
                "timestamp": now.isoformat()
            }

        passed = sum(1 for r in relevant if r.get("valid") is True or r.get("status") == "PASS")
        failed = total - passed
        pass_rate = float((passed / total) * 100.0)

        return {
            "total_validations": total,
            "passed": passed,
            "failed": failed,
            "pass_rate": round(pass_rate, 2),
            "latest": relevant[-1],
            "period_hours": hours,
            "timestamp": now.isoformat()
        }

    def validate_schema(
        self,
        df: pd.DataFrame,
        expected_schema: Union[List[str], Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Validate schema structure of a DataFrame against expected column names and types.

        Args:
            df (pd.DataFrame): DataFrame to inspect.
            expected_schema (list | dict):
                - list of required column names, or
                - dict mapping col_name -> expected dtype (str or type).

        Returns:
            dict: Schema validation report.
        """
        if df is None:
            return {
                "valid": False,
                "missing_columns": list(expected_schema) if expected_schema else [],
                "incorrect_data_types": {},
                "issues": ["DataFrame is None"]
            }

        missing_columns = []
        incorrect_data_types = {}
        issues = []

        if isinstance(expected_schema, (list, tuple, set)):
            expected_cols = list(expected_schema)
            for col in expected_cols:
                if col not in df.columns:
                    missing_columns.append(col)
                    issues.append(f"Missing required column: '{col}'")

        elif isinstance(expected_schema, dict):
            for col, exp_type in expected_schema.items():
                if col not in df.columns:
                    missing_columns.append(col)
                    issues.append(f"Missing required column: '{col}'")
                else:
                    actual_dtype = str(df[col].dtype)
                    exp_type_str = str(exp_type)
                    
                    # Basic type matching check
                    type_matched = True
                    if isinstance(exp_type, type):
                        if exp_type == str or exp_type == object:
                            type_matched = actual_dtype in ("object", "string", "category")
                        elif exp_type == int:
                            type_matched = "int" in actual_dtype
                        elif exp_type == float:
                            type_matched = "float" in actual_dtype or "int" in actual_dtype
                        elif exp_type == bool:
                            type_matched = "bool" in actual_dtype
                    elif isinstance(exp_type, str):
                        type_matched = exp_type.lower() in actual_dtype.lower()

                    if not type_matched:
                        incorrect_data_types[col] = {
                            "expected": exp_type_str,
                            "actual": actual_dtype
                        }
                        issues.append(
                            f"Column '{col}' has type '{actual_dtype}', expected '{exp_type_str}'"
                        )

        valid = len(issues) == 0
        return {
            "valid": valid,
            "missing_columns": missing_columns,
            "incorrect_data_types": incorrect_data_types,
            "issues": issues
        }


auto_validator = AutoValidator()
