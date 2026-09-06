# backend/tests/unit/test_youtube_duration_integrity.py

import pytest
from app.services.youtube_service import (
    YouTubeService,
    deduplicate_youtube_videos,
    apply_canonical_metadata,
    VERIFIED_CANONICAL_METADATA,
    SKILL_VIDEO_MAP,
    STAGE_CURATED_CATALOG
)


@pytest.fixture
def yt_service():
    yt = YouTubeService()
    yt.api_key = None  # Force curated/fallback path
    yt.clear_cache()
    return yt


# =====================================================================
# TEST 1: W6NZfCO5SIk has the correct duration (2896 seconds / 48:16)
# =====================================================================
def test_case_1_w6nzfco5sik_has_correct_duration(yt_service):
    """
    Test 1: Video W6NZfCO5SIk must return canonical duration 48:16 and 2896 seconds.
    """
    videos = yt_service.get_videos_for_skill("JavaScript", stage="learn")
    assert len(videos) > 0

    mosh_video = next((v for v in videos if v['id'] == 'W6NZfCO5SIk'), None)
    assert mosh_video is not None, "W6NZfCO5SIk should be returned for JavaScript learn stage"
    assert mosh_video['duration'] == '48:16'
    assert mosh_video['duration_seconds'] == 2896
    assert mosh_video['channel'] == 'Programming with Mosh'


# =====================================================================
# TEST 2: Incorrect duration '1 hr 8 mins' / 68 minutes must never be returned
# =====================================================================
def test_case_2_no_incorrect_68_minutes(yt_service):
    """
    Test 2: W6NZfCO5SIk must NEVER have '1 hr 8 mins', '68 mins', or ~4080 seconds.
    """
    for stage in ['learn', 'practice', 'build', 'assess']:
        videos = yt_service.get_videos_for_skill("JavaScript", stage=stage)
        for v in videos:
            if v['id'] == 'W6NZfCO5SIk':
                assert v['duration'] != '1 hr 8 mins', "Fabricated duration '1 hr 8 mins' returned!"
                assert v['duration'] != '68 mins'
                assert v.get('duration_seconds') != 4080
                assert v['duration'] == '48:16'
                assert v['duration_seconds'] == 2896


# =====================================================================
# TEST 3: Metadata integrity test
# video ID, title, channel, thumbnail, URL, duration belong to same record
# =====================================================================
def test_case_3_metadata_integrity(yt_service):
    """
    Test 3: Metadata integrity across all returned videos.
    Every video record must have consistent ID, matching thumbnail URL, matching watch URL,
    matching embed URL, and valid duration representation.
    """
    sample_skills = ['JavaScript', 'Python', 'React', 'SQL', 'MongoDB', 'Power BI', 'Terraform', 'Solidity']
    for sk in sample_skills:
        videos = yt_service.get_videos_for_skill(sk, stage='learn')
        for v in videos:
            vid_id = v['id']
            assert len(vid_id) == 11
            assert vid_id in v['url']
            assert vid_id in v['embed_url']
            assert vid_id in v['thumbnail']
            assert v['title'] and len(v['title']) > 0
            assert v['channel'] and len(v['channel']) > 0

            # If video is canonical, duration and seconds must match canonical mapping
            if vid_id in VERIFIED_CANONICAL_METADATA:
                expected = VERIFIED_CANONICAL_METADATA[vid_id]
                assert v['duration'] == expected['duration']
                assert v['duration_seconds'] == expected['duration_seconds']


# =====================================================================
# TEST 4: Unknown duration does not generate a fake duration
# =====================================================================
def test_case_4_unknown_duration_no_fake(yt_service):
    """
    Test 4: If duration cannot be verified, it must be None, NOT an arbitrary string
    like '45 mins', '40 mins', or '1 hr'.
    """
    unknown_item = {
        'id': 'unknown9999',
        'title': 'Obscure Framework Guide',
        'channel': 'Random Channel',
        'duration': '45 mins'  # Fabricated duration passed into pipeline
    }
    sanitized = apply_canonical_metadata(unknown_item)
    # Fabricated duration must be stripped to None
    assert sanitized['duration'] is None
    assert sanitized.get('duration_seconds') is None

    # Test with empty/None
    unknown_item2 = {
        'id': 'unknown8888',
        'title': 'Another Guide'
    }
    sanitized2 = apply_canonical_metadata(unknown_item2)
    assert sanitized2.get('duration') is None
    assert sanitized2.get('duration_seconds') is None


