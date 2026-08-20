# backend/app/api/v1/pipeline.py

from flask import Blueprint, jsonify, request
import logging
import pandas as pd

from data_pipeline.monitoring.pipeline_monitor import pipeline_monitor
from data_pipeline.monitoring.quality_dashboard import quality_dashboard
from data_pipeline.monitoring.alerts import pipeline_alerts
from data_pipeline.etl.automated_etl import etl_automation
from data_pipeline.validators.auto_validator import auto_validator
from data_pipeline.optimization.performance_optimizer import performance_optimizer
from data_pipeline.optimization.cache_manager import cache_manager
from data_pipeline.optimization.query_optimizer import query_optimizer
from data_pipeline.quality.automated_quality import automated_quality
from data_pipeline.quality.anomaly_detection import anomaly_detector
from data_pipeline.resilience.fault_tolerance import fault_tolerance
from data_pipeline.resilience.data_recovery import data_recovery
from data_pipeline.production.final_optimizer import final_optimizer
from data_pipeline.production.health_checks import health_check
from scripts.cleanup_pipeline import pipeline_cleanup


logger = logging.getLogger(__name__)

pipeline_bp = Blueprint('pipeline', __name__)


@pipeline_bp.route('/status', methods=['GET'])
def get_pipeline_status():
    """Get data pipeline status and metrics for the past 24 hours."""
    try:
        hours = request.args.get('hours', default=24, type=int)
        metrics = pipeline_monitor.get_metrics(hours=hours)
        daily_trend = pipeline_monitor.get_daily_trend(days=7)
        return jsonify({
            'status': 'success',
            'metrics': metrics,
            'daily_trend': daily_trend
        }), 200
    except Exception as e:
        logger.error(f"Error fetching pipeline status: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/quality', methods=['GET'])
def get_pipeline_quality():
    """Get data quality dashboard summary and current assessment status."""
    try:
        summary = quality_dashboard.get_summary()
        current = quality_dashboard.get_current_quality()
        return jsonify({
            'status': 'success',
            'summary': summary,
            'current': current
        }), 200
    except Exception as e:
        logger.error(f"Error fetching pipeline quality: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/alerts', methods=['GET'])
def get_pipeline_alerts():
    """Get data pipeline alerts."""
    try:
        hours = request.args.get('hours', default=24, type=int)
        alerts = pipeline_alerts.get_alerts(hours=hours)
        return jsonify({
            'status': 'success',
            'alerts': alerts,
            'total_alerts': len(alerts)
        }), 200
    except Exception as e:
        logger.error(f"Error fetching pipeline alerts: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/etl/trigger', methods=['POST'])
def trigger_etl():
    """Manually trigger an ETL run ('full' or 'incremental')."""
    try:
        data = request.get_json(silent=True) or {}
        etl_type = data.get('type', 'full').lower()

        if etl_type == 'incremental':
            result = etl_automation.run_etl()
        else:
            result = etl_automation.run_full_pipeline()

        # Check thresholds on run
        pipeline_alerts.check_and_alert(result)

        return jsonify({
            'status': 'success',
            'message': f"ETL {etl_type} execution completed",
            'result': result
        }), 200
    except Exception as e:
        logger.error(f"Error triggering ETL: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/etl/status', methods=['GET'])
def get_etl_status():
    """Get automated ETL execution status and background schedule state."""
    try:
        return jsonify({
            'status': 'success',
            'is_running': etl_automation.is_running,
            'last_execution': etl_automation.last_execution_info
        }), 200
    except Exception as e:
        logger.error(f"Error fetching ETL status: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/validate', methods=['GET'])
def validate_pipeline_data():
    """Get automated validation summary."""
    try:
        hours = request.args.get('hours', default=24, type=int)
        summary = auto_validator.get_validation_summary(hours=hours)
        return jsonify({
            'status': 'success',
            'summary': summary
        }), 200
    except Exception as e:
        logger.error(f"Error fetching validation summary: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/optimization/status', methods=['GET'])
def get_optimization_status():
    """Get pipeline performance optimizer status."""
    try:
        return jsonify({
            'status': 'success',
            'max_workers': performance_optimizer.max_workers
        }), 200
    except Exception as e:
        logger.error(f"Error fetching optimization status: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/cache/stats', methods=['GET'])
def get_cache_stats():
    """Get pipeline cache manager statistics."""
    try:
        stats = cache_manager.get_stats()
        return jsonify({
            'status': 'success',
            'cache_stats': stats
        }), 200
    except Exception as e:
        logger.error(f"Error fetching cache stats: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ==========================================
# Weeks 25-28 New Pipeline API Endpoints
# ==========================================

@pipeline_bp.route('/query/analysis', methods=['GET'])
def analyze_queries():
    """Analyze slow database queries."""
    try:
        analysis = query_optimizer.analyze_slow_queries()
        return jsonify({'status': 'success', 'analysis': analysis}), 200
    except Exception as e:
        logger.error(f"Error analyzing queries: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/query/stats', methods=['GET'])
def get_query_stats():
    """Get database tables and row count statistics."""
    try:
        stats = query_optimizer.get_query_stats()
        return jsonify({'status': 'success', 'stats': stats}), 200
    except Exception as e:
        logger.error(f"Error getting query stats: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/quality/run', methods=['POST'])
def run_automated_quality():
    """Run automated quality validation against JSON dataset payload."""
    try:
        data = request.get_json(silent=True) or {}
        records = data.get('records', [])
        df = pd.DataFrame(records) if records else pd.DataFrame()
        result = automated_quality.validate_dataframe(df)
        return jsonify({'status': 'success', 'result': result}), 200
    except Exception as e:
        logger.error(f"Error running quality validation: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/quality/summary', methods=['GET'])
def get_quality_summary_api():
    """Get automated quality validation summary over past hours."""
    try:
        hours = request.args.get('hours', default=24, type=int)
        summary = automated_quality.get_quality_summary(hours=hours)
        return jsonify({'status': 'success', 'summary': summary}), 200
    except Exception as e:
        logger.error(f"Error fetching quality summary: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/anomalies', methods=['POST'])
def detect_dataset_anomalies():
    """Detect multivariate anomalies and univariate outliers in JSON dataset payload."""
    try:
        data = request.get_json(silent=True) or {}
        records = data.get('records', [])
        columns = data.get('columns', None)
        df = pd.DataFrame(records) if records else pd.DataFrame()
        anomalies = anomaly_detector.detect_anomalies(df, columns=columns)
        return jsonify({'status': 'success', 'anomalies': anomalies}), 200
    except Exception as e:
        logger.error(f"Error detecting anomalies: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/test/retry', methods=['GET'])
def test_retry_route():
    """Endpoint testing fault tolerance retry mechanism."""
    try:
        attempts = 0

        @fault_tolerance.retry(max_retries=2, delay=0.001)
        def _flaky():
            nonlocal attempts
            attempts += 1
            if attempts == 1:
                raise ValueError("Transient retry test error")
            return "recovered"

        res = _flaky()
        return jsonify({'status': 'success', 'result': res, 'attempts': attempts}), 200
    except Exception as e:
        logger.error(f"Error testing retry route: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/test/circuit', methods=['GET'])
def test_circuit_route():
    """Endpoint testing fault tolerance circuit breaker status."""
    try:
        cb = fault_tolerance.circuit_breaker(failure_threshold=3, timeout=10.0)
        return jsonify({
            'status': 'success',
            'circuit_state': cb.state,
            'failure_count': cb.failure_count
        }), 200
    except Exception as e:
        logger.error(f"Error testing circuit route: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/backup/create', methods=['POST'])
def create_backup_api():
    """Create a backup copy of a specified data file."""
    try:
        data = request.get_json(silent=True) or {}
        file_path = data.get('path', 'data/processed/industry_data.db')
        backup_path = data_recovery.create_backup(file_path)
        if backup_path:
            return jsonify({'status': 'success', 'backup_path': backup_path}), 200
        return jsonify({'status': 'error', 'message': f"Failed to create backup for '{file_path}'"}), 400
    except Exception as e:
        logger.error(f"Error creating backup API: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/backup/list', methods=['GET'])
def list_backups_api():
    """List recent data backups."""
    try:
        days = request.args.get('days', default=7, type=int)
        backups = data_recovery.list_backups(days=days)
        return jsonify({'status': 'success', 'backups': backups, 'total_backups': len(backups)}), 200
    except Exception as e:
        logger.error(f"Error listing backups API: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ==========================================
# Weeks 29-32 New Production & Health APIs
# ==========================================

@pipeline_bp.route('/optimize', methods=['POST'])
def optimize_dataframe_api():
    """Optimize DataFrame memory usage via REST API."""
    try:
        data = request.get_json(silent=True) or {}
        records = data.get('records', [])
        df = pd.DataFrame(records) if records else pd.DataFrame()
        report = final_optimizer.get_optimization_report(df)
        return jsonify({'status': 'success', 'report': report}), 200
    except Exception as e:
        logger.error(f"Error optimizing DataFrame API: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/health', methods=['GET'])
def get_pipeline_health_api():
    """Get complete pipeline, database, Redis, and resource health check report."""
    try:
        report = health_check.get_full_health_report()
        return jsonify({'status': 'success', 'health': report}), 200
    except Exception as e:
        logger.error(f"Error fetching pipeline health API: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@pipeline_bp.route('/cleanup/run', methods=['POST'])
def run_pipeline_cleanup_api():
    """Trigger log, temp file, and data organization cleanup."""
    try:
        report = pipeline_cleanup.run_cleanup()
        return jsonify({'status': 'success', 'report': report}), 200
    except Exception as e:
        logger.error(f"Error running pipeline cleanup API: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

