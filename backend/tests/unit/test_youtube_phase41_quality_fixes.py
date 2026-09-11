# backend/tests/unit/test_youtube_phase41_quality_fixes.py
import pytest
from unittest.mock import patch, MagicMock
from app.services.youtube_service import (
    YouTubeService,
    STAGE_CURATED_CATALOG,
    SKILL_VIDEO_MAP,
    is_video_matching_stage_intent,
    is_video_relevant_to_skill,
    normalize_skill_name
)


@pytest.fixture
def youtube_service():
    service = YouTubeService()
    return service


# =====================================================================
# TEST 1: Cross-Stage Video Exclusion (AI Native Dev & Algorithms)
# =====================================================================
def test_cross_stage_exclusion_ai_native_dev_and_algorithms(youtube_service):
    """
    FIX 1: Verify that a video accepted in one stage cannot be accepted
    in another stage for the same skill.
    """
    # 1. AI Native Development: 9u6xvcNJaxc and e1a3WuxTY-k are in learn stage
    disallowed_for_build = youtube_service._get_disallowed_stage_ids(
        "AI Native Development", "Full Stack Developer", "build"
    )
    
    # 2. Curated catalog exclusion check: System Design learn ID m8Icp_Cid5o must be disallowed in build & practice
    sd_disallowed_build = youtube_service._get_disallowed_stage_ids(
        "System Design", "Software Engineer", "build"
    )
    assert "m8Icp_Cid5o" in sd_disallowed_build

    # 3. Simulate cache containing learn video and verify disallowed for practice/build/assess
    norm_skill = normalize_skill_name("AI Native Development")
    with youtube_service._cache_lock:
        youtube_service._cache[f"{norm_skill}|software engineer|learn|en|4"] = [
            {"id": "9u6xvcNJaxc", "title": "The 4 Patterns of AI Native Development"},
            {"id": "e1a3WuxTY-k", "title": "What is AI Native Development"}
        ]
        youtube_service._cache[f"algorithms|software engineer|practice|en|4"] = [
            {"id": "ft0owvS5tQA", "title": "Top 6 Coding Interview Concepts"}
        ]

    # Verify AI Native Dev IDs disallowed in Build
    disallowed_build = youtube_service._get_disallowed_stage_ids("AI Native Development", "Software Engineer", "build")
    assert "9u6xvcNJaxc" in disallowed_build
    assert "e1a3WuxTY-k" in disallowed_build

    # Verify Algorithms Practice ID disallowed in Assess
    disallowed_assess = youtube_service._get_disallowed_stage_ids("Algorithms", "Software Engineer", "assess")
    assert "ft0owvS5tQA" in disallowed_assess

    # Verify unrelated skill is NOT blocked
    python_disallowed = youtube_service._get_disallowed_stage_ids("Python", "Software Engineer", "practice")
    assert "ft0owvS5tQA" not in python_disallowed
    assert "9u6xvcNJaxc" not in python_disallowed


# =====================================================================
# TEST 2: System Design Curated Duplicate Removal
# =====================================================================
def test_system_design_curated_duplicate_removed(youtube_service):
    """
    FIX 2: Verify m8Icp_Cid5o appears in System Design -> Learn but NOT in Build.
    Build stage is empty rather than duplicating Learn video.
    """
    sd_catalog = STAGE_CURATED_CATALOG.get('system design', {})
    
    # Learn must contain m8Icp_Cid5o
    learn_ids = [item['id'] for item in sd_catalog.get('learn', [])]
    assert 'm8Icp_Cid5o' in learn_ids

    # Build must NOT contain m8Icp_Cid5o
    build_ids = [item['id'] for item in sd_catalog.get('build', [])]
    assert 'm8Icp_Cid5o' not in build_ids
    assert len(build_ids) == 0  # Verified empty rather than forced invalid video

    # Assess must have interview prep
    assess_ids = [item['id'] for item in sd_catalog.get('assess', [])]
    assert 'UzLMhqg3_Wc' in assess_ids
    assert 'SgWb6tWx3S8' in assess_ids


