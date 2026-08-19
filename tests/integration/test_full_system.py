# tests/integration/test_full_system.py

import pytest
import time
import pandas as pd
from data_pipeline.pipeline_orchestrator import PipelineOrchestrator
from data_pipeline.quality.data_quality_framework import DataQualityFramework
from data_pipeline.governance.data_governance import DataGovernance
from data_pipeline.analytics.realtime_analytics import RealTimeAnalytics
from data_pipeline.streaming.stream_processor import StreamProcessor


class TestFullSystem:

    def test_pipeline_execution(self):
        """Test complete data pipeline orchestrator execution"""
        orchestrator = PipelineOrchestrator()
        results = orchestrator.run_full_pipeline()
        assert results["status"] in ["success", "partial_success", "completed"]

    def test_data_quality_assessment(self):
        """Test DataQualityFramework quality assessment score"""
        quality = DataQualityFramework()
        df = pd.DataFrame([
            {"title": "Job 1", "company": "Company A", "skills": "Python"},
            {"title": "Job 2", "company": "Company B", "skills": "Java"},
            {"title": "Job 3", "company": "Company C", "skills": "SQL"},
        ])
        results = quality.assess_data_quality(df, "jobs")
        assert results["overall_score"] > 0

    def test_data_governance(self):
        """Test DataGovernance data dictionary and governance report generation"""
        gov = DataGovernance()
        df = pd.DataFrame([
            {"title": "Job 1", "company": "Company A", "skills": "Python"}
        ])
        data_dict = gov.create_data_dictionary(df, "jobs")
        report = gov.generate_governance_report()
        assert data_dict["table_name"] == "jobs"
        assert report["total_columns"] == 3

    def test_realtime_analytics_and_streaming(self):
        """Test real-time analytics event processing and stream processor lifecycle"""
        analytics = RealTimeAnalytics()
        analytics.process_event({"type": "test", "value": 1, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")})
        aggs = analytics.get_aggregations()
        assert aggs["total_events"] == 1

        sp = StreamProcessor(num_workers=2)
        sp.add_processor("test_proc", lambda x: x)
        sp.start()
        assert sp.get_status()["is_running"] is True
        sp.stop()
        assert sp.get_status()["is_running"] is False
