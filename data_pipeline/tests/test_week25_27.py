# data_pipeline/tests/test_week25_27.py

import os
import time
import pytest
import pandas as pd
import numpy as np

from data_pipeline.optimization.query_optimizer import QueryOptimizer
from data_pipeline.optimization.parallel_processor import ParallelProcessor
from data_pipeline.quality.automated_quality import AutomatedQuality
from data_pipeline.quality.anomaly_detection import AnomalyDetector
from data_pipeline.resilience.fault_tolerance import FaultTolerance, CircuitBreakerError
from data_pipeline.resilience.data_recovery import DataRecovery


class TestWeek25Optimization:

    def test_query_optimizer_stats_and_indexes(self):
        optimizer = QueryOptimizer()
        stats = optimizer.get_query_stats()
        assert "status" in stats

        idx_res = optimizer.create_indexes()
        assert idx_res["status"] == "success"
        assert "created_indexes" in idx_res

        slow_queries = optimizer.analyze_slow_queries()
        assert "dialect" in slow_queries

        opt_res = optimizer.optimize_table("jobs")
        assert "status" in opt_res

    def test_parallel_processor_apply(self):
        processor = ParallelProcessor(max_workers=2)
        df = pd.DataFrame({"value": range(100)})

        def _double(chunk):
            chunk = chunk.copy()
            chunk["value"] = chunk["value"] * 2
            return chunk

        res_thread = processor.parallel_apply(df, _double, chunksize=25, use_processes=False)
        assert len(res_df := res_thread) == 100
        assert res_df["value"].sum() == sum(range(100)) * 2

        res_empty = processor.parallel_apply(pd.DataFrame(), _double)
        assert res_empty.empty

    def test_parallel_processor_batch_and_read(self, tmp_path):
        processor = ParallelProcessor(max_workers=2)

        items = list(range(50))
        def _batch_fn(batch):
            return [x * 10 for x in batch]

        res_batch = processor.process_batch(items, _batch_fn, batch_size=10)
        assert len(res_batch) == 50
        assert res_batch[0] == 0
        assert res_batch[-1] == 490

        f1 = tmp_path / "data1.csv"
        f2 = tmp_path / "data2.csv"
        pd.DataFrame({"a": [1, 2]}).to_csv(f1, index=False)
        pd.DataFrame({"a": [3, 4]}).to_csv(f2, index=False)

        combined = processor.parallel_read([str(f1), str(f2)])
        assert len(combined) == 4
        assert sorted(combined["a"]) == [1, 2, 3, 4]



class TestWeek26QualityAndAnomalies:

    def test_automated_quality_validation(self):
        aq = AutomatedQuality()
        df_good = pd.DataFrame({
            "title": ["Engineer", "Scientist"],
            "company": ["TechCorp", "DataInc"],
            "skills": [["Python", "SQL"], ["ML", "Python"]]
        })

        res_good = aq.validate_dataframe(df_good)
        assert res_good["passed"] is True
        assert res_good["total_rows"] == 2

        df_bad = pd.DataFrame({
            "title": [None, "Scientist"],
            "company": ["TechCorp", None],
            "skills": [[], None]
        })
        res_bad = aq.validate_dataframe(df_bad)
        assert res_bad["passed"] is False

        summary = aq.get_quality_summary(hours=24)
        assert summary["total_checks"] >= 2
        assert "pass_rate" in summary

    def test_automated_quality_rule_exception(self):
        aq = AutomatedQuality()

        def _buggy_rule(df):
            raise ValueError("Bug in custom rule")

        aq.add_rule("buggy_rule", _buggy_rule)
        df = pd.DataFrame({"title": ["Software Engineer"], "company": ["Google"]})
        res = aq.validate_dataframe(df)

        assert res["passed"] is False
        assert "buggy_rule" in res["rules"]
        assert res["rules"]["buggy_rule"]["passed"] is False

    def test_anomaly_detector(self):
        ad = AnomalyDetector()
        df = pd.DataFrame({
            "val1": [10.0, 10.2, 10.1, 10.3, 1000.0, 10.0, 10.1],
            "val2": [1.0, 1.1, 1.0, 1.2, 50.0, 1.1, 1.0]
        })

        anom_res = ad.detect_anomalies(df)
        assert anom_res["total_rows"] == 7
        assert "anomaly_count" in anom_res
        assert "anomalies" in anom_res

        outlier_res = ad.detect_outliers(df, "val1")
        assert outlier_res["outlier_count"] >= 1
        assert outlier_res["column"] == "val1"

    def test_anomaly_detector_edge_cases(self):
        ad = AnomalyDetector()
        res_empty = ad.detect_anomalies(pd.DataFrame())
        assert res_empty["anomaly_count"] == 0

        df_zero_var = pd.DataFrame({"a": [5, 5, 5, 5]})
        res_zero = ad.detect_anomalies(df_zero_var)
        assert res_zero["anomaly_count"] == 0


class TestWeek27ResilienceAndRecovery:

    def test_fault_tolerance_retry(self):
        ft = FaultTolerance()
        calls = 0

        @ft.retry(max_retries=3, delay=0.001)
        def _flaky_fn():
            nonlocal calls
            calls += 1
            if calls < 3:
                raise RuntimeError("Transient error")
            return "success"

        result = _flaky_fn()
        assert result == "success"
        assert calls == 3

    def test_fault_tolerance_retry_failure(self):
        ft = FaultTolerance()

        @ft.retry(max_retries=2, delay=0.001)
        def _always_fails():
            raise ValueError("Persistent failure")

        with pytest.raises(ValueError, match="Persistent failure"):
            _always_fails()

    def test_circuit_breaker(self):
        ft = FaultTolerance()
        cb = ft.circuit_breaker(failure_threshold=2, timeout=0.1)

        @cb
        def _broken():
            raise RuntimeError("DB Down")

        with pytest.raises(RuntimeError):
            _broken()
        with pytest.raises(RuntimeError):
            _broken()

        # Circuit should now be OPEN
        with pytest.raises(CircuitBreakerError):
            _broken()

        time.sleep(0.15)
        # Timeout elapsed -> HALF-OPEN state allows try
        with pytest.raises(RuntimeError):
            _broken()

    def test_data_recovery_backup_and_restore(self, tmp_path):
        recovery = DataRecovery(backup_dir=str(tmp_path / "backups"))

        # Create source file
        src_file = tmp_path / "dataset.csv"
        src_file.write_text("id,val\n1,test\n2,sample\n")

        # Backup
        bak_path = recovery.create_backup(str(src_file))
        assert bak_path is not None
        assert os.path.exists(bak_path)

        # Remove source
        os.remove(src_file)
        assert not os.path.exists(src_file)

        # Restore
        rest_res = recovery.restore_backup(bak_path, str(src_file))
        assert rest_res["success"] is True
        assert os.path.exists(src_file)
        assert src_file.read_text() == "id,val\n1,test\n2,sample\n"

        # List backups
        list_res = recovery.list_backups(days=1)
        assert len(list_res) >= 1

        # Cleanup backups
        clean_res = recovery.cleanup_backups(keep=0)
        assert clean_res["removed_count"] >= 1