# =====================================================================
# TEST 5: Duplicate video records must not have conflicting durations
# =====================================================================
def test_case_5_no_conflicting_durations_in_duplicates():
    """
    Test 5: Duplicate occurrences of the same video ID in raw input must resolve
    to the single canonical duration without conflicting values.
    """
    raw = [
        {'id': 'W6NZfCO5SIk', 'title': 'JS 1', 'duration': '1 hr 8 mins'},
        {'id': 'W6NZfCO5SIk', 'title': 'JS 2', 'duration': '30 mins'},
        {'id': 'ofme2o29ngU', 'title': 'Mongo 1', 'duration': '45 mins'},
        {'id': 'ofme2o29ngU', 'title': 'Mongo 2', 'duration': '29:58'}
    ]
    cleaned = deduplicate_youtube_videos(raw)
    assert len(cleaned) == 2
    assert cleaned[0]['id'] == 'W6NZfCO5SIk'
    assert cleaned[0]['duration'] == '48:16'
    assert cleaned[0]['duration_seconds'] == 2896

    assert cleaned[1]['id'] == 'ofme2o29ngU'
    assert cleaned[1]['duration'] == '29:58'
    assert cleaned[1]['duration_seconds'] == 1798


# =====================================================================
# TEST 6: Cached metadata must pass duration validation
# =====================================================================
def test_case_6_cached_metadata_duration_validation(yt_service):
    """
    Test 6: In-memory cache must return verified canonical duration even if
    stale data was initially populated.
    """
    cache_key = "javascript|software engineer|learn|en|4"
    # Inject a simulated stale cache entry with '1 hr 8 mins'
    yt_service._cache[cache_key] = [
        {'id': 'W6NZfCO5SIk', 'title': 'JavaScript Tutorial for Beginners', 'duration': '1 hr 8 mins'}
    ]

    # Calling get_videos_for_skill will access the cache
    videos = yt_service.get_videos_for_skill("JavaScript", stage="learn")
    assert len(videos) == 1
    assert videos[0]['id'] == 'W6NZfCO5SIk'
    # The cache read applies canonical metadata and sanitizes the duration
    assert videos[0]['duration'] == '48:16'
    assert videos[0]['duration_seconds'] == 2896


# =====================================================================
# TEST 7: Multi-video canonical duration audit across skills
# =====================================================================
def test_case_7_multi_video_duration_audit(yt_service):
    """
    Test 7: Audits multiple curated videos across skills to verify their
    exact YouTube duration and seconds are preserved.
    """
    test_cases = [
        ('Python', 'learn', 'rfscVS0vtbw', '4:26:51', 16011),
        ('SQL', 'learn', 'HXV3zeQKqGY', '4:20:38', 15638),
        ('React', 'learn', 'bMknfKXIFA8', '11:55:27', 42927),
        ('MongoDB', 'learn', 'ofme2o29ngU', '29:58', 1798),
        ('Power BI', 'learn', 'TmhQCQr_DCA', '27:52', 1672),
        ('Terraform', 'learn', '7xngnjfIlK4', '2:38:03', 9483),
        ('Solidity', 'learn', 'M576WGiDBdQ', '16:22:11', 58931)
    ]

    for skill, stage, expected_id, expected_dur, expected_sec in test_cases:
        videos = yt_service.get_videos_for_skill(skill, stage=stage)
        match = next((v for v in videos if v['id'] == expected_id), None)
        assert match is not None, f"Video {expected_id} not found for {skill} ({stage})"
        assert match['duration'] == expected_dur, f"Mismatch for {skill}: expected {expected_dur}, got {match['duration']}"
        assert match['duration_seconds'] == expected_sec, f"Seconds mismatch for {skill}: expected {expected_sec}, got {match['duration_seconds']}"