# =====================================================================
# TEST 3: YouTube Shorts Rejection (< 120s or #short in title)
# =====================================================================
def test_shorts_rejection_for_practice_and_build(youtube_service):
    """
    FIX 3: Verify dynamic acceptance rejects videos with duration_seconds < 120
    or #short/#shorts in title for Practice and Build.
    """
    # Mock search.list & videos.list response
    mock_search_items = [
        # 18-second video: Algorithms build short (6rzzQsN4zDA)
        {"id": {"videoId": "6rzzQsN4zDA"}, "snippet": {"title": "Visualize algorithms in real time #coding", "channelTitle": "SetupsAI"}},
        # 20-second video: DSA project short (HaJsuSLh9c4)
        {"id": {"videoId": "HaJsuSLh9c4"}, "snippet": {"title": "5 DSA Projects for Resume | Projects using Data Structures and Algorithms: #ytshorts", "channelTitle": "Codelopment"}},
        # Normal 2+ minute video (e.g. 15 minutes = 900s)
        {"id": {"videoId": "validVid123"}, "snippet": {"title": "Build a Complete Algorithms Visualizer Project", "channelTitle": "CodeLab"}}
    ]

    mock_videos_items = [
        {"id": "6rzzQsN4zDA", "status": {"embeddable": True}, "contentDetails": {"duration": "PT18S"}},
        {"id": "HaJsuSLh9c4", "status": {"embeddable": True}, "contentDetails": {"duration": "PT20S"}},
        {"id": "validVid123", "status": {"embeddable": True}, "contentDetails": {"duration": "PT15M"}}
    ]

    with patch.object(youtube_service._http_session, 'get') as mock_get:
        # First call is search, second is videos
        res_search = MagicMock()
        res_search.status_code = 200
        res_search.json.return_value = {"items": mock_search_items}

        res_videos = MagicMock()
        res_videos.status_code = 200
        res_videos.json.return_value = {"items": mock_videos_items}

        mock_get.side_effect = [res_search, res_videos]

        with patch.object(youtube_service, 'api_key', 'test_key'):
            results = youtube_service._fetch_from_youtube_api(
                ["Algorithms project tutorial"], "Algorithms", "Software Engineer", "build"
            )

        returned_ids = [v['id'] for v in results]
        assert "6rzzQsN4zDA" not in returned_ids, "18-second short should be rejected from Build"
        assert "HaJsuSLh9c4" not in returned_ids, "20-second short should be rejected from Build"
        assert "validVid123" in returned_ids, "15-minute video should be accepted"


# =====================================================================
# TEST 4: MongoDB Practice Semantic Validation
# =====================================================================
def test_mongodb_practice_semantic_validation():
    """
    FIX 4: MongoDB Practice prefers CRUD/query/aggregation exercises
    and rejects generic beginner courses without hands-on practice keywords.
    """
    # Valid Practice Titles
    assert is_video_matching_stage_intent("practice", "MongoDB CRUD Operations and Queries Exercises")
    assert is_video_matching_stage_intent("practice", "MongoDB Aggregation Pipeline Practice Lab")
    assert is_video_matching_stage_intent("practice", "Hands-On MongoDB Practice Problems with Solutions")

    # Rejected Generic Titles
    assert not is_video_matching_stage_intent("practice", "MongoDB Complete Course for Beginners")
    assert not is_video_matching_stage_intent("practice", "MongoDB In 30 Minutes")
    assert not is_video_matching_stage_intent("practice", "MongoDB Fundamentals Course")


# =====================================================================
# TEST 5: SQL Practice Semantic Validation
# =====================================================================
def test_sql_practice_semantic_validation():
    """
    FIX 4: SQL Practice prefers query exercises and challenges,
    rejecting conceptual database design courses or generic lectures.
    """
    # Valid Practice Titles
    assert is_video_matching_stage_intent("practice", "SQL Query Practice Problems with Solutions")
    assert is_video_matching_stage_intent("practice", "50 SQL Practice Queries Coding Challenge")
    assert is_video_matching_stage_intent("practice", "Hands-On SQL Lab Walkthrough")

    # Rejected Generic Titles
    assert not is_video_matching_stage_intent("practice", "SQL Complete Course for Beginners")
    assert not is_video_matching_stage_intent("practice", "SQL Fundamentals Course")
    assert not is_video_matching_stage_intent("practice", "Database Design Course - Learn how to design and plan a database")


# =====================================================================
# TEST 6: REST APIs Practice Semantic Validation
# =====================================================================
def test_rest_apis_practice_semantic_validation():
    """
    FIX 4: REST APIs Practice prefers API testing and Postman exercises,
    rejecting 19-hour generic beginner courses.
    """
    # Valid Practice Titles
    assert is_video_matching_stage_intent("practice", "REST API Testing with Postman - Hands-on Exercises")
    assert is_video_matching_stage_intent("practice", "REST API Endpoint Testing and Debugging Practice")
    assert is_video_matching_stage_intent("practice", "API Coding Challenges with Solutions")

    # Rejected Generic Titles
    assert not is_video_matching_stage_intent("practice", "Python API Development - Comprehensive Course for Beginners")
    assert not is_video_matching_stage_intent("practice", "REST APIs Complete Course")
    assert not is_video_matching_stage_intent("practice", "REST API Fundamentals Course")


