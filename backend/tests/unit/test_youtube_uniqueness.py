# backend/tests/unit/test_youtube_uniqueness.py

import pytest
from app.services.youtube_service import (
    YouTubeService,
    extract_youtube_id,
    deduplicate_youtube_videos
)

@pytest.fixture
def yt_service():
    yt = YouTubeService()
    yt.api_key = None  # Ensure curated/fallback pathway
    yt._cache.clear()
    return yt


# =====================================================================
# REPRODUCTION TEST: Fails before fix, passes after fix
# =====================================================================
def test_reproduction_no_duplicate_videos_for_javascript(yt_service):
    """
    REPRODUCTION TEST:
    Prior to Phase 3.1, calling get_videos_for_skill("JavaScript") returned 4 records
    all referencing the exact same video ID ('W6NZfCO5SIk') with fabricated titles and durations.
    This test asserts that all returned video IDs are strictly unique.
    """
    videos = yt_service.get_videos_for_skill("JavaScript")
    assert len(videos) > 0
    ids = [v['id'] for v in videos]
    assert len(ids) == len(set(ids)), f"Duplicate video IDs detected: {ids}"
    assert len(videos) == 2, f"Expected 2 genuine curated videos, got {len(videos)}"
    assert videos[0]['id'] == 'W6NZfCO5SIk'
    assert videos[1]['id'] == 'jS4aFq5-91M'
    # Ensure titles are authentic canonical YouTube titles, not fabricated templates
    assert "Core JavaScript Concepts Every" not in videos[1]['title']
    assert "Hands-On JavaScript Practical" not in videos[1]['title']


# =====================================================================
# TEST 1: 4 unique video IDs remain 4 videos
# =====================================================================
def test_case_1_four_unique_ids_remain_four():
    input_videos = [
        {'id': 'vidAAAA1111', 'title': 'Video A'},
        {'id': 'vidBBBB2222', 'title': 'Video B'},
        {'id': 'vidCCCC3333', 'title': 'Video C'},
        {'id': 'vidDDDD4444', 'title': 'Video D'}
    ]
    result = deduplicate_youtube_videos(input_videos)
    assert len(result) == 4
    assert [v['id'] for v in result] == ['vidAAAA1111', 'vidBBBB2222', 'vidCCCC3333', 'vidDDDD4444']


# =====================================================================
# TEST 2: Duplicate IDs are removed
# =====================================================================
def test_case_2_duplicate_ids_removed():
    input_videos = [
        {'id': 'vidAAAA1111', 'title': 'First occurrence A'},
        {'id': 'vidAAAA1111', 'title': 'Duplicate occurrence A'},
        {'id': 'vidBBBB2222', 'title': 'Video B'},
        {'id': 'vidCCCC3333', 'title': 'Video C'}
    ]
    result = deduplicate_youtube_videos(input_videos)
    assert len(result) == 3
    assert [v['id'] for v in result] == ['vidAAAA1111', 'vidBBBB2222', 'vidCCCC3333']
    # Must preserve first occurrence metadata
    assert result[0]['title'] == 'First occurrence A'


# =====================================================================
# TEST 3: Multiple duplicate occurrences are removed
# =====================================================================
def test_case_3_multiple_duplicate_occurrences_removed():
    input_videos = [
        {'id': 'vidAAAA1111', 'title': 'Video A'},
        {'id': 'vidBBBB2222', 'title': 'Video B'},
        {'id': 'vidAAAA1111', 'title': 'Video A duplicate'},
        {'id': 'vidCCCC3333', 'title': 'Video C'},
        {'id': 'vidBBBB2222', 'title': 'Video B duplicate'}
    ]
    result = deduplicate_youtube_videos(input_videos)
    assert len(result) == 3
    assert [v['id'] for v in result] == ['vidAAAA1111', 'vidBBBB2222', 'vidCCCC3333']


