# backend/tests/unit/test_youtube_phase34_generic.py

import os
import sys
import tempfile
import threading
import pytest

from app.services.youtube_service import (
    YouTubeService,
    make_context_key,
    parse_iso8601_duration,
    check_oembed_availability,
    STAGE_CURATED_CATALOG,
    VERIFIED_CANONICAL_METADATA,
    normalize_skill_name,
    is_video_relevant_to_skill,
    is_video_matching_stage_intent
)


@pytest.fixture
def temp_cache_file():
    with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as f:
        path = f.name
    yield path
    if os.path.exists(path):
        os.remove(path)
    tmp_backup = f"{path}.tmp"
    if os.path.exists(tmp_backup):
        os.remove(tmp_backup)


@pytest.fixture
def yt_service(temp_cache_file):
    service = YouTubeService(cache_file=temp_cache_file)
    service.clear_cache()
    return service


# =====================================================================
# TEST 1: Zero Hardcoded Whitelist (Any Valid Skill Supported)
# =====================================================================
def test_no_hardcoded_whitelist_exists():
    """Verify that no hardcoded SUPPORTED_SKILLS whitelist exists in youtube_service."""
    import app.services.youtube_service as yts
    assert not hasattr(yts, 'SUPPORTED_SKILLS'), "SUPPORTED_SKILLS whitelist should not exist!"
    assert not hasattr(yts, 'WHITELISTED_SKILLS'), "WHITELISTED_SKILLS should not exist!"


def test_any_arbitrary_skill_reaches_pipeline(yt_service):
    """
    Verify that arbitrary valid skills (e.g. Svelte, Celery, OpenTofu, Pinia)
    reach the recommendation pipeline and return valid video records or safe empty,
    never crashing with a whitelist or unsupported skill exception.
    """
    arbitrary_skills = ['Svelte', 'Celery', 'OpenTofu', 'Pinia', 'Elixir']
    for sk in arbitrary_skills:
        videos = yt_service.get_videos_for_skill(sk, stage='learn', max_results=2)
        assert isinstance(videos, list)
        for v in videos:
            assert 'id' in v
            assert len(v['id']) == 11
            assert 'title' in v
            assert 'url' in v
            assert 'embed_url' in v


# =====================================================================
# TEST 2: 20 Mandatory Priority Regression Skills
# =====================================================================
PRIORITY_20_SKILLS = [
    'REST APIs',
    'REST API',
    'Express.js',
    'Node.js',
    'FastAPI',
    'Docker',
    'Git',
    'GitHub',
    'AWS',
    'Azure',
    'MongoDB',
    'MySQL',
    'SQL',
    'React',
    'JavaScript',
    'Python',
    'Power BI',
    'System Design',
    'Terraform',
    'Solidity'
]


def test_all_20_priority_skills_return_valid_recommendations(yt_service):
    """Verify all 20 priority regression skills resolve authentic videos with verified metadata."""
    for skill in PRIORITY_20_SKILLS:
        videos = yt_service.get_videos_for_skill(skill, stage='learn', max_results=2)
        assert len(videos) >= 1, f"Skill '{skill}' must return at least 1 video for learn stage"

        for v in videos:
            assert 'id' in v
            assert len(v['id']) == 11
            assert v['url'] == f"https://www.youtube.com/watch?v={v['id']}"
            assert v['embed_url'] == f"https://www.youtube.com/embed/{v['id']}"
            assert v.get('title') is not None
            assert len(v['title'].strip()) > 0
            assert v.get('channel') is not None
            assert v.get('badge') is not None

            # Canonical duration verification if present
            vid_id = v['id']
            if vid_id in VERIFIED_CANONICAL_METADATA:
                expected = VERIFIED_CANONICAL_METADATA[vid_id]
                assert v['duration'] == expected['duration']
                assert v['duration_seconds'] == expected['duration_seconds']

            # Duration must never be a fabricated placeholder
            assert v.get('duration') not in ['1 hr 8 mins', '45 mins', '40 mins', 'Duration unavailable']


# =====================================================================
# TEST 3: Arbitrary Uncurated Skills Reach Dynamic Search
# =====================================================================
def test_uncurated_skills_dynamic_resolution(yt_service):
    """
    Verify that skills without full stage curation (Kubernetes, GraphQL, Redis, Kafka, Next.js, TypeScript)
    resolve authentic videos and do not get blocked.
    """
    uncurated_skills = ['Kubernetes', 'GraphQL', 'Redis', 'Kafka', 'Next.js', 'TypeScript']
    for skill in uncurated_skills:
        videos = yt_service.get_videos_for_skill(skill, stage='learn', max_results=2)
        assert len(videos) >= 1, f"Uncurated skill '{skill}' must resolve at least 1 video"
        assert len(videos[0]['id']) == 11
        assert videos[0]['stage'] == 'learn'


