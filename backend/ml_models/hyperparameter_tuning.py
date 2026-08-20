# backend/ml_models/hyperparameter_tuning.py

from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
import joblib
import numpy as np
import logging

logger = logging.getLogger(__name__)

class HyperparameterTuner:
    def __init__(self):
        self.models = {
            'random_forest': RandomForestClassifier(random_state=42),
            'gradient_boosting': GradientBoostingClassifier(random_state=42),
            'xgboost': XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss')
        }
        
        self.param_grids = {
            'random_forest': {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 20, 30],
                'min_samples_split': [2, 5, 10]
            },
            'gradient_boosting': {
                'n_estimators': [100, 200],
                'learning_rate': [0.01, 0.1],
                'max_depth': [3, 5]
            },
            'xgboost': {
                'n_estimators': [100, 200],
                'learning_rate': [0.01, 0.1],
                'max_depth': [3, 5],
                'subsample': [0.8, 1.0]
            }
        }
    
    def tune_model(self, X_train, y_train, model_name='random_forest'):
        if model_name not in self.models:
            return {'error': f'Model {model_name} not found'}
        
        model = self.models[model_name]
        param_grid = self.param_grids[model_name]
        
        grid_search = GridSearchCV(
            model,
            param_grid,
            cv=5,
            scoring='f1',
            n_jobs=-1,
            verbose=1
        )
        
        grid_search.fit(X_train, y_train)
        
        logger.info(f"Best parameters for {model_name}: {grid_search.best_params_}")
        logger.info(f"Best score: {grid_search.best_score_:.4f}")
        
        return {
            'model_name': model_name,
            'best_params': grid_search.best_params_,
            'best_score': float(grid_search.best_score_),
            'model': grid_search.best_estimator_
        }
    
    def compare_models(self, X_train, y_train):
        results = {}
        for model_name in self.models.keys():
            result = self.tune_model(X_train, y_train, model_name)
            results[model_name] = result
        
        # Find best model
        best_model = max(results.items(), key=lambda x: x[1]['best_score'])
        logger.info(f"Best model: {best_model[0]} with score {best_model[1]['best_score']:.4f}")
        
        return results

hyperparameter_tuner = HyperparameterTuner()
