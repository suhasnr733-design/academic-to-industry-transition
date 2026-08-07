# data_pipeline/mlflow/tracking.py

import mlflow
import mlflow.sklearn
from mlflow.tracking import MlflowClient
import pandas as pd
import numpy as np
from datetime import datetime
import json
import logging
import os

logger = logging.getLogger(__name__)

class MLflowTracker:
    """MLflow tracking and model management"""
    
    def __init__(self, tracking_uri='http://localhost:5000'):
        mlflow.set_tracking_uri(tracking_uri)
        self.client = MlflowClient(tracking_uri)
        self.experiment_name = 'employability_prediction'
        self.setup_experiment()
    
    def setup_experiment(self):
        """Setup MLflow experiment"""
        try:
            experiment = self.client.get_experiment_by_name(self.experiment_name)
            if not experiment:
                experiment_id = mlflow.create_experiment(
                    self.experiment_name,
                    artifact_location='s3://mlflow-artifacts/'
                )
            else:
                experiment_id = experiment.experiment_id
            mlflow.set_experiment(self.experiment_name)
            logger.info(f"✅ Experiment {self.experiment_name} ready")
        except Exception as e:
            logger.error(f"Error setting up experiment: {e}")
    
    def log_model(self, model, model_name: str, metrics: Dict, params: Dict, 
                  artifacts: Dict = None):
        """Log a model with MLflow"""
        with mlflow.start_run(run_name=model_name) as run:
            # Log metrics
            for key, value in metrics.items():
                mlflow.log_metric(key, value)
            
            # Log parameters
            for key, value in params.items():
                mlflow.log_param(key, value)
            
            # Log model
            mlflow.sklearn.log_model(model, model_name)
            
            # Log artifacts
            if artifacts:
                for name, path in artifacts.items():
                    mlflow.log_artifact(path, artifact_path=name)
            
            # Log model signature
            input_example = params.get('input_example')
            if input_example:
                mlflow.log_input(input_example, context='training')
            
            logger.info(f"✅ Model {model_name} logged with run ID: {run.info.run_id}")
            return run.info.run_id
    
    def get_best_model(self, metric='accuracy'):
        """Get the best model from experiments"""
        try:
            runs = self.client.search_runs(
                experiment_ids=[self.get_experiment_id()],
                order_by=[f"metrics.{metric} DESC"],
                max_results=1
            )
            
            if runs:
                best_run = runs[0]
                model_uri = f"runs:/{best_run.info.run_id}/model"
                return mlflow.sklearn.load_model(model_uri)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting best model: {e}")
            return None
    
    def get_experiment_id(self):
        """Get experiment ID"""
        experiment = self.client.get_experiment_by_name(self.experiment_name)
        return experiment.experiment_id if experiment else None
    
    def list_runs(self) -> pd.DataFrame:
        """List all runs in experiment"""
        try:
            runs = self.client.search_runs(
                experiment_ids=[self.get_experiment_id()]
            )
            
            data = []
            for run in runs:
                data.append({
                    'run_id': run.info.run_id,
                    'run_name': run.info.run_name,
                    'status': run.info.status,
                    'start_time': run.info.start_time,
                    'metrics': run.data.metrics,
                    'params': run.data.params
                })
            
            return pd.DataFrame(data)
            
        except Exception as e:
            logger.error(f"Error listing runs: {e}")
            return pd.DataFrame()
    
    def compare_models(self, run_ids: List[str]) -> Dict[str, Any]:
        """Compare multiple models"""
        comparison = {}
        
        for run_id in run_ids:
            try:
                run = self.client.get_run(run_id)
                comparison[run_id] = {
                    'run_name': run.info.run_name,
                    'metrics': run.data.metrics,
                    'params': run.data.params,
                    'status': run.info.status
                }
            except Exception as e:
                logger.error(f"Error getting run {run_id}: {e}")
        
        return comparison
    
    def deploy_model(self, model_name: str, version: str = 'latest'):
        """Deploy a model version"""
        try:
            if version == 'latest':
                # Get latest version
                versions = self.client.search_model_versions(f"name='{model_name}'")
                if not versions:
                    return {'error': f'No versions found for {model_name}'}
                version = versions[-1].version
            
            # Register model version
            self.client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage='Production'
            )
            
            logger.info(f"✅ Model {model_name} version {version} deployed to Production")
            return {'status': 'success', 'version': version}
            
        except Exception as e:
            logger.error(f"Error deploying model: {e}")
            return {'status': 'failed', 'error': str(e)}