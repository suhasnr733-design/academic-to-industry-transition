# backend/tests/test_ab_testing.py

import pytest
from app.services.ab_testing import ABTestingService
from app.services.feature_store import FeatureStore

class TestABTesting:
    
    @pytest.fixture
    def ab_service(self):
        return ABTestingService()
    
    @pytest.fixture
    def feature_store(self):
        return FeatureStore()
    
    def test_variant_assignment(self, ab_service):
        """Test A/B variant assignment"""
        # Create test first
        variants = [
            {'name': 'control', 'weight': 50, 'config': {'model': 'v1'}},
            {'name': 'treatment', 'weight': 50, 'config': {'model': 'v2'}}
        ]
        # ab_service.create_test('test_model', variants)
        
        variant = ab_service.get_variant('test_model', 'user123')
        assert variant is not None
        print(f"Variant assigned: {variant}")
    
    def test_feature_computation(self, feature_store):
        """Test feature computation"""
        student_data = {
            'cgpa': 8.5,
            'skill_count': 10,
            'skill_diversity': 8,
            'internship_months': 6,
            'projects': 4,
            'certifications': 3,
            'workshops': 5
        }
        
        features = feature_store.compute_features(student_data)
        assert 'total_experience' in features
        assert features['total_experience'] == 14
        print(f"Computed features: {features}")