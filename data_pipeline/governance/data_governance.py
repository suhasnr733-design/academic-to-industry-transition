"""
Data Governance module for Academic-to-Industry Transition Data Pipeline.
Generates data dictionaries and system governance reports.
"""

from datetime import datetime
import logging
import pandas as pd

logger = logging.getLogger(__name__)


class DataGovernance:
    def __init__(self):
        self.logger = logging.getLogger("DataGovernance")
        self.metadata_store = {}

    def create_data_dictionary(self, df: pd.DataFrame, table_name: str) -> dict:
        """
        Creates a data dictionary for a given DataFrame and stores it in metadata_store.

        Args:
            df (pd.DataFrame): DataFrame to profile.
            table_name (str): Target table identifier.

        Returns:
            dict: Structured metadata data dictionary.
        """
        created_at = datetime.now().isoformat()
        row_count = len(df) if df is not None else 0

        columns_info = []
        if df is not None and not df.empty:
            for col in df.columns:
                col_data = df[col]
                info = {
                    "name": str(col),
                    "data_type": str(col_data.dtype),
                    "nullable": bool(col_data.isnull().any()),
                    "unique_count": int(col_data.nunique(dropna=False)),
                    "null_count": int(col_data.isnull().sum()),
                }
                columns_info.append(info)

        data_dict = {
            "table_name": table_name,
            "created_at": created_at,
            "row_count": row_count,
            "columns": columns_info,
        }

        self.metadata_store[table_name] = data_dict
        self.logger.info(f"Created data dictionary for table '{table_name}' with {len(columns_info)} columns")
        return data_dict

    def generate_governance_report(self) -> dict:
        """
        Generates a comprehensive governance report across all profiled tables.

        Returns:
            dict: System governance report.
        """
        timestamp = datetime.now().isoformat()
        tables_summary = {}
        total_columns = 0

        for table_name, dict_data in self.metadata_store.items():
            col_count = len(dict_data.get("columns", []))
            total_columns += col_count
            tables_summary[table_name] = dict_data

        report = {
            "timestamp": timestamp,
            "tables": tables_summary,
            "total_columns": total_columns,
        }

        self.logger.info(f"Generated governance report for {len(tables_summary)} tables ({total_columns} total columns)")
        return report
