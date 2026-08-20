# tests/integration/test_pipeline_end_to_end.py

import os
import pytest
import pandas as pd

from data_pipeline.pipeline_orchestrator import PipelineOrchestrator
from data_pipeline.production.health_checks import health_check
from data_pipeline.production.final_optimizer import final_optimizer
from data_pipeline.resilience.data_recovery import DataRecovery


class TestPipelineEndToEnd:
    """End-to-end integration tests for complete data pipeline execution, health, optimization, and recovery."""

    def test_full_pipeline_orchestration(self):
        """Test full pipeline orchestrator execution."""
        orchestrator = PipelineOrchestrator()
        result = orchestrator.run_full_pipeline()

        assert isinstance(result, dict)
        assert result.get("status") in ["success", "partial_success"]

    def test_pipeline_health_report_structure(self):
        """Test pipeline health check report generation and structure."""
        report = health_check.get_full_health_report()

        assert isinstance(report, dict)
        assert report.get("status") in ["healthy", "warning", "unhealthy"]
        assert "database" in report
        assert "redis" in report
        assert "resources" in report
        assert "timestamp" in report

    def test_data_optimization_end_to_end(self):
        """Test DataFrame memory optimization end-to-end."""
        df = pd.DataFrame({
            "title": ["Software Engineer"] * 100 + ["Data Analyst"] * 100,
            "company": ["TechCorp"] * 100 + ["DataInc"] * 100,
            "skills": [["Python", "SQL"]] * 200,
            "int_val": [10] * 200,
            "float_val": [10.5] * 200
        })

        opt_df = final_optimizer.optimize_dataframe(df)
        assert len(opt_df) == 200
        assert "title" in opt_df.columns
        assert "company" in opt_df.columns

        report = final_optimizer.get_optimization_report(df)
        assert "memory_before_mb" in report
        assert "memory_after_mb" in report
        assert "reduction_percentage" in report

    def test_backup_and_restore_end_to_end(self, tmp_path):
        """Test dataset backup, file deletion, and restoration flow using pytest tmp_path."""
        recovery = DataRecovery(backup_dir=str(tmp_path / "backups"))

        # Step 1: Create a temporary test dataset file
        dataset_file = tmp_path / "e2e_dataset.csv"
        dataset_file.write_text("id,job_title,salary\n1,Backend Developer,90000\n2,Frontend Developer,85000\n")
        assert os.path.exists(dataset_file)

        # Step 2: Backup dataset
        backup_path = recovery.create_backup(str(dataset_file))
        assert backup_path is not None
        assert os.path.exists(backup_path)

        # Step 3: Remove original dataset
        os.remove(dataset_file)
        assert not os.path.exists(dataset_file)

        # Step 4: Restore from backup
        restore_res = recovery.restore_backup(backup_path, str(dataset_file))
        assert restore_res["success"] is True
        assert os.path.exists(dataset_file)
        assert dataset_file.read_text() == "id,job_title,salary\n1,Backend Developer,90000\n2,Frontend Developer,85000\n"

        # Step 5: Clean up temporary backup
        clean_res = recovery.cleanup_backups(keep=0)
        assert clean_res["removed_count"] >= 1
