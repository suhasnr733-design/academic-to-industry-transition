# backend/app/services/ab_testing.py

import random
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ABTesting:
    def __init__(self):
        self.experiments = {}
    
    def create_experiment(self, name, variants, traffic_split=50):
        experiment = {
            'name': name,
            'variants': variants,
            'traffic_split': traffic_split,
            'active': True,
            'start_date': datetime.now().isoformat(),
            'results': {}
        }
        self.experiments[name] = experiment
        logger.info(f"✅ Experiment created: {name}")
        return experiment
    
    create_test = create_experiment
    
    def get_variant(self, experiment_name, user_id):
        experiment = self.experiments.get(experiment_name)
        if not experiment or not experiment['active']:
            return None
        
        # Deterministic assignment
        hash_val = hash(f"{user_id}:{experiment_name}") % 100
        if hash_val < experiment['traffic_split']:
            return experiment['variants'][0]
        return experiment['variants'][1]
    
    def track_conversion(self, experiment_name, variant, user_id):
        experiment = self.experiments.get(experiment_name)
        if not experiment:
            return
        
        if variant not in experiment['results']:
            experiment['results'][variant] = {'users': set(), 'conversions': 0}
        
        experiment['results'][variant]['users'].add(user_id)
        experiment['results'][variant]['conversions'] += 1
    
    def get_results(self, experiment_name):
        experiment = self.experiments.get(experiment_name)
        if not experiment:
            return None
        
        results = {}
        for variant, data in experiment['results'].items():
            users = len(data['users'])
            results[variant] = {
                'users': users,
                'conversions': data['conversions'],
                'conversion_rate': (data['conversions'] / users) * 100 if users > 0 else 0
            }
        return results

ab_testing = ABTesting()
ABTestingService = ABTesting