# Complete Data Pipeline Architecture & Production Reference (Weeks 21–32)

This master document details the complete end-to-end data engineering architecture, quality validation, scaling, resilience, monitoring, API integration, testing, deployment, and handover procedures for the **Academic to Industry Transition Platform**.

---

## 1. Architecture Overview
The data pipeline provides robust, modular, and resilient data processing:

```
[ Data Collection ] ---> [ Data Cleaning & Validation ] ---> [ Quality Rules & Anomaly Detection ]
                                                                       |
[ REST API & Monitoring ] <--- [ Partitioned Parquet & DB ] <--- [ Parallel Optimization & Recovery ]
```

---

## 2. Data Sources
- **Job Postings Data**: Live web scraper & synthetic job data collection (`DataCollector`, `JobScraper`).
- **Student Placement Data**: Synthetic student academic records, CGPA, skills, internships (`clean_student_data`).
- **Course & Platform Data**: Course catalog records and skill mapping classifications (`courses`, `skill_mappings`).

---

## 3. Extraction
Data extraction is handled by `DataCollector` and `JobScraper` with rate limiting (`SCRAPING_DELAY = 2`), custom user-agent headers, and defensive error handling.

---

## 4. Transformation
Data cleaning and normalization are managed by `DataCleaner` (`data_pipeline/transformers/data_cleaner.py`):
- `clean_job_data()`: Cleans titles, companies, salary ranges, and extracts domains safely.
- `clean_student_data()`: Normalizes CGPA, skills, project counts, and populates missing defaults defensively.

---

## 5. Loading
Data loading is managed by `DatabaseLoader` (`data_pipeline/loaders/database_loader.py`):
- Connects via SQLAlchemy (`DATABASE_URL = sqlite:///data/processed/industry_data.db`).
- Creates schema tables: `jobs`, `courses`, `students`, `skill_mappings`, `companies`.
- Supports DataFrame batch insertion via `load_dataframe()`.

---

## 6. Data Quality
Data quality is enforced by dual frameworks:
- **`DataQualityFramework` (`data_pipeline/quality/data_quality_framework.py`)**: Assesses completeness, accuracy, consistency, and validity.
- **`AutomatedQuality` (`data_pipeline/quality/automated_quality.py`)**: Runs rule suites (`required_columns_check`, `skills_validation_check`) safely without crashing.

---

## 7. Anomaly Detection
Provided by `AnomalyDetector` (`data_pipeline/quality/anomaly_detection.py`):
- **Multivariate Anomalies**: `scikit-learn` `IsolationForest(contamination=0.05)` & `StandardScaler`.
- **Univariate Outliers**: Interquartile Range ($Q_1 - 1.5 \times \text{IQR}$ to $Q_3 + 1.5 \times \text{IQR}$).

---

## 8. Monitoring & Dashboard
- **`PipelineMonitor` (`data_pipeline/monitoring/pipeline_monitor.py`)**: Logs executions (`deque(maxlen=1000)`), computes 24h success rates, durations, and 7-day daily trends.
- **`QualityDashboard` (`data_pipeline/monitoring/quality_dashboard.py`)**: Aggregates dataset scores.
- **`PipelineAlerts` (`data_pipeline/monitoring/alerts.py`)**: Triggers alerts on threshold breaches (`success_rate < 95%`, `duration > 300s`).

---

## 9. Performance Optimization
- **`QueryOptimizer` (`data_pipeline/optimization/query_optimizer.py`)**: Safely creates indexes (`idx_jobs_posted_date`, `idx_jobs_company`, `idx_jobs_domain`) and performs dialect table maintenance.
- **`FinalPipelineOptimizer` (`data_pipeline/production/final_optimizer.py`)**: Downcasts integer/float types and converts low-cardinality strings to categories.

---

## 10. Parallel Processing
Provided by `ParallelProcessor` (`data_pipeline/optimization/parallel_processor.py`):
- `parallel_apply()`: Concurrent chunk processing via `ThreadPoolExecutor` / `ProcessPoolExecutor`.
- `process_batch()`: Batch processing and result flattening.
- `parallel_read()`: Concurrent CSV/Parquet file reading.

---

## 11. Cache Management
Managed by `CacheManager` (`data_pipeline/optimization/cache_manager.py`):
- Thread-safe TTL cache supporting get/set/invalidate operations and hit/miss statistics.

---

## 12. Data Partitioning
Managed by `DataPartitioner` (`data_pipeline/partitioning/data_partitioner.py`):
- Partitions DataFrames into year/month Parquet directory structures (`data/partitions/year=YYYY/month=MM/`).

---

## 13. Fault Tolerance
Implemented in `FaultTolerance` (`data_pipeline/resilience/fault_tolerance.py`):
- Prevents system crashes from transient network, database, or API failures.

---

## 14. Retry Mechanism
`@retry(max_retries=3, delay=5.0, backoff=1.0)` transparently retries failed operations.

---

## 15. Circuit Breaker
Stateful `CircuitBreaker` (`CLOSED`, `OPEN`, `HALF-OPEN`) rejects calls when failure threshold is reached until timeout expires.

---

## 16. Backup & Recovery
Managed by `DataRecovery` (`data_pipeline/resilience/data_recovery.py`):
- Creates timestamped `.bak` files in `data/backup/`, restores backups, lists inventories, and cleans old backups safely.

---

## 17. Production Health Checks
Managed by `PipelineHealthCheck` (`data_pipeline/production/health_checks.py`):
- `check_database()`: SQLite/Postgres connectivity test.
- `check_redis()`: Ping test if configured.
- `check_system_resources()`: CPU, memory, disk usage via `psutil`.

---

## 18. Flask REST API Endpoints
All endpoints registered under `/api/v1/pipeline/*`:
- `/status`, `/quality`, `/alerts`, `/etl/trigger`, `/etl/status`, `/validate`, `/optimization/status`, `/cache/stats`
- `/query/analysis`, `/query/stats`, `/quality/run`, `/quality/summary`, `/anomalies`
- `/test/retry`, `/test/circuit`, `/backup/create`, `/backup/list`
- `/optimize`, `/health`, `/cleanup/run`

---

## 19. Testing & Quality Assurance
- **Unit Tests**: `test_data_pipeline.py`, `test_week21_23.py`, `test_week25_27.py`, `test_week29_30.py`
- **Integration Tests**: `test_pipeline_system.py`, `test_pipeline_api.py`, `test_final_pipeline.py`, `test_pipeline_end_to_end.py`

---

## 20. Deployment Automation
- `scripts/deploy_pipeline.sh`, `scripts/deploy_pipeline_final.sh`, `scripts/final_deploy_pipeline.sh`.
- Automated test validation, Docker image build, configurable registry tagging (`$REGISTRY`), and health checks.

---

## 21. Maintenance Schedule
- **Daily**: Review `/api/v1/pipeline/status` and `/api/v1/pipeline/alerts`.
- **Weekly**: Run `PipelineCleanup().run_cleanup()` for log retention.
- **Monthly**: Run `QueryOptimizer().create_indexes()` and data partitioning.

---

## 22. Troubleshooting
- **Missing Columns Error**: `clean_student_data` and `clean_job_data` include default fallbacks for missing columns.
- **Circuit Breaker Open**: Reset via `fault_tolerance.circuit_breaker().reset()`.
- **SQLite Locking**: Managed via SQLAlchemy thread connections.

---

## 23. Handover & Sign-off
- Repository: `https://github.com/suhasnr733-design/academic-to-industry-transition.git`
- Branch: `feature/data-pipeline`
