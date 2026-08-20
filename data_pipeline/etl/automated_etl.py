# data_pipeline/etl/automated_etl.py

from datetime import datetime
import logging
import threading
import time
from typing import Dict, Any, Optional

import schedule

from data_pipeline.pipeline_orchestrator import PipelineOrchestrator
from data_pipeline.monitoring.pipeline_monitor import pipeline_monitor, PipelineMonitor

logger = logging.getLogger(__name__)


class AutomatedETL:
    """Automates and schedules incremental and full ETL pipeline runs."""

    def __init__(
        self,
        orchestrator: Optional[PipelineOrchestrator] = None,
        monitor: Optional[PipelineMonitor] = None
    ):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.orchestrator = orchestrator or PipelineOrchestrator()
        self.monitor = monitor or pipeline_monitor
        self.is_running = False
        self._scheduler_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self.last_execution_info: Dict[str, Any] = {}

    def run_etl(self) -> Dict[str, Any]:
        """
        Execute an incremental ETL run.

        Returns:
            dict: Execution summary.
        """
        self.logger.info("Executing incremental ETL pipeline...")
        start_time = datetime.now()
        status = "failed"
        records_processed = 0

        try:
            # Incremental collection and processing
            raw_data = self.orchestrator.collector.collect_all()
            cleaned_data = {}
            for key, df in raw_data.items():
                if key == 'jobs':
                    cleaned_data[key] = self.orchestrator.cleaner.clean_job_data(df)
                elif key == 'courses':
                    cleaned_data[key] = self.orchestrator.cleaner.clean_course_data(df)
                elif key == 'students':
                    cleaned_data[key] = self.orchestrator.cleaner.clean_student_data(df)
                records_processed += len(cleaned_data.get(key, []))

            # Validate and load
            self.orchestrator.loader.create_tables()
            for key, df in cleaned_data.items():
                if key == 'jobs':
                    self.orchestrator.loader.load_jobs(df)
                elif key == 'courses':
                    self.orchestrator.loader.load_courses(df)
                elif key == 'students':
                    self.orchestrator.loader.load_students(df)

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            status = "success"

            summary = {
                "pipeline_type": "incremental",
                "status": status,
                "duration_seconds": duration,
                "records_processed": records_processed,
                "timestamp": end_time.isoformat()
            }
            self.monitor.log_execution("incremental_etl", duration, status, records_processed)
            self.last_execution_info = summary
            self.logger.info(f"Incremental ETL finished cleanly in {duration:.2f}s.")
            return summary

        except Exception as e:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            self.logger.error(f"Incremental ETL failed: {e}")
            summary = {
                "pipeline_type": "incremental",
                "status": "failed",
                "error": str(e),
                "duration_seconds": duration,
                "records_processed": records_processed,
                "timestamp": end_time.isoformat()
            }
            self.monitor.log_execution("incremental_etl", duration, "failed", records_processed)
            self.last_execution_info = summary
            return summary

    def run_full_pipeline(self) -> Dict[str, Any]:
        """
        Execute full pipeline run via PipelineOrchestrator.

        Returns:
            dict: Execution summary.
        """
        self.logger.info("Executing full ETL pipeline...")
        start_time = datetime.now()

        try:
            summary = self.orchestrator.run_full_pipeline()
            end_time = datetime.now()
            duration = summary.get("duration_seconds", (end_time - start_time).total_seconds())
            status = summary.get("status", "success")

            stats = summary.get("stats", {})
            loaded_counts = stats.get("loaded_counts", {})
            records_processed = sum(loaded_counts.values()) if loaded_counts else 0

            self.monitor.log_execution("full_pipeline", duration, status, records_processed)
            self.last_execution_info = summary
            self.logger.info(f"Full ETL pipeline finished with status: '{status}' in {duration:.2f}s.")
            return summary

        except Exception as e:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            self.logger.error(f"Full ETL pipeline failed: {e}")
            summary = {
                "pipeline_type": "full",
                "status": "failed",
                "error": str(e),
                "duration_seconds": duration,
                "timestamp": end_time.isoformat()
            }
            self.monitor.log_execution("full_pipeline", duration, "failed", 0)
            self.last_execution_info = summary
            return summary

    def _run_scheduler_loop(self):
        """Internal worker loop executing schedule jobs in background."""
        while not self._stop_event.is_set():
            schedule.run_pending()
            time.sleep(1)

    def start(self) -> None:
        """Configure scheduling and start background scheduler thread."""
        if self.is_running:
            self.logger.warning("AutomatedETL scheduler is already running.")
            return

        self._stop_event.clear()
        schedule.clear("automated_etl")

        # Schedule incremental ETL every hour
        schedule.every().hour.do(self.run_etl).tag("automated_etl")
        # Schedule full pipeline daily at 00:00
        schedule.every().day.at("00:00").do(self.run_full_pipeline).tag("automated_etl")

        self.is_running = True
        self._scheduler_thread = threading.Thread(
            target=self._run_scheduler_loop,
            name="AutomatedETL_Scheduler",
            daemon=True
        )
        self._scheduler_thread.start()
        self.logger.info("AutomatedETL background scheduler started.")

    def stop(self) -> None:
        """Stop background scheduler thread and clear schedules."""
        if not self.is_running:
            return

        self._stop_event.set()
        schedule.clear("automated_etl")
        self.is_running = False

        if self._scheduler_thread and self._scheduler_thread.is_alive():
            self._scheduler_thread.join(timeout=3.0)
        self.logger.info("AutomatedETL scheduler stopped.")


etl_automation = AutomatedETL()
