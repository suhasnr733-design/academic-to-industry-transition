# data_pipeline/production/final_optimizer.py

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import logging
import os
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class FinalPipelineOptimizer:
    """Production DataFrame memory optimizer supporting downcasting, categorical conversion, and parallel optimization."""

    def __init__(self, max_workers: int = 4, batch_size: int = 5000):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.max_workers = max_workers if max_workers > 0 else 4
        self.batch_size = batch_size if batch_size > 0 else 5000

    def optimize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Optimize DataFrame memory usage by downcasting numeric types and converting low-cardinality strings to category.

        Args:
            df (pd.DataFrame): Input DataFrame.

        Returns:
            pd.DataFrame: Optimized copy of the DataFrame.
        """
        if df is None or df.empty:
            return pd.DataFrame() if df is None else df.copy()

        optimized_df = df.copy()
        num_rows = len(optimized_df)

        for col in optimized_df.columns:
            dtype = optimized_df[col].dtype

            # Downcast Integer columns
            if pd.api.types.is_integer_dtype(dtype):
                try:
                    optimized_df[col] = pd.to_numeric(optimized_df[col], downcast='integer')
                except Exception as e:
                    self.logger.debug(f"Failed integer downcasting on '{col}': {e}")

            # Downcast Float columns
            elif pd.api.types.is_float_dtype(dtype):
                try:
                    optimized_df[col] = pd.to_numeric(optimized_df[col], downcast='float')
                except Exception as e:
                    self.logger.debug(f"Failed float downcasting on '{col}': {e}")

            # Convert low-cardinality object/string columns to category
            elif pd.api.types.is_object_dtype(dtype) or isinstance(dtype, pd.StringDtype):
                # Don't convert list/sequence containing columns (e.g. skills: ['Python', 'SQL'])
                sample = optimized_df[col].dropna().head(5)
                if any(isinstance(val, (list, tuple, set, dict)) for val in sample):
                    continue

                try:
                    num_unique = optimized_df[col].nunique(dropna=True)
                    if num_rows > 0 and (num_unique <= 50 or (num_unique / num_rows) < 0.5):
                        optimized_df[col] = optimized_df[col].astype('category')
                except Exception as e:
                    self.logger.debug(f"Failed category conversion on '{col}': {e}")

        return optimized_df

    def parallel_optimize(self, dataframes: List[pd.DataFrame]) -> List[pd.DataFrame]:
        """
        Optimize multiple DataFrames concurrently using ThreadPoolExecutor while preserving order.

        Args:
            dataframes (list[pd.DataFrame]): List of DataFrames to optimize.

        Returns:
            list[pd.DataFrame]: List of optimized DataFrames.
        """
        if not dataframes:
            return []

        results = [None] * len(dataframes)

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_idx = {
                executor.submit(self.optimize_dataframe, df): idx
                for idx, df in enumerate(dataframes)
            }

            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    results[idx] = future.result()
                except Exception as e:
                    self.logger.error(f"Error in parallel optimization for DataFrame index {idx}: {e}")
                    results[idx] = dataframes[idx].copy() if dataframes[idx] is not None else pd.DataFrame()

        return [r for r in results if r is not None]

    def get_optimization_report(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Measure actual memory usage before and after optimization and generate report.

        Args:
            df (pd.DataFrame): Original DataFrame.

        Returns:
            dict: Optimization report with memory reduction metrics.
        """
        now_iso = datetime.now().isoformat()
        if df is None or df.empty:
            return {
                "memory_before_mb": 0.0,
                "memory_after_mb": 0.0,
                "reduction_percentage": 0.0,
                "timestamp": now_iso
            }

        try:
            mem_before_bytes = df.memory_usage(deep=True).sum()
            mem_before_mb = float(mem_before_bytes / (1024 * 1024))

            optimized = self.optimize_dataframe(df)

            mem_after_bytes = optimized.memory_usage(deep=True).sum()
            mem_after_mb = float(mem_after_bytes / (1024 * 1024))

            if mem_before_mb > 0:
                reduction_pct = float(((mem_before_mb - mem_after_mb) / mem_before_mb) * 100.0)
            else:
                reduction_pct = 0.0

            return {
                "memory_before_mb": round(mem_before_mb, 4),
                "memory_after_mb": round(mem_after_mb, 4),
                "reduction_percentage": round(max(0.0, reduction_pct), 2),
                "timestamp": now_iso
            }
        except Exception as e:
            self.logger.error(f"Error calculating optimization report: {e}")
            return {
                "memory_before_mb": 0.0,
                "memory_after_mb": 0.0,
                "reduction_percentage": 0.0,
                "error": str(e),
                "timestamp": now_iso
            }


final_optimizer = FinalPipelineOptimizer()
