# backend/app/services/ab_testing.py

import hashlib
import random
from datetime import datetime
from typing import Dict, Any, List
import json
from app.extensions import db
from app.models import ABTest, ABTestVariant

class ABTestingService:
    """A/B testing framework for ML models"""
    
    def __init__(self):
        self.tests = {}
        self.load_active_tests()
    
    def load_active_tests(self):
        """Load active A/B tests"""
        try:
            tests = ABTest.query.filter_by(is_active=True).all()
            for test in tests:
                self.tests[test.name] = {
                    'id': test.id,
                    'name': test.name,
                    'variants': [v.to_dict() for v in test.variants]
                }
        except Exception:
            pass
    
    def get_variant(self, test_name: str, user_id: str) -> Dict[str, Any]:
        """Get variant for a user"""
        test = self.tests.get(test_name)
        if not test:
            return {'name': 'control', 'weight': 50, 'config': {'model': 'v1'}}
        
        # Determine variant using hash
        hash_val = int(hashlib.md5(f"{user_id}:{test_name}".encode()).hexdigest(), 16)
        bucket = hash_val % 100
        
        cumulative = 0
        for variant in test['variants']:
            cumulative += variant.get('weight', 50)
            if bucket < cumulative:
                return variant
        
        return test['variants'][0]
    
    def log_experiment(self, test_name: str, user_id: str, variant: str, 
                      outcome: Dict[str, Any]):
        """Log experiment outcome"""
        experiment_log = {
            'test_name': test_name,
            'user_id': user_id,
            'variant': variant,
            'outcome': outcome,
            'timestamp': datetime.now().isoformat()
        }
        
        # Store in Redis
        from app.extensions import redis_client
        if redis_client:
            key = f"experiments:{test_name}"
            redis_client.lpush(key, json.dumps(experiment_log))
            redis_client.ltrim(key, 0, 9999)
    
    def get_experiment_results(self, test_name: str) -> Dict[str, Any]:
        """Get results for an experiment"""
        from app.extensions import redis_client
        
        results = {
            'test_name': test_name,
            'variants': {},
            'total_users': 0,
            'conversion_rates': {}
        }
        
        if not redis_client:
            return {'error': 'Redis not available'}
        
        # Get logs
        key = f"experiments:{test_name}"
        logs = redis_client.lrange(key, 0, -1)
        
        if not logs:
            return {'error': 'No data for this experiment'}
        
        # Parse logs
        parsed_logs = [json.loads(log) for log in logs]
        
        # Aggregate by variant
        for log in parsed_logs:
            variant = log['variant']
            if variant not in results['variants']:
                results['variants'][variant] = {
                    'count': 0,
                    'success_count': 0,
                    'success_rate': 0,
                    'metric_sum': 0
                }
            
            results['variants'][variant]['count'] += 1
            results['total_users'] += 1
            
            # Check for success
            outcome = log.get('outcome', {})
            if outcome.get('success', False):
                results['variants'][variant]['success_count'] += 1
        
        # Calculate rates
        for variant, data in results['variants'].items():
            if data['count'] > 0:
                data['success_rate'] = (data['success_count'] / data['count']) * 100
                results['conversion_rates'][variant] = data['success_rate']
        
        return results
    
    def create_test(self, name: str, variants: List[Dict], 
                   traffic_split: int = 100, duration_days: int = 7):
        """Create a new A/B test"""
        test = ABTest(
            name=name,
            traffic_split=traffic_split,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=duration_days)
        )
        db.session.add(test)
        db.session.flush()
        
        for variant_data in variants:
            variant = ABTestVariant(
                test_id=test.id,
                name=variant_data['name'],
                weight=variant_data.get('weight', 50),
                config=variant_data.get('config', {})
            )
            db.session.add(variant)
        
        db.session.commit()
        
        # Reload tests
        self.load_active_tests()
        
        return test