# =====================================================================
# TEST 4: Strict Stage Isolation (No Learn Fallback)
# =====================================================================
def test_strict_stage_isolation_power_bi(yt_service):
    """Power BI has curated learn, but requesting assess must NEVER return the learn tutorial."""
    learn = yt_service.get_videos_for_skill("Power BI", stage="learn")
    assert len(learn) > 0
    learn_id = learn[0]['id']

    assess = yt_service.get_videos_for_skill("Power BI", stage="assess")
    assess_ids = [v['id'] for v in assess]
    assert learn_id not in assess_ids, "Power BI assess stage must NEVER return the learn tutorial!"


def test_nonexistent_skill_returns_empty_for_all_non_learn_stages(yt_service):
    """For an unknown / nonsense skill, non-learn stages must return safe empty []."""
    for stage in ['practice', 'build', 'assess']:
        videos = yt_service.get_videos_for_skill("NonExistentSkillXYZ12345", stage=stage)
        assert videos == [], f"Non-learn stage '{stage}' must return [] for nonexistent skill"


# =====================================================================
# TEST 5: Duration Integrity & ISO-8601 Parser
# =====================================================================
def test_iso8601_duration_parser():
    """Verify exact duration string and total seconds for standard YouTube ISO-8601 durations."""
    # Under an hour
    formatted, secs = parse_iso8601_duration('PT48M16S')
    assert formatted == '48:16'
    assert secs == 2896

    # Over an hour
    formatted, secs = parse_iso8601_duration('PT1H35M43S')
    assert formatted == '1:35:43'
    assert secs == 5743

    # Exact minutes
    formatted, secs = parse_iso8601_duration('PT5M')
    assert formatted == '5:00'
    assert secs == 300

    # Seconds only
    formatted, secs = parse_iso8601_duration('PT45S')
    assert formatted == '0:45'
    assert secs == 45

    # Hours only
    formatted, secs = parse_iso8601_duration('PT1H')
    assert formatted == '1:00:00'
    assert secs == 3600

    # Invalid / empty durations return (None, None)
    assert parse_iso8601_duration('invalid') == (None, None)
    assert parse_iso8601_duration('') == (None, None)
    assert parse_iso8601_duration(None) == (None, None)
    assert parse_iso8601_duration('PT0S') == (None, None)


# =====================================================================
# TEST 6: oEmbed Never Used Authoritatively For Duration
# =====================================================================
def test_oembed_never_authoritative_for_duration():
    """
    Verify that check_oembed_availability returns (is_available, title, author),
    and does NOT provide or fabricate duration.
    """
    is_avail, title, author = check_oembed_availability('W6NZfCO5SIk')
    assert is_avail is True
    assert title is not None
    assert author is not None
    # oEmbed tuple has only 3 values: availability, title, author (no duration!)


# =====================================================================
# TEST 7: Persistent Cache Disk Roundtrip
# =====================================================================
def test_persistent_disk_cache_roundtrip(temp_cache_file):
    """Verify that cached recommendations persist to disk and can be reloaded."""
    service1 = YouTubeService(cache_file=temp_cache_file)
    service1.clear_cache()

    videos1 = service1.get_videos_for_skill("JavaScript", stage="learn")
    assert len(videos1) >= 1

    # Verify cache file exists on disk and has data
    assert os.path.exists(temp_cache_file)
    assert os.path.getsize(temp_cache_file) > 0

    # Create new service instance with same cache file
    service2 = YouTubeService(cache_file=temp_cache_file)
    videos2 = service2.get_videos_for_skill("JavaScript", stage="learn")

    # Identical cached payload
    assert len(videos1) == len(videos2)
    assert [v['id'] for v in videos1] == [v['id'] for v in videos2]


