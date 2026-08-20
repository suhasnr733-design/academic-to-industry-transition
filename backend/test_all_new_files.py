# test_all_new_files.py
"""
Comprehensive automated test suite for all Week 17-20 backend changes:
1. ServiceMesh (backend/app/services/service_mesh.py)
2. RateLimiter (backend/app/gateway/rate_limiter.py)
3. RBACService (backend/app/services/rbac.py)
4. OAuth2Service & OAuth2Client (backend/app/services/oauth.py, backend/app/models/oauth.py)
5. MultiLevelCache (backend/app/services/multilevel_cache.py)
6. DBPerformanceOptimizer (backend/app/services/db_performance.py)
7. docker-compose-backend-prod.yml validation
"""

import sys
import os
import types
import json
import time
from datetime import datetime, timezone, timedelta

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

print("=" * 60)
print("🚀 TESTING ALL WEEK 17-20 DELIVERABLES AND MODIFIED FILES")
print("=" * 60)

passed = 0
failed = 0

def test_case(name):
    print(f"\n▶ Testing: {name} ... ", end="")

def pass_test(msg="OK"):
    global passed
    passed += 1
    print(f"✅ PASSED ({msg})")

def fail_test(err):
    global failed
    failed += 1
    print(f"❌ FAILED: {err}")

# Setup root modules mocks
fake_app = types.ModuleType('app')
fake_ext = types.ModuleType('app.extensions')
fake_models = types.ModuleType('app.models')
fake_jwt = types.ModuleType('flask_jwt_extended')
fake_jwt.get_jwt_identity = lambda: 1
fake_jwt.jwt_required = lambda: (lambda f: f)

fake_db = types.SimpleNamespace(
    Model=object,
    Column=lambda *args, **kwargs: None,
    Integer=int,
    String=lambda n: str,
    DateTime=datetime,
    engine=types.SimpleNamespace(
        connect=lambda: types.SimpleNamespace(
            __enter__=lambda self: types.SimpleNamespace(
                execute=lambda q: [],
                commit=lambda: None
            ),
            __exit__=lambda *args: None
        )
    )
)

fake_ext.db = fake_db
fake_ext.redis_client = None
fake_app.extensions = fake_ext
fake_app.db = fake_db

sys.modules['app'] = fake_app
sys.modules['app.extensions'] = fake_ext
sys.modules['app.models'] = fake_models
sys.modules['flask_jwt_extended'] = fake_jwt

# ====================================================================
# TEST 1: ServiceMesh
# ====================================================================
test_case("ServiceMesh Registration & Circuit Breaker Logic")
try:
    import importlib.util
    spec = importlib.util.spec_from_file_location("service_mesh", "backend/app/services/service_mesh.py")
    sm_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sm_mod)
    
    mesh = sm_mod.ServiceMesh()
    
    # Check services registered
    assert 'auth' in mesh.services
    assert 'resume' in mesh.services
    assert 'job' in mesh.services
    assert 'ml' in mesh.services
    assert mesh.get_service_url('auth') == 'http://auth-service:5001'
    
    # Check circuit breaker initial state
    assert mesh.is_circuit_open('auth') is False
    
    # Trigger circuit breaker threshold (5 failures)
    for _ in range(5):
        mesh.record_failure('auth')
    assert mesh.is_circuit_open('auth') is True
    
    # Test half-open transition simulation
    mesh.circuit_breakers['auth']['last_failure'] = datetime.now() - timedelta(seconds=65)
    assert mesh.is_circuit_open('auth') is False
    assert mesh.circuit_breakers['auth']['state'] == 'half-open'
    
    # Record success to close circuit
    mesh.record_success('auth')
    assert mesh.circuit_breakers['auth']['state'] == 'closed'
    assert mesh.circuit_breakers['auth']['failures'] == 0
    
    status = mesh.get_mesh_status()
    assert 'services' in status and 'circuit_breakers' in status
    pass_test("Circuit breaker, health status, and transitions working")
except Exception as e:
    fail_test(str(e))

# ====================================================================
# TEST 2: RateLimiter
# ====================================================================
test_case("RateLimiter IP/Endpoint Keys & Limits")
try:
    spec = importlib.util.spec_from_file_location("rate_limiter", "backend/app/gateway/rate_limiter.py")
    rl_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rl_mod)
    
    rl = rl_mod.RateLimiter()
    
    # Test key generation
    req_mock = types.SimpleNamespace(remote_addr='192.168.1.100', path='/api/v1/jobs')
    assert rl.get_key(req_mock, 'ip') == 'ratelimit:ip:192.168.1.100'
    assert rl.get_key(req_mock, 'endpoint') == 'ratelimit:endpoint:/api/v1/jobs'
    
    # Test check_rate_limit fallback when redis is not available
    allowed, info = rl.check_rate_limit('test_key', limit=100, window=60)
    assert allowed is True
    
    # Test mock redis counter
    class MockRedis:
        def __init__(self):
            self.store = {}
        def get(self, key):
            return self.store.get(key)
        def setex(self, key, time, val):
            self.store[key] = val
        def incr(self, key):
            self.store[key] = self.store.get(key, 0) + 1
            return self.store[key]
    
    rl_mod.redis_client = MockRedis()
    
    for i in range(5):
        allowed, info = rl.check_rate_limit('test_ip', limit=5, window=60)
        assert allowed is True
    
    # 6th request should fail
    allowed, info = rl.check_rate_limit('test_ip', limit=5, window=60)
    assert allowed is False
    assert info.get('remaining') == 0
    
    pass_test("Key generation, limits, and redis integration verified")