# =====================================================================
# TEST 7: React Practice Semantic Validation
# =====================================================================
def test_react_practice_semantic_validation():
    """
    FIX 4: React Practice prefers coding challenges and hooks exercises,
    rejecting generic full courses.
    """
    # Valid Practice Titles
    assert is_video_matching_stage_intent("practice", "React Coding Challenges and Exercises with Solutions")
    assert is_video_matching_stage_intent("practice", "React Hooks Hands-On Practice Walkthrough")
    assert is_video_matching_stage_intent("practice", "React Component Debugging Practice Lab")

    # Rejected Generic Titles
    assert not is_video_matching_stage_intent("practice", "React JS Full Course for Beginners")
    assert not is_video_matching_stage_intent("practice", "Full React Course 2020 - Learn Fundamentals")
    assert not is_video_matching_stage_intent("practice", "React Complete Course")


# =====================================================================
# TEST 8: Terraform Practice Semantic Validation
# =====================================================================
def test_terraform_practice_semantic_validation():
    """
    FIX 4: Terraform Practice prefers hands-on lab exercises,
    rejecting generic courses without practical lab indicators.
    """
    # Valid Practice Titles
    assert is_video_matching_stage_intent("practice", "Terraform Hands-On Lab Exercises with AWS")
    assert is_video_matching_stage_intent("practice", "Terraform Infrastructure as Code Practice Lab")
    assert is_video_matching_stage_intent("practice", "Practical Terraform Walkthrough Exercises")

    # Rejected Generic Titles
    assert not is_video_matching_stage_intent("practice", "Terraform Course - Automate your AWS cloud infrastructure")
    assert not is_video_matching_stage_intent("practice", "Complete Terraform Course - From BEGINNER to PRO")
    assert not is_video_matching_stage_intent("practice", "Terraform Fundamentals Course")


# =====================================================================
# TEST 9: Existing Good Recommendations Preserved
# =====================================================================
def test_existing_good_recommendations_preserved(youtube_service):
    """
    FIX 5: Ensure strong existing skills return valid, verified recommendations:
    JavaScript, Python, Docker, Git, Kubernetes, Node.js, FastAPI, AWS, Azure.
    """
    strong_skills = [
        'JavaScript', 'Python', 'Docker', 'Git',
        'Kubernetes', 'Node.js', 'FastAPI', 'AWS', 'Azure'
    ]

    for skill in strong_skills:
        # Verify learn returns curated video
        learn_vids = youtube_service.get_videos_for_skill(skill, stage='learn')
        assert len(learn_vids) >= 1, f"Expected learn video for {skill}"
        assert learn_vids[0]['id'], f"Expected valid ID for {skill} learn"
        assert learn_vids[0]['duration'] or learn_vids[0]['duration_seconds'] is not None

        # Verify assess returns interview prep
        assess_vids = youtube_service.get_videos_for_skill(skill, stage='assess')
        assert len(assess_vids) >= 1, f"Expected assess video for {skill}"
        assert assess_vids[0]['badge'] in ['🎯 Interview Prep', '🎯 Interview Questions', '🧠 Technical Assessment', '❓ Mock Technical Interview']


# =====================================================================
# TEST 10: No Learn Fallback into Non-Learn Stages
# =====================================================================
def test_no_learn_fallback_into_non_learn_stages(youtube_service):
    """
    FIX 1 & FIX 2: An unknown skill or skill without curated build/practice
    must return [] (safe empty) rather than substituting a Learn course.
    """
    # For a skill with only learn content in SKILL_VIDEO_MAP (e.g. Vue.js)
    build_vids = youtube_service.get_videos_for_skill('Vue.js', stage='build', enable_dynamic=False)
    assert build_vids == [], "Vue.js build must be empty, not fallback to Vue learn course"

    practice_vids = youtube_service.get_videos_for_skill('GraphQL', stage='practice', enable_dynamic=False)
    assert practice_vids == [], "GraphQL practice must be empty, not fallback to GraphQL learn course"

    # System Design build must now be safe empty
    sd_build = youtube_service.get_videos_for_skill('System Design', stage='build', enable_dynamic=False)
    assert sd_build == [], "System Design build must be safe empty, not m8Icp_Cid5o"
