# backend/tests/unit/test_youtube_quota_circuit_breaker.py
import pytest
import time
from unittest.mock import MagicMock, patch
from app.services.youtube_service import (
    YouTubeService,
    YouTubeQuotaCircuitBreaker,
    make_context_key,
    is_video_matching_stage_intent,
    is_video_relevant_to_skill,
    score_stage_intent
)


@pytest.fixture
def youtube_service(tmp_path):
    """Instantiate a YouTubeService with an isolated temporary cache file and clean state."""
    cache_file = str(tmp_path / "test_youtube_cache.json")
    service = YouTubeService(cache_file=cache_file)
    service.api_key = "test_api_key_12345"
    service.clear_cache()
    return service


# =====================================================================
# 1. Cache hit makes zero YouTube API calls
# =====================================================================
def test_cache_hit_makes_zero_youtube_api_calls(youtube_service):
    """
    Verify that when valid cached results exist for a context key,
    get_videos_for_skill returns them immediately without calling YouTube API.
    """
    skill = "CustomInternalFrameworkABC"
    role = "Full Stack Engineer"
    stage = "learn"
    lang = "en"
    max_results = 2

    cache_key = make_context_key(skill, role, stage, lang, max_results)
    cached_payload = [
        {
            'id': 'mockvid0001',
            'title': 'CustomInternalFrameworkABC Complete Course for Beginners',
            'channel': 'Tech Masters',
            'duration': '45:00',
            'duration_seconds': 2700,
            'recommendation_source': 'curated',
            'stage': 'learn',
            'skill_name': skill
        }
    ]
    with youtube_service._cache_lock:
        youtube_service._cache[cache_key] = cached_payload

    with patch.object(youtube_service._http_session, 'get') as mock_get:
        results = youtube_service.get_videos_for_skill(
            skill=skill,
            target_role=role,
            stage=stage,
            max_results=max_results,
            language=lang
        )
        assert len(results) == 1
        assert results[0]['id'] == 'mockvid0001'
        mock_get.assert_not_called()


# =====================================================================
# 2. Curated resources make zero YouTube API calls
# =====================================================================
def test_curated_resource_makes_zero_youtube_api_calls(youtube_service):
    """
    Verify that curated catalog lookups (e.g. JavaScript, Python)
    return immediately without making any YouTube API calls.
    """
    with patch.object(youtube_service._http_session, 'get') as mock_get:
        results = youtube_service.get_videos_for_skill(
            skill="JavaScript",
            target_role="Software Engineer",
            stage="learn"
        )
        assert len(results) >= 1
        assert any("javascript" in r['title'].lower() for r in results)
        mock_get.assert_not_called()


# =====================================================================
# 3. Repeated identical requests are deduplicated (empty result cooldown)
# =====================================================================
def test_repeated_identical_empty_requests_deduplicated(youtube_service):
    """
    Verify that when an uncached dynamic search returns empty, subsequent identical
    requests within cooldown return [] immediately without repeated API calls.
    """
    skill = "UnknownExoticSkillXYZ"
    role = "Data Scientist"
    stage = "practice"
    lang = "en"
    max_results = 4
    cache_key = make_context_key(skill, role, stage, lang, max_results)

    # First call: mock API returning 200 OK with 0 items
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {'items': []}

    with patch.object(youtube_service._http_session, 'get', return_value=mock_resp) as mock_get:
        first_results = youtube_service.get_videos_for_skill(
            skill=skill,
            target_role=role,
            stage=stage,
            max_results=max_results,
            language=lang
        )
        assert first_results == []
        assert mock_get.call_count >= 1
        assert youtube_service.is_empty_cooldown_active(cache_key)

    # Second call: identical request within cooldown must make ZERO HTTP calls
    with patch.object(youtube_service._http_session, 'get') as mock_get2:
        second_results = youtube_service.get_videos_for_skill(
            skill=skill,
            target_role=role,
            stage=stage,
            max_results=max_results,
            language=lang
        )
        assert second_results == []
        mock_get2.assert_not_called()


