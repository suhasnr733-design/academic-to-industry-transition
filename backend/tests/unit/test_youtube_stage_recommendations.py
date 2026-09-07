# backend/tests/unit/test_youtube_stage_recommendations.py

import pytest
from app.services.youtube_service import (
    YouTubeService,
    VERIFIED_CANONICAL_METADATA,
    STAGE_CURATED_CATALOG
)


@pytest.fixture
def yt_service():
    yt = YouTubeService()
    yt.api_key = None  # Force curated/fallback path
    yt.clear_cache()
    return yt


# =====================================================================
# TEST 1: JavaScript Stage Disjointness & Badge Integrity
# =====================================================================
def test_javascript_stage_isolation(yt_service):
    learn = yt_service.get_videos_for_skill("JavaScript", stage="learn")
    practice = yt_service.get_videos_for_skill("JavaScript", stage="practice")
    build = yt_service.get_videos_for_skill("JavaScript", stage="build")
    assess = yt_service.get_videos_for_skill("JavaScript", stage="assess")

    assert len(learn) >= 2
    assert len(practice) >= 1
    assert len(build) >= 2
    assert len(assess) >= 2

    learn_ids = {v['id'] for v in learn}
    practice_ids = {v['id'] for v in practice}
    build_ids = {v['id'] for v in build}
    assess_ids = {v['id'] for v in assess}

    # All stages must be mutually exclusive (pairwise disjoint)
    assert learn_ids.isdisjoint(practice_ids)
    assert learn_ids.isdisjoint(build_ids)
    assert learn_ids.isdisjoint(assess_ids)
    assert practice_ids.isdisjoint(build_ids)
    assert practice_ids.isdisjoint(assess_ids)
    assert build_ids.isdisjoint(assess_ids)

    # Verify badge semantics
    for v in assess:
        assert 'Interview' in v['badge'] or 'Mock' in v['badge'] or 'Assessment' in v['badge']
        assert 'Masterclass' not in v['badge']

    for v in build:
        assert 'Project' in v['badge'] or 'Build' in v['badge'] or 'Architecture' in v['badge']

    for v in practice:
        assert 'Practice' in v['badge'] or 'Exercise' in v['badge'] or 'Code' in v['badge']


# =====================================================================
# TEST 2: Python Build Bug Fix — No C/C++ Course
# =====================================================================
def test_python_build_c_cpp_bug_fixed(yt_service):
    build = yt_service.get_videos_for_skill("Python", stage="build")
    assert len(build) > 0
    build_ids = [v['id'] for v in build]

    # B31LgI4Y4DQ is "Data Structures Using C and C++" - must NEVER appear in Python build!
    assert 'B31LgI4Y4DQ' not in build_ids
    # XGf2GcyHPhc is "Learn Python by Building Five Games - Full Course"
    assert 'XGf2GcyHPhc' in build_ids
    assert 'Python' in build[0]['title']


# =====================================================================
# TEST 3: Python Stage Disjointness
# =====================================================================
def test_python_stage_isolation(yt_service):
    learn = yt_service.get_videos_for_skill("Python", stage="learn")
    practice = yt_service.get_videos_for_skill("Python", stage="practice")
    build = yt_service.get_videos_for_skill("Python", stage="build")
    assess = yt_service.get_videos_for_skill("Python", stage="assess")

    learn_ids = {v['id'] for v in learn}
    practice_ids = {v['id'] for v in practice}
    build_ids = {v['id'] for v in build}
    assess_ids = {v['id'] for v in assess}

    assert learn_ids.isdisjoint(practice_ids)
    assert learn_ids.isdisjoint(build_ids)
    assert learn_ids.isdisjoint(assess_ids)
    assert practice_ids.isdisjoint(build_ids)
    assert practice_ids.isdisjoint(assess_ids)
    assert build_ids.isdisjoint(assess_ids)

    # Assess must include Corey Schafer interview prep
    assert 'DEwgZNC-KyE' in assess_ids


# =====================================================================
# TEST 4: React Practice Bug Fix — No Docker Course
# =====================================================================
def test_react_practice_docker_bug_fixed(yt_service):
    practice = yt_service.get_videos_for_skill("React", stage="practice")
    assert len(practice) > 0
    practice_ids = [v['id'] for v in practice]

    # fqMOX6JJhGo is "Docker & DevOps Pipeline Fundamentals" - must NEVER appear in React practice!
    assert 'fqMOX6JJhGo' not in practice_ids
    # Must contain real React project practice
    assert 'a_7Z7C_JCyo' in practice_ids or '4UZrsTqkcW4' in practice_ids


# =====================================================================
# TEST 5: React Stage Disjointness
# =====================================================================
def test_react_stage_isolation(yt_service):
    learn = yt_service.get_videos_for_skill("React", stage="learn")
    practice = yt_service.get_videos_for_skill("React", stage="practice")
    build = yt_service.get_videos_for_skill("React", stage="build")
    assess = yt_service.get_videos_for_skill("React", stage="assess")

    assert len(learn) >= 2
    assert len(practice) >= 2
    assert len(build) >= 1
    assert len(assess) >= 2

    learn_ids = {v['id'] for v in learn}
    practice_ids = {v['id'] for v in practice}
    build_ids = {v['id'] for v in build}
    assess_ids = {v['id'] for v in assess}

    assert learn_ids.isdisjoint(practice_ids)
    assert learn_ids.isdisjoint(build_ids)
    assert learn_ids.isdisjoint(assess_ids)
    assert practice_ids.isdisjoint(build_ids)
    assert practice_ids.isdisjoint(assess_ids)
    assert build_ids.isdisjoint(assess_ids)


