# data_pipeline/tests/test_week21_23.py

import os
import shutil
import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from data_pipeline.monitoring.pipeline_monitor import PipelineMonitor
from data_pipeline.monitoring.quality_dashboard import QualityDashboard
from data_pipeline.monitoring.alerts import PipelineAlerts
from data_pipeline.etl.automated_etl import AutomatedETL
from data_pipeline.validators.auto_validator import AutoValidator
from data_pipeline.optimization.performance_optimizer import PerformanceOptimizer
from data_pipeline.optimization.cache_manager import CacheManager
from data_pipeline.partitioning.data_partitioner import DataPartitioner


class TestWeek21MonitoringAndAlerts:

    def test_pipeline_monitor_execution_logging(self):
        monitor = PipelineMonitor(db_loader=None)
        
        # Log successful execution
        rec1 = monitor.log_execution("test_pipeline", 12.5, "success", 100)
        assert rec1["status"] == "success"
        assert rec1["duration_seconds"] == 12.5
        assert rec1["records_processed"] == 100

        # Log failed execution
        rec2 = monitor.log_execution("test_pipeline", 5.0, "failed", 0)
        assert rec2["status"] == "failed"

        # Calculate metrics
        metrics = monitor.get_metrics(hours=24)
        assert metrics["total_executions"] == 2
        assert metrics["successful"] == 1
        assert metrics["failed"] == 1
        assert metrics["success_rate"] == 50.0
        assert metrics["avg_duration_seconds"] == 8.75
        assert metrics["max_duration_seconds"] == 12.5
        assert metrics["min_duration_seconds"] == 5.0

    def test_pipeline_monitor_daily_trend(self):
        monitor = PipelineMonitor(db_loader=None)
        monitor.log_execution("job_a", 10.0, "success", 50)
        monitor.log_execution("job_b", 15.0, "failed", 0)

        trend = monitor.get_daily_trend(days=7)
        assert len(trend) == 7
        today_str = datetime.now().strftime("%Y-%m-%d")
        today_data = next((t for t in trend if t["date"] == today_str), None)
        assert today_data is not None
        assert today_data["total"] == 2
        assert today_data["success"] == 1
        assert today_data["success_rate"] == 50.0

    def test_quality_dashboard(self):
        dashboard = QualityDashboard()
        df = pd.DataFrame({
            "title": ["Software Engineer", "Data Scientist"],
            "company": ["TechCorp", "DataInc"],
            "skills": ["Python, SQL", "R, ML"]
        })

        rec = dashboard.assess_and_log(df, "jobs")
        assert rec["data_type"] == "jobs"
        assert rec["overall_score"] > 0.0
        assert rec["row_count"] == 2

        current = dashboard.get_current_quality()
        assert current["latest"] is not None
        assert "jobs" in current["by_data_type"]

        trend = dashboard.get_quality_trend(hours=24)
        assert len(trend) == 1

        summary = dashboard.get_summary()
        assert summary["total_assessments"] == 1
        assert summary["avg_overall_score"] > 0.0

    def test_pipeline_alerts(self):
        alerts_engine = PipelineAlerts()

        # Test threshold detection
        low_metrics = {
            "total_executions": 10,
            "success_rate": 80.0,          # Below 95%
            "max_duration_seconds": 400.0,  # Above 300s
            "overall_score": 0.50          # 50% < 70%
        }

        generated = alerts_engine.check_and_alert(low_metrics)
        assert len(generated) >= 3

        retrieved = alerts_engine.get_alerts(hours=24)
        assert len(retrieved) >= 3

        # Test clearing alerts
        alerts_engine.clear_alerts()
        assert len(alerts_engine.get_alerts()) == 0


