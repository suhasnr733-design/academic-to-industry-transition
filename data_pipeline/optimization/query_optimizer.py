# data_pipeline/optimization/query_optimizer.py

import os
import logging
from typing import Dict, List, Any, Optional
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError

try:
    from data_pipeline.loaders.database_loader import DatabaseLoader
except ImportError:
    DatabaseLoader = None

logger = logging.getLogger(__name__)


class QueryOptimizer:
    """Database query optimizer and schema index manager compatible with SQLite and PostgreSQL."""

    def __init__(self, db_loader: Optional[Any] = None):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.db_loader = db_loader or (DatabaseLoader() if DatabaseLoader else None)
        self.engine = getattr(self.db_loader, "engine", None) if self.db_loader else None

    def _get_dialect_name(self) -> str:
        if self.engine:
            return self.engine.dialect.name.lower()
        return "unknown"

    def analyze_slow_queries(self) -> Dict[str, Any]:
        """
        Analyze slow database queries using the database's supported statistics mechanism.

        Returns:
            dict: Slow query statistics or dialect compatibility report.
        """
        dialect = self._get_dialect_name()
        if not self.engine:
            return {
                "dialect": dialect,
                "supported": False,
                "message": "Database engine is not connected."
            }

        if dialect == "postgresql":
            try:
                with self.engine.connect() as conn:
                    result = conn.execute(text(
                        "SELECT query, calls, total_exec_time, mean_exec_time "
                        "FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
                    ))
                    queries = [dict(row._mapping) for row in result]
                    return {
                        "dialect": dialect,
                        "supported": True,
                        "slow_queries": queries
                    }
            except Exception as e:
                self.logger.info(f"pg_stat_statements query failed: {e}")
                return {
                    "dialect": dialect,
                    "supported": False,
                    "message": f"pg_stat_statements is not enabled: {e}"
                }
        else:
            return {
                "dialect": dialect,
                "supported": False,
                "message": f"Slow query profiling via pg_stat_statements is unavailable on {dialect}. Database is operating normally."
            }

    def create_indexes(self) -> Dict[str, Any]:

        """
        Create appropriate database indexes for existing tables and columns safely.

        Returns:
            dict: Summary of index creation results.
        """
        if not self.engine:
            return {"status": "error", "message": "Database engine not connected", "created_indexes": []}

        created = []
        skipped = []
        errors = []

        try:
            inspector = inspect(self.engine)
            existing_tables = set(inspector.get_table_names())

            # Define potential index targets: (table_name, column_name, index_name)
            index_targets = [
                ("jobs", "posted_date", "idx_jobs_posted_date"),
                ("jobs", "company", "idx_jobs_company"),
                ("jobs", "domain", "idx_jobs_domain"),
                ("jobs", "required_skills", "idx_jobs_required_skills"),
                ("courses", "platform", "idx_courses_platform"),
                ("students", "student_id", "idx_students_student_id"),
                ("students", "department", "idx_students_department"),
                ("resumes", "user_id", "idx_resumes_user_id"),
                ("resumes", "status", "idx_resumes_status"),
                ("users", "role", "idx_users_role"),
            ]

            dialect = self._get_dialect_name()

            with self.engine.connect() as conn:
                for table, col, idx_name in index_targets:
                    if table not in existing_tables:
                        skipped.append(f"{idx_name} (table '{table}' does not exist)")
                        continue

                    # Inspect columns in table
                    table_cols = [c["name"] for c in inspector.get_columns(table)]
                    if col not in table_cols:
                        skipped.append(f"{idx_name} (column '{col}' does not exist in '{table}')")
                        continue

                    try:
                        sql = f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}({col})"
                        conn.execute(text(sql))
                        created.append(f"{idx_name} on {table}({col})")
                    except Exception as ie:
                        errors.append(f"{idx_name}: {ie}")

                if dialect == "sqlite":
                    conn.commit()

            self.logger.info(f"Created/verified {len(created)} indexes.")
            return {
                "status": "success",
                "created_indexes": created,
                "skipped_indexes": skipped,
                "errors": errors
            }

        except Exception as e:
            self.logger.error(f"Error creating indexes: {e}")
            return {"status": "error", "message": str(e), "created_indexes": []}

    def optimize_table(self, table_name: str) -> Dict[str, Any]:
        """
        Perform appropriate table optimization/maintenance depending on database dialect.

        Args:
            table_name (str): Name of table to optimize.

        Returns:
            dict: Maintenance outcome.
        """
        if not self.engine:
            return {"status": "error", "message": "Database engine not connected"}

        dialect = self._get_dialect_name()
        try:
            with self.engine.connect() as conn:
                if dialect == "postgresql":
                    conn.execute(text(f"VACUUM ANALYZE {table_name};"))
                    msg = f"VACUUM ANALYZE executed for '{table_name}'"
                elif dialect == "sqlite":
                    conn.execute(text("VACUUM;"))
                    conn.execute(text(f"ANALYZE {table_name};"))
                    conn.commit()
                    msg = f"VACUUM & ANALYZE executed for SQLite table '{table_name}'"
                else:
                    msg = f"Optimization not specifically configured for dialect '{dialect}'"

            self.logger.info(msg)
            return {
                "status": "success",
                "table_name": table_name,
                "dialect": dialect,
                "message": msg
            }
        except Exception as e:
            self.logger.error(f"Error optimizing table '{table_name}': {e}")
            return {"status": "error", "table_name": table_name, "error": str(e)}

    def get_query_stats(self) -> Dict[str, Any]:
        """
        Get table and query statistics from the database.

        Returns:
            dict: Database tables and row counts.
        """
        if not self.engine:
            return {"status": "error", "message": "Database engine not connected"}

        dialect = self._get_dialect_name()
        table_stats = {}

        try:
            inspector = inspect(self.engine)
            tables = inspector.get_table_names()

            with self.engine.connect() as conn:
                for table in tables:
                    try:
                        res = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                        count = res.scalar()
                        table_stats[table] = count
                    except Exception:
                        table_stats[table] = 0

            return {
                "status": "success",
                "dialect": dialect,
                "total_tables": len(tables),
                "table_row_counts": table_stats
            }
        except Exception as e:
            self.logger.error(f"Error fetching query stats: {e}")
            return {"status": "error", "error": str(e)}


query_optimizer = QueryOptimizer()