# =====================================================================
# TEST 8: Thread-Safe Request Deduplication
# =====================================================================
def test_concurrent_request_deduplication(yt_service):
    """Verify that concurrent requests for identical key execute safely and deduplicate."""
    results = []
    errors = []

    def worker():
        try:
            vids = yt_service.get_videos_for_skill("Python", stage="practice", max_results=2)
            results.append(vids)
        except Exception as e:
            errors.append(e)

    threads = [threading.Thread(target=worker) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(errors) == 0
    assert len(results) == 5
    # All 5 concurrent callers must receive identical video IDs
    first_ids = [v['id'] for v in results[0]]
    for r in results[1:]:
        assert [v['id'] for v in r] == first_ids


def test_request_deduplication_context_isolation(yt_service):
    """
    Verify request deduplication context isolation:
    - same skill + same role + same stage + same language -> deduplicates (same key & lock)
    - different language -> does NOT incorrectly deduplicate (distinct key & lock)
    - different target role -> does NOT incorrectly deduplicate (distinct key & lock)
    - different stage -> does NOT incorrectly deduplicate (distinct key & lock)
    - cache key and request-deduplication key are logically identical
    """
    base_key = make_context_key("JavaScript", "Full Stack Developer", "practice", "en", 4)
    base_lock = yt_service.get_inflight_lock(base_key)

    # 1. Same context -> identical key and identical lock
    same_key = make_context_key("JavaScript", "Full Stack Developer", "practice", "en", 4)
    same_lock = yt_service.get_inflight_lock(same_key)
    assert same_key == base_key, "Identical context parameters must generate identical key"
    assert same_lock is base_lock, "Identical context parameters must share the identical lock instance"

    # 2. Different language -> distinct key and distinct lock
    lang_key = make_context_key("JavaScript", "Full Stack Developer", "practice", "kn", 4)
    lang_lock = yt_service.get_inflight_lock(lang_key)
    assert lang_key != base_key, "Different language must yield distinct context key"
    assert lang_lock is not base_lock, "Different language must NOT share an in-flight lock"

    # 3. Different target role -> distinct key and distinct lock
    role_key = make_context_key("JavaScript", "Data Scientist", "practice", "en", 4)
    role_lock = yt_service.get_inflight_lock(role_key)
    assert role_key != base_key, "Different role must yield distinct context key"
    assert role_lock is not base_lock, "Different role must NOT share an in-flight lock"

    # 4. Different stage -> distinct key and distinct lock
    stage_key = make_context_key("JavaScript", "Full Stack Developer", "assess", "en", 4)
    stage_lock = yt_service.get_inflight_lock(stage_key)
    assert stage_key != base_key, "Different stage must yield distinct context key"
    assert stage_lock is not base_lock, "Different stage must NOT share an in-flight lock"

    # 5. Different max_results -> distinct key and distinct lock
    limit_key = make_context_key("JavaScript", "Full Stack Developer", "practice", "en", 2)
    limit_lock = yt_service.get_inflight_lock(limit_key)
    assert limit_key != base_key, "Different max_results must yield distinct context key"
    assert limit_lock is not base_lock, "Different max_results must NOT share an in-flight lock"


# =====================================================================
# TEST 9: Stage-Specific Dynamic Queries
# =====================================================================
def test_stage_specific_query_generation(yt_service):
    """Verify that _build_contextual_query produces high-precision stage-appropriate terms."""
    q_learn = yt_service._build_contextual_query("React", "Frontend Dev", "learn", "en")
    assert "tutorial" in q_learn.lower() or "course" in q_learn.lower()

    q_practice = yt_service._build_contextual_query("React", "Frontend Dev", "practice", "en")
    assert "exercises" in q_practice.lower() or "practice" in q_practice.lower()

    q_build = yt_service._build_contextual_query("React", "Frontend Dev", "build", "en")
    assert "project" in q_build.lower() or "build" in q_build.lower()

    q_assess = yt_service._build_contextual_query("React", "Frontend Dev", "assess", "en")
    assert "interview" in q_assess.lower() or "questions" in q_assess.lower()

    # Hindi preference
    q_hindi = yt_service._build_contextual_query("React", "Frontend Dev", "learn", "hi")
    assert "hindi" in q_hindi.lower()


# =====================================================================
# TEST 10: Relevance & Intent Filters
# =====================================================================
def test_relevance_and_intent_filters():
    """Verify helper filters correctly discriminate genuine content."""
    assert is_video_relevant_to_skill("Kubernetes", "Kubernetes Tutorial for Beginners [FULL COURSE]")
    assert is_video_relevant_to_skill("k8s", "Kubernetes Cluster Setup Walkthrough")
    assert not is_video_relevant_to_skill("NonExistentSkillXYZ", "Python Tutorial for Beginners")

    assert is_video_matching_stage_intent("assess", "Top 50 JavaScript Interview Questions & Answers")
    assert not is_video_matching_stage_intent("assess", "How to Install Node.js on Windows 11")

    assert is_video_matching_stage_intent("practice", "Python Practice Problems and Coding Exercises")
    assert is_video_matching_stage_intent("build", "Build and Deploy a Full Stack MERN App")


# =====================================================================
# TEST 11: Phase 3.4.1 Multi-Query Domain-Aware Generation
# =====================================================================
def test_multi_query_domain_aware_generation(yt_service):
    """
    Verify that _build_stage_queries generates up to 3 bounded, distinct,
    domain-tailored queries for DevOps, Data, Distributed, and Backend/Frontend.
    """
    # 1. DevOps Domain (Docker / Jenkins / Git)
    docker_practice = yt_service._build_stage_queries("Docker", "DevOps Engineer", "practice")
    assert 1 <= len(docker_practice) <= 3
    assert any("hands on" in q.lower() or "lab" in q.lower() for q in docker_practice)

    jenkins_build = yt_service._build_stage_queries("Jenkins", "DevOps Engineer", "build")
    assert 1 <= len(jenkins_build) <= 3
    assert any("pipeline" in q.lower() or "project" in q.lower() for q in jenkins_build)

    # 2. Data Science Domain (Pandas / NumPy / SQL)
    pandas_practice = yt_service._build_stage_queries("Pandas", "Data Analyst", "practice")
    assert 1 <= len(pandas_practice) <= 3
    assert any("exercises" in q.lower() or "problems" in q.lower() for q in pandas_practice)

    pandas_build = yt_service._build_stage_queries("Pandas", "Data Analyst", "build")
    assert 1 <= len(pandas_build) <= 3
    assert any("data analysis" in q.lower() or "portfolio" in q.lower() for q in pandas_build)

    # 3. Distributed Domain (Kafka / Redis)
    kafka_assess = yt_service._build_stage_queries("Kafka", "Backend Engineer", "assess")
    assert 1 <= len(kafka_assess) <= 3
    assert any("interview" in q.lower() or "questions" in q.lower() for q in kafka_assess)

    # 4. Hindi Suffix Generation
    docker_hi = yt_service._build_stage_queries("Docker", "DevOps Engineer", "practice", language="hi")
    assert all("hindi" in q.lower() for q in docker_hi)


# =====================================================================
# TEST 12: Production Dynamic Search Safety (No Scraping Dependency)
# =====================================================================
def test_production_dynamic_search_safe_empty_when_no_api_key(monkeypatch, yt_service):
    """
    Verify that in production (ENABLE_YOUTUBE_WEB_FALLBACK=False), when no API key
    is available, dynamic search safely degrades to [] without attempting web scraping.
    """
    import app.services.youtube_service as yts
    monkeypatch.setattr(yts, 'ENABLE_YOUTUBE_WEB_FALLBACK', False)
    yt_service.api_key = None

    # Track if _discover_candidates was ever called
    called = []
    original_discover = yt_service._discover_candidates

    def tracking_discover(*args, **kwargs):
        called.append(True)
        return original_discover(*args, **kwargs)

    monkeypatch.setattr(yt_service, '_discover_candidates', tracking_discover)

    # For completely uncurated skill/stage
    videos = yt_service.get_videos_for_skill("TotallyNewSkillXYZ", stage="practice", enable_dynamic=True)
    assert videos == []
    assert len(called) == 0, "_discover_candidates (scraping) must NEVER be called in production path!"


# =====================================================================
# TEST 13: 11 Priority Retest Skills Quality & Stage Isolation
# =====================================================================
def test_11_priority_skills_zero_learn_fallback(yt_service):
    """
    Verify that for the 11 priority skills (Express.js, Docker, Git, Kafka, Redis,
    GraphQL, Flutter, Pandas, NumPy, Jenkins, REST APIs):
    Practice, Build, and Assess stages NEVER leak Learn videos.
    """
    priority_11 = [
        'Express.js', 'Docker', 'Git', 'Kafka', 'Redis',
        'GraphQL', 'Flutter', 'Pandas', 'NumPy', 'Jenkins', 'REST APIs'
    ]

    for skill in priority_11:
        learn_videos = yt_service.get_videos_for_skill(skill, stage="learn", max_results=4)
        learn_ids = {v['id'] for v in learn_videos}

        for stage in ['practice', 'build', 'assess']:
            stage_videos = yt_service.get_videos_for_skill(skill, stage=stage, max_results=4)
            assert isinstance(stage_videos, list)

            for v in stage_videos:
                # Stage videos must NEVER contain any learn tutorial ID
                assert v['id'] not in learn_ids, (
                    f"Skill '{skill}' stage '{stage}' leaked learn video {v['id']} ('{v.get('title')}')!"
                )
                # Video metadata must be valid
                assert len(v['id']) == 11
                assert v['stage'] == stage
                # Duration must never be fabricated
                assert v.get('duration') not in ['1 hr 8 mins', '45 mins', '40 mins', 'Duration unavailable']

