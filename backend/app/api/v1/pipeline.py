# backend/app/api/v1/pipeline.py

from flask import Blueprint, jsonify, request
import logging

from data_pipeline.monitoring.pipeline_monitor import pipeline_monitor
from data_pipeline.monitoring.quality_dashboard import quality_dashboard
from data_pipeline.monitoring.alerts import pipeline_alerts
from data_pipeline.etl.automated_etl import etl_automation
from data_pipeline.validators.auto_validator import auto_validator
from data_pipeline.optimization.performance_optimizer import performance_optimizer
from data_pipeline.optimization.cache_manager import cache_manager

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