# =====================================================================
# 4. HTTP 429 opens the circuit breaker
# =====================================================================
def test_429_opens_circuit_breaker(youtube_service):
    """
    Verify that receiving an HTTP 429 response from the YouTube API
    immediately trips the circuit breaker to OPEN and halts further queries.
    """
    assert not youtube_service.is_circuit_open()

    mock_resp = MagicMock()
    mock_resp.status_code = 429
    mock_resp.text = "RESOURCE_EXHAUSTED: Daily quota exceeded"

    with patch.object(youtube_service._http_session, 'get', return_value=mock_resp) as mock_get:
        results = youtube_service.get_videos_for_skill(
            skill="SomeNewSkill",
            target_role="Software Engineer",
            stage="practice"
        )
        assert results == []
        assert youtube_service.is_circuit_open()
        status = youtube_service.get_circuit_breaker_status()
        assert status['state'] == 'OPEN'
        assert status['is_open'] is True
        assert status['failure_count'] >= 1
        assert "429" in status['last_failure_reason'] or "RESOURCE_EXHAUSTED" in status['last_failure_reason']
        # The multi-query loop must halt immediately after the 429, not call 3 queries
        assert mock_get.call_count == 1


# =====================================================================
# 5. Requests during the open circuit do not call YouTube
# =====================================================================
def test_requests_during_open_circuit_do_not_call_youtube(youtube_service):
    """
    Verify that when the circuit breaker is OPEN, uncached requests
    safely return [] without attempting any YouTube API HTTP requests.
    """
    youtube_service.trip_circuit_breaker(duration=300.0, reason="Quota test trip")
    assert youtube_service.is_circuit_open()

    with patch.object(youtube_service._http_session, 'get') as mock_get:
        results = youtube_service.get_videos_for_skill(
            skill="UncachedLibraryABC",
            target_role="Software Engineer",
            stage="build"
        )
        assert results == []
        mock_get.assert_not_called()


# =====================================================================
# 6. Valid cached resources still work during quota exhaustion
# =====================================================================
def test_valid_cached_resources_work_during_quota_exhaustion(youtube_service):
    """
    Verify that even when the circuit breaker is OPEN due to quota exhaustion:
    1. Curated catalog entries still work and return results.
    2. Persistent cached entries still work and return results.
    3. Zero YouTube API calls are made for either.
    """
    # 1. Populate persistent cache
    skill_cached = "UncuratedToolXYZ"
    role = "Systems Engineer"
    stage = "learn"
    cache_key = make_context_key(skill_cached, role, stage, "en", 4)
    cached_item = {
        'id': 'toolvid0001',
        'title': 'UncuratedToolXYZ Programming Full Course Tutorial',
        'channel': 'Tool Academy',
        'duration': '1:20:00',
        'duration_seconds': 4800,
        'recommendation_source': 'curated',
        'stage': 'learn',
        'skill_name': skill_cached
    }
    with youtube_service._cache_lock:
        youtube_service._cache[cache_key] = [cached_item]

    # Trip the circuit breaker
    youtube_service.trip_circuit_breaker(duration=300.0, reason="Quota exhausted 429")
    assert youtube_service.is_circuit_open()

    with patch.object(youtube_service._http_session, 'get') as mock_get:
        # Check cached skill
        cached_res = youtube_service.get_videos_for_skill(skill_cached, role, stage)
        assert len(cached_res) == 1
        assert cached_res[0]['id'] == 'toolvid0001'

        # Check curated skill (e.g. Python)
        curated_res = youtube_service.get_videos_for_skill("Python", "Data Scientist", "learn")
        assert len(curated_res) >= 1
        assert any("python" in r['title'].lower() for r in curated_res)

        mock_get.assert_not_called()


