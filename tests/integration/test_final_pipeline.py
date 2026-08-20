# tests/integration/test_final_pipeline.py

import os
import pytest
import pandas as pd

from data_pipeline.pipeline_orchestrator import PipelineOrchestrator
from data_pipeline.quality.automated_quality import automated_quality
from data_pipeline.quality.anomaly_detection import anomaly_detector
from data_pipeline.resilience.data_recovery import DataRecovery


class TestFinalPipelineIntegration:
    """Final integration tests for complete data pipeline, quality, anomalies, and recovery."""

    def test_pipeline_execution(self, monkeypatch, tmp_path):
        """Verify full pipeline orchestrator execution."""
        orchestrator = PipelineOrchestrator()
        result = orchestrator.run_full_pipeline()

        assert isinstance(result, dict)
        assert result.get("status") in ["success", "partial_success"]

    def test_automated_data_quality_integration(self):
        """Verify automated quality validation against sample dataset."""
        df = pd.DataFrame({
            "title": ["Senior Data Engineer", "Machine Learning Lead"],
            "company": ["TechCorp", "AI Innovations"],
            "skills": [["Python", "SQL", "Spark"], ["Python", "PyTorch", "Docker"]]
        })

        report = automated_quality.validate_dataframe(df)
        assert report["passed"] is True
        assert report["total_rows"] == 2
        assert "required_columns_check" in report["rules"]
        assert "skills_validation_check" in report["rules"]

    def test_anomaly_detection_integration(self):
        """Verify anomaly detector detects numeric outliers correctly."""
        df = pd.DataFrame({
            "salary": [70000, 72000, 71000, 73000, 70500, 5000000, 71500],
            "experience": [3, 4, 3, 5, 4, 25, 3]
        })

        anom_res = anomaly_detector.detect_anomalies(df, columns=["salary", "experience"])
        assert anom_res["total_rows"] == 7
        assert "anomaly_count" in anom_res

        outlier_res = anomaly_detector.detect_outliers(df, "salary")
        assert outlier_res["outlier_count"] >= 1

    def test_backup_and_restore_integration(self, tmp_path):
        """Verify backup creation, file deletion, and backup restoration flow."""
        recovery = DataRecovery(backup_dir=str(tmp_path / "backups"))

        # Step 1: Create a temporary test dataset file
        test_file = tmp_path / "test_dataset.csv"
        test_file.write_text("id,name,value\n101,Sample,42\n102,Test,99\n")
        assert os.path.exists(test_file)

        # Step 2: Create backup
        backup_path = recovery.create_backup(str(test_file))
        assert backup_path is not None
        assert os.path.exists(backup_path)

        # Step 3: Delete original file
        os.remove(test_file)
        assert not os.path.exists(test_file)

        # Step 4: Restore backup
        restore_result = recovery.restore_backup(backup_path, str(test_file))
        assert restore_result["success"] is True
        assert os.path.exists(test_file)
        assert test_file.read_text() == "id,name,value\n101,Sample,42\n102,Test,99\n"

        # Step 5: Clean up temporary backup directory
        clean_res = recovery.cleanup_backups(keep=0)
        assert clean_res["removed_count"] >= 1
