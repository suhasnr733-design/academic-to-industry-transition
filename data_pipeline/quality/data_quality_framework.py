"""
Data Quality Framework for Academic-to-Industry Transition Data Pipeline.
Calculates completeness, accuracy, consistency, and overall quality score for DataFrames.
"""

from datetime import datetime
import logging
import pandas as pd

logger = logging.getLogger(__name__)


class DataQualityFramework:
    def __init__(self):
        self.logger = logging.getLogger("DataQualityFramework")

    def assess_data_quality(self, df: pd.DataFrame, data_type: str) -> dict:
        """
        Assesses data quality of a given DataFrame across completeness, accuracy, and consistency.

        Args:
            df (pd.DataFrame): The DataFrame to assess.
            data_type (str): Type identifier for dataset (e.g. 'jobs', 'courses').

        Returns:
            dict: Data quality assessment containing scores and metadata.
        """
        timestamp = datetime.now().isoformat()

        if df is None or df.empty:
            return {
                "data_type": data_type,
                "timestamp": timestamp,
                "row_count": 0,
                "completeness": 0.0,
                "accuracy": 0.0,
                "consistency": 0.0,
                "overall_score": 0.0,
            }

        total_rows = len(df)
        total_cells = df.size

        # 1. Completeness: ratio of non-null values across all cells
        null_count = int(df.isnull().sum().sum())
        completeness = float((total_cells - null_count) / total_cells) if total_cells > 0 else 1.0

        # 2. Accuracy: detect invalid object values (missing, empty strings, 'Unknown')
        obj_cols = df.select_dtypes(include=["object", "string"]).columns
        if len(obj_cols) > 0:
            invalid_accuracy_count = 0
            total_obj_cells = len(obj_cols) * total_rows
            for col in obj_cols:
                for val in df[col]:
                    if pd.isnull(val):
                        invalid_accuracy_count += 1
                    elif isinstance(val, str):
                        s_val = val.strip()
                        if s_val == "" or s_val.lower() == "unknown":
                            invalid_accuracy_count += 1
            accuracy = float((total_obj_cells - invalid_accuracy_count) / total_obj_cells) if total_obj_cells > 0 else 1.0
        else:
            accuracy = 1.0

        # 3. Consistency: check inconsistent casing in object/string columns
        if len(obj_cols) > 0:
            inconsistent_count = 0
            total_obj_cells = len(obj_cols) * total_rows
            for col in obj_cols:
                str_vals = df[col].dropna().astype(str).str.strip()
                str_vals = str_vals[str_vals != ""]
                if len(str_vals) > 0:
                    lower_to_originals = {}
                    for val in str_vals:
                        l_val = val.lower()
                        if l_val not in lower_to_originals:
                            lower_to_originals[l_val] = set()
                        lower_to_originals[l_val].add(val)

                    multi_cased_lowers = {k for k, v in lower_to_originals.items() if len(v) > 1}
                    for val in df[col]:
                        if isinstance(val, str) and val.strip().lower() in multi_cased_lowers:
                            inconsistent_count += 1
            consistency = float((total_obj_cells - inconsistent_count) / total_obj_cells) if total_obj_cells > 0 else 1.0
        else:
            consistency = 1.0

        # Overall Score: Mean of completeness, accuracy, and consistency
        overall_score = float((completeness + accuracy + consistency) / 3.0)

        result = {
            "data_type": data_type,
            "timestamp": timestamp,
            "row_count": total_rows,
            "completeness": round(completeness, 4),
            "accuracy": round(accuracy, 4),
            "consistency": round(consistency, 4),
            "overall_score": round(overall_score, 4),
        }

        self.logger.info(f"Assessed {data_type} data quality: overall_score={result['overall_score']}")
        return result
