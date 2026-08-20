# data_pipeline/tests/test_week29_30.py

import os
import pytest
import pandas as pd

from data_pipeline.production.final_optimizer import FinalPipelineOptimizer
from data_pipeline.production.health_checks import PipelineHealthCheck
from scripts.cleanup_pipeline import PipelineCleanup


class TestWeek29ProductionOptimizationAndHealth:

    def test_final_optimizer_types(self):
        optimizer = FinalPipelineOptimizer(max_workers=2)
        df = pd.DataFrame({
            "col_int": pd.Series([1, 2, 3] * 10, dtype="int64"),
            "col_float": pd.Series([1.1, 2.2, 3.3] * 10, dtype="float64"),
            "col_cat": ["A", "B", "A"] * 10
        })


        opt = optimizer.optimize_dataframe(df)
        assert opt["col_int"].dtype in [pd.Int8Dtype(), pd.Int16Dtype(), pd.Int32Dtype(), "int8", "int16", "int32"]
        assert opt["col_float"].dtype in [pd.Float32Dtype(), "float32"]

        report = optimizer.get_optimization_report(df)
        assert "memory_before_mb" in report
        assert "reduction_percentage" in report

    def test_final_optimizer_parallel_and_empty(self):
        optimizer = FinalPipelineOptimizer(max_workers=2)
        dfs = [
            pd.DataFrame({"a": [1, 2]}),
            pd.DataFrame({"b": [3.5, 4.5]})
        ]

        res = optimizer.parallel_optimize(dfs)
        assert len(res) == 2

        empty_opt = optimizer.optimize_dataframe(pd.DataFrame())
        assert empty_opt.empty

    def test_pipeline_health_check(self):
        hc = PipelineHealthCheck()
        db = hc.check_database()
        assert "status" in db

        redis_status = hc.check_redis()
        assert "status" in redis_status

        res = hc.check_system_resources()
        assert "cpu_percent" in res

        full = hc.get_full_health_report()
        assert "status" in full
        assert "database" in full


class TestWeek30Cleanup:

    def test_pipeline_cleanup_logs_and_temp(self, tmp_path):
        cleanup = PipelineCleanup(keep_days=30)

        # Temp files test
        temp_dir = tmp_path / "temp"
        temp_dir.mkdir()
        t_file = temp_dir / "old_cache.tmp"
        t_file.write_text("temporary data")

        res_temp = cleanup.cleanup_temp_files(temp_dir=str(temp_dir))
        assert res_temp["removed_count"] == 1
        assert not os.path.exists(t_file)

        # Full run cleanup test
        full_res = cleanup.run_cleanup()
        assert "logs" in full_res
        assert "temp" in full_res