# =====================================================================
# TEST 4: YouTube URL and raw video ID normalized correctly
# =====================================================================
def test_case_4_youtube_url_and_raw_id_normalized():
    raw_id = 'ABC12345678'
    watch_url = f'https://www.youtube.com/watch?v={raw_id}'
    short_url = f'https://youtu.be/{raw_id}'
    embed_url = f'https://www.youtube.com/embed/{raw_id}'
    param_url = f'https://www.youtube.com/watch?v={raw_id}&feature=shared'

    assert extract_youtube_id(raw_id) == raw_id
    assert extract_youtube_id(watch_url) == raw_id
    assert extract_youtube_id(short_url) == raw_id
    assert extract_youtube_id(embed_url) == raw_id
    assert extract_youtube_id(param_url) == raw_id

    # Deduplication across different URL representations
    mixed_input = [
        {'id': raw_id, 'title': 'Raw ID item'},
        {'url': watch_url, 'title': 'Watch URL item'},
        {'embed_url': embed_url, 'title': 'Embed URL item'}
    ]
    result = deduplicate_youtube_videos(mixed_input)
    assert len(result) == 1
    assert result[0]['id'] == raw_id
    assert result[0]['title'] == 'Raw ID item'


# =====================================================================
# TEST 5: Empty and null IDs ignored safely
# =====================================================================
def test_case_5_empty_null_ids_ignored():
    input_videos = [
        {'id': ''},
        {'id': None},
        {'id': 'invalid_short'},
        {'id': 'fallback_placeholder'},
        {},
        {'id': 'vidAAAA1111', 'title': 'Valid Video'}
    ]
    result = deduplicate_youtube_videos(input_videos)
    assert len(result) == 1
    assert result[0]['id'] == 'vidAAAA1111'


# =====================================================================
# TEST 6: Only 2 unique videos means exactly 2 results (never clone to 4)
# =====================================================================
def test_case_6_two_unique_videos_means_exactly_two(yt_service):
    videos = yt_service.get_videos_for_skill("JavaScript", stage="learn")
    assert len(videos) == 2
    assert videos[0]['id'] != videos[1]['id']


# =====================================================================
# TEST 7: Only 1 unique video means exactly 1 result (never clone)
# =====================================================================
def test_case_7_single_unique_video_means_one_result(yt_service):
    # CockroachDB maps to single database category fallback
    videos = yt_service.get_videos_for_skill("CockroachDB Distributed Datastore")
    assert len(videos) == 1
    assert videos[0]['id'] == 'HXV3zeQKqGY'


# =====================================================================
# TEST 8: Metadata remains associated with correct video ID
# =====================================================================
def test_case_8_metadata_integrity(yt_service):
    videos = yt_service.get_videos_for_skill("JavaScript", stage="learn")
    for v in videos:
        vid_id = v['id']
        assert vid_id in v['url'], f"URL {v['url']} does not contain video ID {vid_id}"
        assert vid_id in v['embed_url'], f"Embed URL {v['embed_url']} does not contain video ID {vid_id}"
        assert vid_id in v['thumbnail'], f"Thumbnail {v['thumbnail']} does not contain video ID {vid_id}"
        assert v['title'], "Title must not be empty"
        assert v['channel'], "Channel must not be empty"
        assert v['duration'], "Duration must not be empty"
        # Contextual label belongs in recommendation_reason / learning_focus, not title
        assert 'Core JavaScript Concepts' not in v['title']


# =====================================================================
# TEST 9: Different stages return stage-appropriate, non-duplicated videos
# =====================================================================
def test_case_9_stage_specific_recommendations(yt_service):
    learn = yt_service.get_videos_for_skill("JavaScript", stage="learn")
    practice = yt_service.get_videos_for_skill("JavaScript", stage="practice")
    build = yt_service.get_videos_for_skill("JavaScript", stage="build")
    assess = yt_service.get_videos_for_skill("JavaScript", stage="assess")

    learn_ids = [v['id'] for v in learn]
    practice_ids = [v['id'] for v in practice]
    build_ids = [v['id'] for v in build]
    assess_ids = [v['id'] for v in assess]

    # All internal lists must have zero duplicates
    assert len(learn_ids) == len(set(learn_ids))
    assert len(practice_ids) == len(set(practice_ids))
    assert len(build_ids) == len(set(build_ids))
    assert len(assess_ids) == len(set(assess_ids))

    # Practice and Assess should not be identical copies of Learn
    assert learn_ids != practice_ids
    assert learn_ids != assess_ids