# =====================================================================
# TEST 6: SQL Stage Disjointness & Authenticity
# =====================================================================
def test_sql_stage_isolation(yt_service):
    learn = yt_service.get_videos_for_skill("SQL", stage="learn")
    practice = yt_service.get_videos_for_skill("SQL", stage="practice")
    build = yt_service.get_videos_for_skill("SQL", stage="build")
    assess = yt_service.get_videos_for_skill("SQL", stage="assess")

    assert len(learn) >= 2
    assert len(practice) >= 2
    assert len(build) >= 2
    assert len(assess) >= 2

    learn_ids = {v['id'] for v in learn}
    practice_ids = {v['id'] for v in practice}
    build_ids = {v['id'] for v in build}
    assess_ids = {v['id'] for v in assess}

    assert learn_ids.isdisjoint(practice_ids)
    assert learn_ids.isdisjoint(build_ids)
    assert learn_ids.isdisjoint(assess_ids)
    assert practice_ids.isdisjoint(build_ids)
    assert practice_ids.isdisjoint(assess_ids)
    assert build_ids.isdisjoint(assess_ids)


# =====================================================================
# TEST 7: MongoDB Stage Disjointness
# =====================================================================
def test_mongodb_stage_isolation(yt_service):
    learn = yt_service.get_videos_for_skill("MongoDB", stage="learn")
    practice = yt_service.get_videos_for_skill("MongoDB", stage="practice")
    build = yt_service.get_videos_for_skill("MongoDB", stage="build")
    assess = yt_service.get_videos_for_skill("MongoDB", stage="assess")

    assert len(learn) >= 1
    assert len(practice) >= 1
    assert len(build) >= 1
    assert len(assess) >= 2

    learn_ids = {v['id'] for v in learn}
    practice_ids = {v['id'] for v in practice}
    build_ids = {v['id'] for v in build}
    assess_ids = {v['id'] for v in assess}

    assert learn_ids.isdisjoint(practice_ids)
    assert learn_ids.isdisjoint(build_ids)
    assert learn_ids.isdisjoint(assess_ids)
    assert practice_ids.isdisjoint(build_ids)
    assert practice_ids.isdisjoint(assess_ids)
    assert build_ids.isdisjoint(assess_ids)


# =====================================================================
# TEST 8: System Design Stage Disjointness
# =====================================================================
def test_system_design_stage_isolation(yt_service):
    learn = yt_service.get_videos_for_skill("System Design", stage="learn")
    practice = yt_service.get_videos_for_skill("System Design", stage="practice")
    assess = yt_service.get_videos_for_skill("System Design", stage="assess")

    assert len(learn) >= 1
    assert len(practice) >= 1
    assert len(assess) >= 2

    learn_ids = {v['id'] for v in learn}
    practice_ids = {v['id'] for v in practice}
    assess_ids = {v['id'] for v in assess}

    assert learn_ids.isdisjoint(practice_ids)
    assert learn_ids.isdisjoint(assess_ids)
    assert practice_ids.isdisjoint(assess_ids)

    # Tushar Roy interview video must be in assess
    assert 'UzLMhqg3_Wc' in assess_ids


# =====================================================================
# TEST 9: Uncurated Stage Safe Empty (No Fake Learn Fallback)
# =====================================================================
def test_uncurated_stage_safe_empty(yt_service):
    """
    Power BI currently only has curated 'learn' videos in STAGE_CURATED_CATALOG.
    Requesting 'assess' must NOT return the beginner tutorial disguised with an interview badge!
    When dynamic search is disabled, it must return safe empty [].
    When dynamic search is enabled, returned videos must be genuine interview videos, never TmhQCQr_DCA.
    """
    assess_curated = yt_service.get_videos_for_skill("Power BI", stage="assess", enable_dynamic=False)
    assert assess_curated == []

    assess = yt_service.get_videos_for_skill("Power BI", stage="assess")
    # Must NEVER return beginner tutorial TmhQCQr_DCA
    assess_ids = [v['id'] for v in assess]
    assert 'TmhQCQr_DCA' not in assess_ids

    # But learn must still return genuine Power BI video
    learn = yt_service.get_videos_for_skill("Power BI", stage="learn")
    assert len(learn) > 0
    assert learn[0]['id'] == 'TmhQCQr_DCA'


# =====================================================================
# TEST 10: Canonical Duration Integrity Across All Stages
# =====================================================================
def test_stage_duration_integrity(yt_service):
    skills = ['JavaScript', 'Python', 'React', 'SQL', 'MongoDB', 'System Design']
    stages = ['learn', 'practice', 'build', 'assess']

    for sk in skills:
        for st in stages:
            videos = yt_service.get_videos_for_skill(sk, stage=st)
            for v in videos:
                vid_id = v['id']
                # Every returned video must have valid canonical duration
                assert v.get('duration') is not None
                assert v.get('duration_seconds') is not None
                assert v['duration_seconds'] > 0
                assert v['duration'] not in ['1 hr 8 mins', '45 mins', '40 mins', 'Duration unavailable']

                if vid_id in VERIFIED_CANONICAL_METADATA:
                    expected = VERIFIED_CANONICAL_METADATA[vid_id]
                    assert v['duration'] == expected['duration']
                    assert v['duration_seconds'] == expected['duration_seconds']
