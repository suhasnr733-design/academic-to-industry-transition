# tests/integration/test_pipeline_system.py

import pytest
import pandas as pd
from unittest.mock import MagicMock

from data_pipeline.pipeline_orchestrator import PipelineOrchestrator
from data_pipeline.quality.data_quality_framework import DataQualityFramework
from data_pipeline.monitoring.pipeline_monitor import PipelineMonitor
from data_pipeline.monitoring.quality_dashboard import QualityDashboard
from data_pipeline.monitoring.alerts import PipelineAlerts
from data_pipeline.validators.auto_validator import AutoValidator


class TestPipelineSystemIntegration:

    @pytest.fixture
    def sample_jobs_df(self):
        return pd.DataFrame({
            "title": ["Senior Data Engineer", "Machine Learning Lead", "Backend Developer"],
            "company": ["Tech Corp", "AI Solutions", "Cloud Soft"],
            "skills": [["Python", "SQL", "Spark"], ["Python", "PyTorch"], ["Node.js", "Docker"]]
        })

    def test_full_pipeline_orchestration(self, monkeypatch):
        """Test full pipeline orchestration end-to-end with mock data sources."""
        orchestrator = PipelineOrchestrator()

        # Mock collector to provide consistent local test data
        monkeypatch.setattr(
            orchestrator.collector,
            "collect_all",
            lambda: {
                "jobs": pd.DataFrame({"title": ["Test Job"], "company": ["Test Co"], "skills": [["Python"]]}),
                "courses": pd.DataFrame({"title": ["Test Course"], "platform": ["Udemy"]}),
                "students": pd.DataFrame({"student_id": ["S1"], "cgpa": [9.0], "department": ["CS"], "skills": [["Python"]]})
            }
        )

        summary = orchestrator.run_full_pipeline()
        assert "status" in summary
        assert summary["status"] in ["success", "partial_success"]
        assert "duration_seconds" in summary
        assert "stats" in summary

    def test_data_quality_framework_integration(self, sample_jobs_df):
        """Test DataQualityFramework quality assessment on sample fixture."""
        framework = DataQualityFramework()
        result = framework.assess_data_quality(sample_jobs_df, "jobs")

        assert result["data_type"] == "jobs"
        assert result["row_count"] == 3
        assert result["overall_score"] > 0.0
        assert "completeness" in result
        assert "accuracy" in result
        assert "consistency" in result

    def test_monitoring_integration(self):
        """Verify pipeline execution logging and metrics retrieval via PipelineMonitor."""
        monitor = PipelineMonitor(db_loader=None)

        # Log mock executions
        monitor.log_execution("test_system_pipeline", 15.0, "success", 150)
        monitor.log_execution("test_system_pipeline", 35.0, "partial_success", 80)

        metrics = monitor.get_metrics(hours=24)
        assert metrics["total_executions"] == 2
        assert metrics["successful"] == 2
        assert metrics["success_rate"] == 100.0
        assert metrics["avg_duration_seconds"] == 25.0

    def test_validation_integration(self, sample_jobs_df):
        """Verify automated validator integration with DataValidator."""
        auto_val = AutoValidator()

        # Test validate and log
        record = auto_val.validate_and_log(sample_jobs_df, "jobs")
        assert record["status"] == "PASS"
        assert record["total_rows"] == 3

        summary = auto_val.get_validation_summary(hours=24)
        assert summary["total_validations"] >= 1
        assert summary["passed"] >= 1

    def test_alert_integration(self):
        """Verify alerts generation when metric thresholds are breached."""
        alert_engine = PipelineAlerts(thresholds={"success_rate": 95.0, "max_duration": 10.0})

        bad_metrics = {
            "total_executions": 5,
            "success_rate": 60.0,
            "max_duration_seconds": 25.0,
            "overall_score": 0.40
        }

        generated = alert_engine.check_and_alert(bad_metrics)
        assert len(generated) >= 3

        active_alerts = alert_engine.get_alerts(hours=24)
        assert len(active_alerts) >= 3
        assert any("Success rate drop" in a["message"] for a in active_alerts)
