# backend/tests/test_security.py

import pytest
from app.services.security import SecurityService, RateLimitService
from app.services.audit import AuditService, GDPRCompliance

class TestSecurity:
    
    def test_password_validation(self):
        """Test password strength validation"""
        # Valid passwords
        valid, msg = SecurityService.validate_password_strength("TestPass123!")
        assert valid
        
        # Invalid passwords
        valid, msg = SecurityService.validate_password_strength("weak")
        assert not valid
        
        valid, msg = SecurityService.validate_password_strength("NoSpecial123")
        assert not valid
        
        print("✅ Password validation test passed")
    
    def test_email_validation(self):
        """Test email validation"""
        assert SecurityService.validate_email("test@example.com")
        assert not SecurityService.validate_email("invalid-email")
        assert not SecurityService.validate_email("test@.com")
        print("✅ Email validation test passed")
    
    def test_input_sanitization(self):
        """Test input sanitization"""
        malicious = "<script>alert('xss')</script>Hello"
        sanitized = SecurityService.sanitize_input(malicious)
        assert "<script>" not in sanitized
        print("✅ Input sanitization test passed")
    
    def test_otp_generation(self):
        """Test OTP generation"""
        otp = SecurityService.generate_otp()
        assert len(otp) == 6
        assert otp.isdigit()
        print("✅ OTP generation test passed")
    
    def test_rate_limiting(self):
        """Test rate limiting"""
        from app.extensions import redis_client
        
        if redis_client:
            key = "test_rate_limit"
            
            # First 100 should pass
            for i in range(100):
                allowed, _ = RateLimitService.check_rate_limit(key, limit=100)
                assert allowed
            
            # 101st should fail
            allowed, _ = RateLimitService.check_rate_limit(key, limit=100)
            assert not allowed
            print("✅ Rate limiting test passed")
        else:
            print("⚠️ Redis not available, skipping rate limit test")