# =====================================================================
# TEST 10: Different skills do not accidentally share duplicated objects
# =====================================================================
def test_case_10_different_skills_distinct(yt_service):
    js_videos = yt_service.get_videos_for_skill("JavaScript")
    py_videos = yt_service.get_videos_for_skill("Python")

    js_ids = {v['id'] for v in js_videos}
    py_ids = {v['id'] for v in py_videos}

    # JavaScript and Python must have completely disjoint video sets
    assert js_ids.isdisjoint(py_ids)


# =====================================================================
# TEST 11: Cache returns correct unique recommendation set
# =====================================================================
def test_case_11_cache_integrity(yt_service):
    first_call = yt_service.get_videos_for_skill("React", stage="learn")
    second_call = yt_service.get_videos_for_skill("React", stage="learn")

    assert len(first_call) == len(second_call)
    ids = [v['id'] for v in second_call]
    assert len(ids) == len(set(ids)), "Cached response must not contain duplicates"
    assert [v['id'] for v in first_call] == [v['id'] for v in second_call]


# =====================================================================
# TEST 12: Language changes do not accidentally reuse previous language
# =====================================================================
def test_case_12_language_separation(yt_service):
    en_videos = yt_service.get_videos_for_skill("React", language="en")
    hi_videos = yt_service.get_videos_for_skill("React", language="hi")

    assert en_videos[0]['language'] == 'en'
    assert hi_videos[0]['language'] == 'hi'


# =====================================================================
# TEST 13: No DSA fallback appears for unrelated skills
# =====================================================================
def test_case_13_no_dsa_fallback(yt_service):
    dsa_video_id = '0IAPZzGSbME'
    test_skills = ["MongoDB", "Terraform", "Solidity", "Power BI", "System Design"]

    for skill in test_skills:
        videos = yt_service.get_videos_for_skill(skill)
        ids = [v['id'] for v in videos]
        assert dsa_video_id not in ids, f"Unrelated skill {skill} received DSA fallback video!"


# =====================================================================
# TEST 14: Backend response contains unique video IDs before frontend
# =====================================================================
def test_case_14_backend_response_strictly_unique(yt_service):
    test_skills = ["JavaScript", "Python", "SQL", "React", "MongoDB", "Power BI", "System Design", "Terraform", "Solidity"]
    for sk in test_skills:
        for stage in ['learn', 'practice', 'build', 'assess']:
            videos = yt_service.get_videos_for_skill(sk, stage=stage)
            ids = [v['id'] for v in videos]
            assert len(ids) == len(set(ids)), f"Duplicate IDs returned by backend for {sk} ({stage}): {ids}"


# =====================================================================
# TEST 15: Frontend defensive deduplication simulation
# =====================================================================
def test_case_15_defensive_deduplication():
    # Simulate a raw payload with duplicates that might reach deduplication helper
    raw_payload = [
        {'id': 'W6NZfCO5SIk', 'title': 'JavaScript Tutorial', 'duration': '1 hr'},
        {'id': 'W6NZfCO5SIk', 'title': 'JavaScript Advanced', 'duration': '35 mins'},
        {'id': 'jS4aFq5-91M', 'title': 'JavaScript Full Course', 'duration': '7 hrs'}
    ]
    deduped = deduplicate_youtube_videos(raw_payload)
    assert len(deduped) == 2
    assert [v['id'] for v in deduped] == ['W6NZfCO5SIk', 'jS4aFq5-91M']
    # Canonical duration and title of first occurrence preserved
    assert deduped[0]['title'] == 'JavaScript Tutorial'
    assert deduped[0]['duration'] == '48:16'
    assert deduped[0]['duration_seconds'] == 2896
