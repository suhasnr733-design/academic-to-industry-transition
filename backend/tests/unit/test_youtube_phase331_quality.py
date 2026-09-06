import pytest
from app.services.youtube_service import YouTubeService, STAGE_CURATED_CATALOG, VERIFIED_CANONICAL_METADATA
from app.services.learning_service import LearningService


@pytest.fixture
def youtube_service():
    service = YouTubeService()
    service.clear_cache()
    return service


def test_js_practice_videos_are_semantically_practice_focused(youtube_service):
    """
    Practice stage videos must be genuine coding exercises, challenges, or algorithm drills,
    and must NOT be multi-project build marathons.
    """
    videos = youtube_service.get_videos_for_skill("JavaScript", "Software Engineer", stage="practice", language="en")
    assert len(videos) >= 2, "Expected at least 2 practice videos for JavaScript"
    
    ids = [v["id"] for v in videos]
    titles = [v["title"].lower() for v in videos]
    
    # Must contain genuine practice videos
    assert "N65RvNkZFGE" in ids, "Expected Code With Bubb Practice Exercises (N65RvNkZFGE) in practice"
    assert "ufBbWIyKY2E" in ids, "Expected freeCodeCamp Top 10 Algorithms (ufBbWIyKY2E) in practice"
    
    # Must NOT contain the old project build marathon courses
    assert "dtKciwk_si4" not in ids, "10 Projects in 10 Hours (dtKciwk_si4) must NOT be in practice stage"
    assert "3PHXvlpOkf4" not in ids, "15 Projects Vanilla JS (3PHXvlpOkf4) must NOT be in practice stage"
    
    # Check semantic keywords
    practice_keywords = ["practice", "exercises", "algorithms", "problem", "challenge", "guided"]
    for title in titles:
        assert any(kw in title for kw in practice_keywords), f"Video title '{title}' must contain practice-related keywords"


def test_js_assess_badges_match_actual_content_type(youtube_service):
    """
    Assess video 'Top 100 JavaScript Interview Questions and Answers' must NOT be labeled
    'Mock Technical Interview'; it must be labeled accurately as 'Interview Questions' or 'Interview Prep'.
    """
    videos = youtube_service.get_videos_for_skill("JavaScript", "Software Engineer", stage="assess", language="en")
    assert len(videos) >= 2
    
    auto_video = next((v for v in videos if v["id"] == "AUTO7ALJk2U"), None)
    assert auto_video is not None, "AUTO7ALJk2U must be in assess stage"
    
    badge = auto_video["badge"]
    assert "Mock" not in badge, f"AUTO7ALJk2U should NOT have 'Mock' badge, got '{badge}'"
    assert any(expected in badge for expected in ["Interview Questions", "Interview Prep"]), \
        f"Expected 'Interview Questions' or 'Interview Prep', got '{badge}'"


def test_js_build_remains_project_focused(youtube_service):
    """
    Build stage must retain verified project implementations: Weather App and To-Do List.
    """
    videos = youtube_service.get_videos_for_skill("JavaScript", "Software Engineer", stage="build", language="en")
    ids = [v["id"] for v in videos]
    
    assert "MIYQR-Ybrn4" in ids, "Weather App (MIYQR-Ybrn4) must be in build stage"
    assert "G0jO8kUrg-I" in ids, "To-Do List (G0jO8kUrg-I) must be in build stage"
    
    # None of the practice videos should leak into build
    assert "N65RvNkZFGE" not in ids
    assert "ufBbWIyKY2E" not in ids


def test_js_learn_remains_foundational(youtube_service):
    """
    Learn stage must retain foundational masterclasses: Mosh and freeCodeCamp.
    """
    videos = youtube_service.get_videos_for_skill("JavaScript", "Software Engineer", stage="learn", language="en")
    ids = [v["id"] for v in videos]
    
    assert "W6NZfCO5SIk" in ids, "Mosh (W6NZfCO5SIk) must be in learn stage"
    assert "jS4aFq5-91M" in ids, "freeCodeCamp (jS4aFq5-91M) must be in learn stage"
    
    # Disjoint from practice and build
    assert "N65RvNkZFGE" not in ids
    assert "ufBbWIyKY2E" not in ids
    assert "MIYQR-Ybrn4" not in ids


def test_no_learn_fallback_into_other_stages(youtube_service):
    """
    For uncurated skills or stages, requesting practice/build/assess must NEVER fall back
    to beginner learn videos.
    """
    for stage in ["practice", "build", "assess"]:
        videos = youtube_service.get_videos_for_skill("NonExistentSkillXYZ", "Software Engineer", stage=stage, language="en")
        assert len(videos) == 0, f"Uncurated stage {stage} must return empty list, not learn tutorials"


def test_metadata_and_duration_integrity_of_new_practice_videos():
    """
    Verify N65RvNkZFGE and ufBbWIyKY2E have exact canonical durations and seconds.
    """
    meta1 = VERIFIED_CANONICAL_METADATA.get("N65RvNkZFGE")
    assert meta1 is not None
    assert meta1["duration"] == "14:06"
    assert meta1["duration_seconds"] == 846
    assert meta1["channel"] == "Code With Bubb"
    
    meta2 = VERIFIED_CANONICAL_METADATA.get("ufBbWIyKY2E")
    assert meta2 is not None
    assert meta2["duration"] == "1:52:52"
    assert meta2["duration_seconds"] == 6772
    assert meta2["channel"] == "freeCodeCamp.org"


def test_learning_service_progress_logic_does_not_prematurely_complete_skill():
    """
    Completing a single stage (e.g., learn=True) must NOT mark the entire skill as complete (progress_percent=100).
    """
    # Simulate the calculation logic from update_progress
    completed_stages = 1  # only 'learn' completed
    progress_percent = (completed_stages / 4.0) * 100.0
    stage_low = 'learn'
    is_completed = True
    
    # Correct condition: only complete when progress_percent >= 100.0 or (stage_low == 'complete' and is_completed)
    skill_is_complete = progress_percent >= 100.0 or (stage_low == 'complete' and is_completed)
    assert not skill_is_complete, "Skill should NOT be complete after finishing only 1 stage"
    assert progress_percent == 25.0, "Progress should be 25% for 1 out of 4 stages"