class TestWeek22AutomationAndValidation:

    def test_automated_etl_execution(self, monkeypatch):
        etl = AutomatedETL()

        # Mock collector collect_all to avoid live HTTP calls
        monkeypatch.setattr(
            etl.orchestrator.collector,
            "collect_all",
            lambda: {
                "jobs": pd.DataFrame({"title": ["Dev"], "company": ["Corp"], "skills": [["Python"]]}),
                "courses": pd.DataFrame({"title": ["Py Course"], "platform": ["Udemy"]}),
                "students": pd.DataFrame({"student_id": ["S1"], "cgpa": [8.5], "department": ["CS"], "skills": [["Python"]]})
            }
        )
        monkeypatch.setattr(etl.orchestrator.loader, "create_tables", lambda: None)
        monkeypatch.setattr(etl.orchestrator.loader, "load_jobs", lambda df: len(df))
        monkeypatch.setattr(etl.orchestrator.loader, "load_courses", lambda df: len(df))
        monkeypatch.setattr(etl.orchestrator.loader, "load_students", lambda df: len(df))

        # Test incremental run
        inc_res = etl.run_etl()
        assert inc_res["status"] == "success"
        assert inc_res["records_processed"] >= 3

        # Test full pipeline run
        full_res = etl.run_full_pipeline()
        assert full_res["status"] in ["success", "partial_success"]

    def test_automated_etl_failure_handling(self, monkeypatch):
        etl = AutomatedETL()

        def mock_failing_collect():
            raise RuntimeError("Database Connection Error")

        monkeypatch.setattr(etl.orchestrator.collector, "collect_all", mock_failing_collect)

        res = etl.run_etl()
        assert res["status"] == "failed"
        assert "Database Connection Error" in res["error"]

    def test_auto_validator(self):
        val = AutoValidator()

        # Test validation success
        good_jobs = pd.DataFrame({
            "title": ["Backend Engineer", "Frontend Engineer"],
            "company": ["Company A", "Company B"],
            "skills": [["Python", "Django"], ["React", "JS"]]
        })
        res_pass = val.validate_and_log(good_jobs, "jobs")
        assert res_pass["status"] == "PASS"

        # Test validation summary
        summary = val.get_validation_summary(hours=24)
        assert summary["total_validations"] == 1
        assert summary["passed"] == 1
        assert summary["pass_rate"] == 100.0

        # Test schema validation
        schema_dict = {
            "title": str,
            "company": str
        }
        val_schema = val.validate_schema(good_jobs, schema_dict)
        assert val_schema["valid"] == True
        assert len(val_schema["missing_columns"]) == 0

        # Test schema validation failure (missing col)
        bad_schema = {"non_existent_col": int}
        val_bad = val.validate_schema(good_jobs, bad_schema)
        assert val_bad["valid"] == False
        assert "non_existent_col" in val_bad["missing_columns"]


class TestWeek23ScalingOptimizationAndPartitioning:

    def test_performance_optimizer_parallel(self):
        optimizer = PerformanceOptimizer(max_workers=2)

        def sample_processor(chunk):
            chunk["processed"] = True
            return chunk

        data = pd.DataFrame({"id": list(range(100)), "val": np.random.randn(100)})
        result = optimizer.parallel_process(data, sample_processor, chunksize=25)

        assert len(result) == 100
        assert "processed" in result.columns
        assert result["processed"].all()

    def test_performance_optimizer_empty_data(self):
        optimizer = PerformanceOptimizer(max_workers=2)
        empty_df = pd.DataFrame()
        res_empty = optimizer.parallel_process(empty_df, lambda c: c, chunksize=10)
        assert res_empty.empty

    def test_performance_optimizer_batch_process(self):
        optimizer = PerformanceOptimizer()
        items = list(range(25))
        batches = list(optimizer.batch_process(items, batch_size=10))

        assert len(batches) == 3
        assert len(batches[0]) == 10
        assert len(batches[1]) == 10
        assert len(batches[2]) == 5  # Final partial batch

    def test_performance_optimizer_query(self):
        optimizer = PerformanceOptimizer()
        raw_sql = " SELECT *  FROM jobs  WHERE  title = 'Engineer' "
        opt_sql = optimizer.optimize_query(raw_sql, index_columns=["title"])
        assert opt_sql == "SELECT * FROM jobs WHERE title = 'Engineer'"

    def test_data_partitioner(self, tmp_path):
        part_dir = str(tmp_path / "partitions")
        partitioner = DataPartitioner(base_path=part_dir)

        data = pd.DataFrame({
            "posted_date": ["2026-08-15", "2026-08-20", "2026-07-01", "invalid-date"],
            "title": ["Job1", "Job2", "Job3", "Job4"]
        })

        # Test partition by date
        partitions = partitioner.partition_by_date(data, date_column="posted_date")
        assert "2026/08" in partitions
        assert "2026/07" in partitions

        # Test save partitions
        saved_paths = partitioner.save_partitions(partitions, prefix="jobs")
        assert len(saved_paths) >= 2
        for path in saved_paths:
            assert os.path.exists(path)

        # Test load partition
        loaded_df = partitioner.load_partition(saved_paths[0])
        assert not loaded_df.empty
        assert "title" in loaded_df.columns

    def test_cache_manager(self):
        cache = CacheManager()
        cache.set("key1", {"data": 123}, ttl_seconds=60)

        val = cache.get("key1")
        assert val == {"data": 123}

        stats = cache.get_stats()
        assert stats["hits"] == 1
        assert stats["total_items"] == 1

        cache.clear()
        assert cache.get("key1") is None
