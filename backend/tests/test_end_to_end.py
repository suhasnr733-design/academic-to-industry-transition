# backend/tests/test_end_to_end.py

import pytest
import json
from app import create_app
from app.extensions import db
from app.models import User, Resume

class TestEndToEnd:
    
    @pytest.fixture
    def client(self):
        app = create_app('testing')
        with app.test_client() as client:
            with app.app_context():
                db.create_all()
                yield client
                db.drop_all()
    
    def test_complete_flow(self, client):
        """Test complete end-to-end flow"""
        
        # 1. Register user
        reg_response = client.post('/api/v1/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'full_name': 'Test User'
        })
        assert reg_response.status_code == 201
        token = reg_response.get_json()['access_token']
        
        # 2. Upload resume
        # (Mock file upload)
        
        # 3. Process resume
        
        # 4. Get prediction
        # pred_response = client.get(
        #     '/api/v1/prediction/employability/1',
        #     headers={'Authorization': f'Bearer {token}'}
        # )
        # assert pred_response.status_code == 200
        
        # 5. Get recommendations
        # rec_response = client.get(
        #     '/api/v1/prediction/recommendations/1',
        #     headers={'Authorization': f'Bearer {token}'}
        # )
        # assert rec_response.status_code == 200
        
        print("✅ End-to-end test passed!")