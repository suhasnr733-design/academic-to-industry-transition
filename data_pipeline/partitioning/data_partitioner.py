# data_pipeline/partitioning/data_partitioner.py

from datetime import datetime
import os

from typing import Dict, List, Any, Optional
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import logging

logger = logging.getLogger(__name__)


class DataPartitioner:
    """Handles date-based partitioning and Parquet persistence for DataFrames."""

    def __init__(self, base_path: str = "data/partitions"):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)

    def partition_by_date(
        self,
        df: pd.DataFrame,
        date_column: str = "posted_date"
    ) -> Dict[str, pd.DataFrame]:
        """
        Partition DataFrame by date column into YYYY/MM buckets.

        Args:
            df (pd.DataFrame): Input DataFrame.
            date_column (str): Name of date column to partition by.

        Returns:
            dict[str, pd.DataFrame]: Mapping of 'YYYY/MM' string key to partition DataFrame.
        """
        if df is None or df.empty:
            return {}

        df_copy = df.copy()

        # Handle missing date column
        if date_column not in df_copy.columns:
            now_key = datetime.now().strftime("%Y/%m")
            return {now_key: df_copy}

        # Convert date column safely
        parsed_dates = pd.to_datetime(df_copy[date_column], errors="coerce")
        fallback_date = datetime.now()
        
        # Create year/month partition keys
        partition_keys = []
        for dt in parsed_dates:
            if pd.isnull(dt):
                partition_keys.append(fallback_date.strftime("%Y/%m"))
            else:
                partition_keys.append(dt.strftime("%Y/%m"))

        df_copy["_partition_key"] = partition_keys

        partitions = {}
        for p_key, group in df_copy.groupby("_partition_key"):
            sub_df = group.drop(columns=["_partition_key"]).copy()
            partitions[str(p_key)] = sub_df

        return partitions

    def save_partitions(
        self,
        partitions: Dict[str, pd.DataFrame],
        prefix: str = "jobs"
    ) -> List[str]:
        """
        Save partition dictionary to disk as Parquet files.

        Args:
            partitions (dict[str, pd.DataFrame]): Dictionary mapping 'YYYY/MM' -> DataFrame.
            prefix (str): File prefix/category.

        Returns:
            list[str]: List of written file paths.
        """
        saved_paths = []
        if not partitions:
            return saved_paths

        for p_key, df_part in partitions.items():
            if df_part is None or df_part.empty:
                continue

            # p_key format: 'YYYY/MM'
            folder_path = os.path.join(self.base_path, prefix, p_key.replace("/", os.sep))
            os.makedirs(folder_path, exist_ok=True)
            
            file_path = os.path.join(folder_path, "data.parquet")

            try:
                table = pa.Table.from_pandas(df_part)
                pq.write_table(table, file_path)
                saved_paths.append(file_path)
                self.logger.info(f"Saved partition to {file_path} ({len(df_part)} rows)")
            except Exception as e:
                self.logger.error(f"Failed saving partition '{p_key}' to Parquet: {e}")

        return saved_paths

    def load_partition(self, path: str) -> pd.DataFrame:
        """
        Load a Parquet partition file into a pandas DataFrame.

        Args:
            path (str): File path to Parquet file.

        Returns:
            pd.DataFrame: Loaded DataFrame.
        """
        if not os.path.exists(path):
            self.logger.error(f"Partition file does not exist: {path}")
            return pd.DataFrame()

        try:
            df = pd.read_parquet(path)
            self.logger.info(f"Loaded partition from {path} ({len(df)} rows)")
            return df
        except Exception as e:
            self.logger.error(f"Error loading partition from {path}: {e}")
            return pd.DataFrame()


data_partitioner = DataPartitioner()
