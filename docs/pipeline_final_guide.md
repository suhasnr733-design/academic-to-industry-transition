# Data Pipeline Architecture & Production Guide (Weeks 21–28)

This comprehensive guide details the complete data pipeline architecture, performance optimizations, automated quality validation, fault tolerance, data recovery, REST API endpoints, and production deployment procedures for the **Academic to Industry Transition Platform**.

---

## 1. System Architecture Overview

The data pipeline connects data collection, transformation, quality validation, scaling, resilience, and API delivery.

```
                      +-----------------------------+
                      | Data Collection & Scraping  |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |  Automated Quality Rules    |
                      |    & Anomaly Detection      |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Parallel Processing &     |
                      |   Parquet Partitioning      |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Fault-Tolerant Engine &   |
                      |   Backup Data Recovery      |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   SQLite / Postgres DB &    |
                      |     Flask REST API v1       |
                      +-----------------------------+
```

---

## 2. Component Specifications

### 2.1 Performance & Query Optimization (Week 25)
- **`QueryOptimizer` (`data_pipeline/optimization/query_optimizer.py`)**:
  - `analyze_slow_queries()`: Inspects engine dialect; queries `pg_stat_statements` on PostgreSQL or returns dialect capability status on SQLite.
  - `create_indexes()`: Inspects existing database tables (`jobs`, `courses`, `students`, etc.) and safely creates indexes on key columns (`posted_date`, `company`, `domain`, `user_id`, `status`, `role`).
  - `optimize_table(table_name)`: Performs `VACUUM ANALYZE` on PostgreSQL or `VACUUM`/`ANALYZE` on SQLite.
  - `get_query_stats()`: Returns total tables and row counts.

- **`ParallelProcessor` (`data_pipeline/optimization/parallel_processor.py`)**:
  - `parallel_apply(df, func, chunksize, use_processes)`: Splits DataFrames into chunks and processes them concurrently via `ThreadPoolExecutor` or `ProcessPoolExecutor`.
  - `process_batch(items, process_func, batch_size)`: Processes item batches concurrently and flattens results.
  - `parallel_read(file_paths, read_func)`: Reads multiple CSV/Parquet files in parallel and merges them into a single DataFrame.

### 2.2 Quality Automation & Anomaly Detection (Week 26)
- **`AutomatedQuality` (`data_pipeline/quality/automated_quality.py`)**:
  - Maintains configurable validation rules (`required_columns_check`, `skills_validation_check`).
  - `validate_dataframe(df)`: Safely executes all rules against DataFrames without crashing on rule exceptions.
  - `get_quality_summary(hours)`: Returns aggregate pass rates and historical quality metrics.

- **`AnomalyDetector` (`data_pipeline/quality/anomaly_detection.py`)**:
  - `detect_anomalies(df, columns)`: Uses `scikit-learn` `IsolationForest` and `StandardScaler` to identify multivariate anomalies.
  - `detect_outliers(df, column)`: Uses Interquartile Range (IQR: $Q_1 - 1.5 \times \text{IQR}$ to $Q_3 + 1.5 \times \text{IQR}$) to identify univariate outliers.

### 2.3 Resilience, Fault Tolerance & Recovery (Week 27)
- **`FaultTolerance` (`data_pipeline/resilience/fault_tolerance.py`)**:
  - `@retry(max_retries, delay, backoff)`: Decorator that transparently retries transient failures.
  - `@circuit_breaker(failure_threshold, timeout)`: Stateful circuit breaker (`CLOSED`, `OPEN`, `HALF-OPEN`) preventing cascading system failures.

- **`DataRecovery` (`data_pipeline/resilience/data_recovery.py`)**:
  - `create_backup(data_path)`: Creates timestamped backup copies (`.bak`) in `data/backup/`.
  - `restore_backup(backup_path, target_path)`: Restores backups safely.
  - `list_backups(days)` & `cleanup_backups(keep)`: Manages backup retention and cleans up old backup files inside `data/backup/`.

---

## 3. Flask REST API Integration

Endpoints registered under `/api/v1/pipeline/*`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/pipeline/status` | Pipeline metrics & 7-day daily execution trends |
| `GET` | `/api/v1/pipeline/quality` | Data quality summary & current status |
| `GET` | `/api/v1/pipeline/alerts` | Pipeline threshold breach alerts |
| `POST` | `/api/v1/pipeline/etl/trigger` | Trigger manual ETL (`full` or `incremental`) |
| `GET` | `/api/v1/pipeline/etl/status` | Automated ETL background schedule state |
| `GET` | `/api/v1/pipeline/query/analysis` | Database query analysis & dialect capabilities |
| `GET` | `/api/v1/pipeline/query/stats` | Database table & row count statistics |
| `POST` | `/api/v1/pipeline/quality/run` | Run automated quality validation on JSON payload |
| `GET` | `/api/v1/pipeline/quality/summary` | Automated quality metrics summary over time |
| `POST` | `/api/v1/pipeline/anomalies` | Detect multivariate anomalies & outliers |
| `GET` | `/api/v1/pipeline/test/retry` | Test fault tolerance retry route |
| `GET | `/api/v1/pipeline/test/circuit` | Test circuit breaker status route |
| `POST` | `/api/v1/pipeline/backup/create` | Create a dataset backup copy |
| `GET` | `/api/v1/pipeline/backup/list` | List recent dataset backups |

---

## 4. Testing & Verification

Run unit tests:
```bash
python -m pytest data_pipeline/tests/test_week25_27.py -v
```

Run integration tests:
```bash
python -m pytest tests/integration/test_final_pipeline.py -v
```

Run complete repository test suite:
```bash
python -m pytest tests/ data_pipeline/tests/ -v
```

---

## 5. Deployment Automation

Deployment is automated via `scripts/deploy_pipeline_final.sh`:

```bash
# Set registry URL optional
export REGISTRY="docker.io/myorg"

# Run deployment script
bash scripts/deploy_pipeline_final.sh
```