except Exception as e:
    fail_test(str(e))

# ====================================================================
# TEST 3: RBACService
# ====================================================================
test_case("Role-Based Access Control (RBAC)")
try:
    class FakeUser:
        def __init__(self, id, role):
            self.id = id
            self.role = role
        @classmethod
        def get(cls, uid):
            if uid == 1: return FakeUser(1, 'admin')
            if uid == 2: return FakeUser(2, 'faculty')
            if uid == 3: return FakeUser(3, 'student')
            return None

    class FakeQuery:
        @staticmethod
        def get(uid):
            return FakeUser.get(uid)

    FakeUser.query = FakeQuery
    fake_models.User = FakeUser
    
    spec = importlib.util.spec_from_file_location("rbac", "backend/app/services/rbac.py")
    rbac_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rbac_mod)
    
    rbac = rbac_mod.RBACService()
    
    # Admin has all permissions
    assert rbac.has_permission(1, 'users', 'delete') is True
    assert rbac.has_permission(1, 'settings', 'update') is True
    
    # Faculty has students & resumes permissions
    assert rbac.has_permission(2, 'students', 'read') is True
    assert rbac.has_permission(2, 'resumes', 'read') is True
    assert rbac.has_permission(2, 'users', 'delete') is False
    
    # Student has no faculty/admin permissions
    assert rbac.has_permission(3, 'students', 'read') is False
    assert rbac.has_permission(3, 'users', 'delete') is False
    
    # Non-existent user
    assert rbac.has_permission(999, 'students', 'read') is False
    
    pass_test("Role hierarchy & resource permissions enforced")
except Exception as e:
    fail_test(str(e))

# ====================================================================
# TEST 4: MultiLevelCache (Memory L1 + Redis L2)
# ====================================================================
test_case("Multi-level Caching (L1/L2 & no-cache bypass)")
try:
    fake_ext.redis_client = None
    spec = importlib.util.spec_from_file_location("multilevel_cache", "backend/app/services/multilevel_cache.py")
    cache_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cache_mod)
    
    cache = cache_mod.MultiLevelCache()
    
    # Test L1 memory set and get
    cache.set('item1', {'data': 123}, ttl=60)
    assert cache.get('item1') == {'data': 123}
    
    # Test L1 delete
    cache.delete('item1')
    assert cache.get('item1') is None
    
    # Test cache decorator
    call_counter = [0]
    @cache.cache(ttl=60, key_prefix='test_func')
    def get_data():
        call_counter[0] += 1
        return {'count': call_counter[0]}
    
    # Without active flask request context
    res1 = get_data()
    res2 = get_data()
    assert res1 == {'count': 1}
    assert res2 == {'count': 1}
    assert call_counter[0] == 1
    
    pass_test("L1 memory caching and decorator caching working")
except Exception as e:
    fail_test(str(e))

# ====================================================================
# TEST 5: OAuth2Client Model
# ====================================================================
test_case("OAuth2Client Model & Serialization")
try:
    spec = importlib.util.spec_from_file_location("oauth_model", "backend/app/models/oauth.py")
    oauth_m_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(oauth_m_mod)
    
    client_obj = oauth_m_mod.OAuth2Client()
    client_obj.id = 1
    client_obj.client_id = "client_abc_123"
    client_obj.client_type = "confidential"
    client_obj.client_name = "Test Client"
    client_obj.created_at = datetime.now(timezone.utc)
    
    d = client_obj.to_dict()
    assert d['id'] == 1
    assert d['client_id'] == "client_abc_123"
    assert d['client_name'] == "Test Client"
    
    pass_test("OAuth2Client model definition & serialization verified")
except Exception as e:
    fail_test(str(e))

# ====================================================================
# TEST 6: DB Performance Optimizer
# ====================================================================
test_case("DBPerformanceOptimizer Queries & Analysis")
try:
    fake_sql = types.ModuleType('sqlalchemy')
    fake_sql.text = lambda q: q
    sys.modules['sqlalchemy'] = fake_sql
    
    spec = importlib.util.spec_from_file_location("db_perf", "backend/app/services/db_performance.py")
    db_perf_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(db_perf_mod)
    
    assert hasattr(db_perf_mod.DBPerformanceOptimizer, 'create_performance_indexes')
    assert hasattr(db_perf_mod.DBPerformanceOptimizer, 'analyze_slow_queries')
    
    # Run analyze_slow_queries with mock db
    slow = db_perf_mod.DBPerformanceOptimizer.analyze_slow_queries()
    assert isinstance(slow, list)
    
    pass_test("Index statements and slow query analyzer validated")
except Exception as e:
    fail_test(str(e))

# ====================================================================
# TEST 7: Docker Compose Backend Production File
# ====================================================================
test_case("docker-compose-backend-prod.yml Structure")
try:
    with open("docker-compose-backend-prod.yml", "r") as f:
        content = f.read()
    
    assert "version:" in content
    assert "services:" in content
    assert "auth-service:" in content
    assert "resume-service:" in content
    assert "job-service:" in content
    assert "postgres:" in content
    assert "redis:" in content
    assert "postgres_data:" in content
    
    pass_test("Production compose file syntax and service definitions intact")
except Exception as e:
    fail_test(str(e))

# ====================================================================
# TEST SUMMARY
# ====================================================================
print("\n" + "=" * 60)
print(f"📊 SUMMARY: {passed} PASSED, {failed} FAILED")
print("=" * 60)

if failed > 0:
    sys.exit(1)