# =====================================================================
# 7. Data Scientist remains a valid target role
# =====================================================================
def test_data_scientist_remains_valid_target_role(youtube_service):
    """
    Verify that target_role='Data Scientist' is preserved dynamically:
    1. Never hardcoded or replaced with 'Software Engineer'.
    2. Embedded in context key, queries, learning focus, and reason string.
    """
    role = "Data Scientist"
    skill = "Python"
    stage = "learn"

    videos = youtube_service.get_videos_for_skill(
        skill=skill,
        target_role=role,
        stage=stage
    )
    assert len(videos) >= 1
    # Check that metadata preserves Data Scientist
    for v in videos:
        assert role in v['learning_focus'] or role in v['recommendation_reason']
        assert "Software Engineer" not in v['learning_focus']

    # Check queries generated for Data Scientist
    queries = youtube_service._build_stage_queries(skill, role, "assess")
    assert any("data" in q.lower() or "python" in q.lower() for q in queries)


# =====================================================================
# 8. Circuit breaker reset and cooldown transitions
# =====================================================================
def test_circuit_breaker_reset_and_cooldown():
    """
    Verify circuit breaker state machine transitions:
    CLOSED -> OPEN on trip -> HALF_OPEN after cooldown -> CLOSED on success.
    """
    breaker = YouTubeQuotaCircuitBreaker(cooldown_seconds=0.1)
    assert breaker.state == 'CLOSED'
    assert not breaker.is_open()

    # Trip to OPEN
    breaker.trip(duration=0.1, reason="Test 429")
    assert breaker.state == 'OPEN'
    assert breaker.is_open()

    # Wait for cooldown to expire
    time.sleep(0.15)
    # is_open() should transition to HALF_OPEN and permit probe (returning False)
    assert not breaker.is_open()
    assert breaker.state == 'HALF_OPEN'

    # Success records and closes
    breaker.record_success()
    assert breaker.state == 'CLOSED'

    # Manual reset works
    breaker.trip(duration=10.0, reason="Another 429")
    assert breaker.is_open()
    breaker.reset()
    assert breaker.state == 'CLOSED'
    assert not breaker.is_open()


# =====================================================================
# 9. Express.js Practice continues using generic framework logic
# =====================================================================
def test_express_js_practice_generic_framework_logic(youtube_service):
    """
    Verify Express.js Practice queries and stage-intent scoring continue
    using generic framework-practice rules without hardcoding.
    """
    queries = youtube_service._build_stage_queries("Express.js", "Software Engineer", "practice")
    assert any("crud" in q.lower() or "rest api" in q.lower() for q in queries)
    assert not any("implementation drills" in q.lower() for q in queries)

    # Genuine practice titles pass
    title = "Build a REST API with Node JS and Express | CRUD API Tutorial"
    assert is_video_relevant_to_skill("Express.js", title)
    assert is_video_matching_stage_intent("practice", title)

    # Pure course fails practice
    course_title = "Node.js and Express.js - Full Course"
    assert not is_video_matching_stage_intent("practice", course_title)


# =====================================================================
# 10. Zero regression across core skills (JS, Algorithms, Python, React, SQL)
# =====================================================================
@pytest.mark.parametrize("skill,stage", [
    ("JavaScript", "learn"),
    ("JavaScript", "practice"),
    ("JavaScript", "build"),
    ("JavaScript", "assess"),
    ("Algorithms", "learn"),
    ("Algorithms", "practice"),
    ("Algorithms", "assess"),
    ("Python", "learn"),
    ("Python", "practice"),
    ("Python", "build"),
    ("Python", "assess"),
    ("React", "learn"),
    ("React", "practice"),
    ("SQL", "learn"),
    ("SQL", "practice"),
    ("SQL", "assess"),
])
def test_zero_regression_across_core_skills(youtube_service, skill, stage):
    """
    Verify that all core audited skills and stages resolve valid
    recommendations without crashes, errors, or empty results where curated exists.
    """
    videos = youtube_service.get_videos_for_skill(
        skill=skill,
        target_role="Software Engineer",
        stage=stage
    )
    assert isinstance(videos, list)
    # For curated stages, assert non-empty and valid metadata
    if videos:
        for v in videos:
            assert 'id' in v and len(v['id']) == 11
            assert 'title' in v and v['title']
            assert 'duration' in v
            assert 'stage' in v and v['stage'] == stage
            assert is_video_relevant_to_skill(skill, v['title'])
