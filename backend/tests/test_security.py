# backend/tests/test_security.py

import pytest
from app import create_app
from app.services.security import SecurityService
from app.services.audit_log import AuditLogger

class TestSecurity:
    
    def test_password_validation(self):
        """Test password strength validation"""
        valid, msg = SecurityService.validate_password_strength("TestPass123!")
        assert valid
        
        valid, msg = SecurityService.validate_password_strength("weak")
        assert not valid
    
    def test_input_sanitization(self):
        """Test input sanitization"""
        malicious = "<script>alert('xss')</script>Hello"
        sanitized = SecurityService.sanitize_input(malicious)
        assert "<script>" not in sanitized
    
    def test_email_validation(self):
        """Test email validation"""
        assert SecurityService.validate_email("test@example.com")
        assert not SecurityService.validate_email("invalid-email")
    
    def test_rate_limiting(self):
        """Test rate limiting"""
        from app.extensions import redis_client
        
        if redis_client:
            key = "test_rate_limit"
            
            # First 100 should pass
            for i in range(100):
                assert RateLimitService.check_rate_limit(key, limit=100) == True
            
            # 101st should fail
            assert RateLimitService.check_rate_limit(key, limit=100) == False