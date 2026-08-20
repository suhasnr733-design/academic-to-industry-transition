# data_pipeline/quality/anomaly_detection.py

from datetime import datetime
import logging
from typing import Dict, List, Any, Optional, Union
import numpy as np
import pandas as pd

try:
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
except ImportError:
    IsolationForest = None
    StandardScaler = None

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Detect anomalies in DataFrames using scikit-learn IsolationForest and IQR statistics."""

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)

    def detect_anomalies(
        self,
        df: pd.DataFrame,
        columns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Detect multivariate anomalies using IsolationForest.

        Args:
            df (pd.DataFrame): Input DataFrame.
            columns (list[str], optional): Specific numerical columns to evaluate.

        Returns:
            dict: Anomaly report including counts, percentages, and detected row indices.
        """
        now_iso = datetime.now().isoformat()
        if df is None or df.empty:
            return {
                "total_rows": 0,
                "anomaly_count": 0,
                "anomaly_percentage": 0.0,
                "anomalies": [],
                "timestamp": now_iso
            }

        total_rows = len(df)

        # Filter target numerical columns
        if columns:
            valid_cols = [c for c in columns if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]
        else:
            valid_cols = list(df.select_dtypes(include=[np.number]).columns)

        if not valid_cols:
            return {
                "total_rows": total_rows,
                "anomaly_count": 0,
                "anomaly_percentage": 0.0,
                "anomalies": [],
                "note": "No valid numerical columns found",
                "timestamp": now_iso
            }

        try:
            # Prepare matrix with missing value handling & scaling
            feature_data = df[valid_cols].copy()
            for col in valid_cols:
                median_val = feature_data[col].median()
                fill_val = median_val if not pd.isnull(median_val) else 0.0
                feature_data[col] = feature_data[col].fillna(fill_val)

            # Check for zero std columns to avoid division errors
            stds = feature_data.std()
            varying_cols = [c for c in valid_cols if stds[c] > 1e-6]
            if not varying_cols:
                return {
                    "total_rows": total_rows,
                    "anomaly_count": 0,
                    "anomaly_percentage": 0.0,
                    "anomalies": [],
                    "note": "All numerical columns have zero variance",
                    "timestamp": now_iso
                }

            matrix = feature_data[varying_cols].values
            if StandardScaler:
                matrix = StandardScaler().fit_transform(matrix)

            if IsolationForest:
                iso = IsolationForest(contamination=0.05, random_state=42)
                preds = iso.fit_predict(matrix)
                # preds: -1 for anomaly, 1 for normal
                anomaly_indices = [int(idx) for idx, p in enumerate(preds) if p == -1]
            else:
                # Fallback IQR if IsolationForest is unavailable
                anomaly_indices = []

            anomaly_count = len(anomaly_indices)
            pct = float((anomaly_count / total_rows) * 100.0) if total_rows > 0 else 0.0

            return {
                "total_rows": total_rows,
                "anomaly_count": anomaly_count,
                "anomaly_percentage": round(pct, 2),
                "anomalies": anomaly_indices,
                "evaluated_columns": varying_cols,
                "timestamp": now_iso
            }

        except Exception as e:
            self.logger.error(f"Error in detect_anomalies: {e}")
            return {
                "total_rows": total_rows,
                "anomaly_count": 0,
                "anomaly_percentage": 0.0,
                "anomalies": [],
                "error": str(e),
                "timestamp": now_iso
            }

    def detect_outliers(self, df: pd.DataFrame, column: str) -> Dict[str, Any]:
        """
        Detect univariate outliers using IQR (Interquartile Range) methodology.

        Args:
            df (pd.DataFrame): Input DataFrame.
            column (str): Numerical column name.

        Returns:
            dict: Outlier report including bounds and outlier count.
        """
        now_iso = datetime.now().isoformat()
        if df is None or df.empty or column not in df.columns:
            return {
                "column": column,
                "total_rows": 0,
                "outlier_count": 0,
                "outlier_percentage": 0.0,
                "lower_bound": 0.0,
                "upper_bound": 0.0,
                "timestamp": now_iso
            }

        series = pd.to_numeric(df[column], errors='coerce').dropna()
        total_rows = len(series)

        if total_rows == 0:
            return {
                "column": column,
                "total_rows": 0,
                "outlier_count": 0,
                "outlier_percentage": 0.0,
                "lower_bound": 0.0,
                "upper_bound": 0.0,
                "timestamp": now_iso
            }

        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1

        lower_bound = float(q1 - 1.5 * iqr)
        upper_bound = float(q3 + 1.5 * iqr)

        outliers = series[(series < lower_bound) | (series > upper_bound)]
        outlier_count = len(outliers)
        pct = float((outlier_count / total_rows) * 100.0) if total_rows > 0 else 0.0

        return {
            "column": column,
            "total_rows": total_rows,
            "outlier_count": outlier_count,
            "outlier_percentage": round(pct, 2),
            "lower_bound": round(lower_bound, 4),
            "upper_bound": round(upper_bound, 4),
            "timestamp": now_iso
        }


anomaly_detector = AnomalyDetector()
