# backend/tests/unit/test_youtube_stage_intent_engine.py
import pytest
from app.services.youtube_service import (
    score_stage_intent,
    is_video_matching_stage_intent,
    is_video_quality_and_duration_valid,
    is_video_relevant_to_skill,
    YouTubeService
)


@pytest.fixture
def youtube_service():
    return YouTubeService()


# =====================================================================
# 1. "Coding interview concepts" should not incorrectly pass Practice
# =====================================================================
def test_coding_interview_concepts_fails_practice():
    """
    'Coding interview concepts' contains 'coding' and 'concepts', but because
    it forms an interview compound phrase, it must NOT pass Practice.
    It must be recognized as Assess-oriented.
    """
    title = "Top 6 Coding Interview Concepts (Data Structures & Algorithms)"
    assert not is_video_matching_stage_intent("practice", title)
    pos_p, neg_p, net_p = score_stage_intent("practice", title)
    assert net_p < 0, f"Expected net < 0 for Practice, got {net_p}"

    # Verify it scores strongly for Assess
    assert is_video_matching_stage_intent("assess", title)
    pos_a, neg_a, net_a = score_stage_intent("assess", title)
    assert pos_a >= 3.0
    assert net_a > 0


# =====================================================================
# 2. "Coding exercises" should pass Practice
# =====================================================================
def test_coding_exercises_passes_practice():
    """'Coding exercises' should pass Practice across languages/technologies."""
    title1 = "JavaScript Practice Exercises For Beginners: Beginner Exercises Part 1"
    assert is_video_matching_stage_intent("practice", title1)

    title2 = "Python Coding Exercises for Intermediate Programmers"
    assert is_video_matching_stage_intent("practice", title2)
    pos, neg, net = score_stage_intent("practice", title2)
    assert pos >= 3.0
    assert net > 0


# =====================================================================
# 3. "Algorithm practice problems" should pass Practice
# =====================================================================
def test_algorithm_practice_problems_passes_practice():
    """'Algorithm practice problems' should pass Practice."""
    title1 = "Algorithm Practice Problems and Walkthroughs"
    assert is_video_matching_stage_intent("practice", title1)
    pos, neg, net = score_stage_intent("practice", title1)
    assert pos >= 3.0
    assert net > 0

    title2 = "Data Structures and Algorithm Exercises"
    assert is_video_matching_stage_intent("practice", title2)


# =====================================================================
# 4. "Solve coding challenges" should pass Practice
# =====================================================================
def test_solve_coding_challenges_passes_practice():
    """'Solve coding challenges' should pass Practice."""
    title = "Greedy Algorithms Tutorial – Solve Coding Challenges"
    assert is_video_matching_stage_intent("practice", title)
    pos, neg, net = score_stage_intent("practice", title)
    assert pos >= 3.0
    assert net > 0

    title2 = "Solve Coding Problems Step By Step with Python"
    assert is_video_matching_stage_intent("practice", title2)


# =====================================================================
# 5. "JavaScript interview questions" should pass Assess
# =====================================================================
def test_javascript_interview_questions_passes_assess():
    """'JavaScript interview questions' should pass Assess."""
    title = "Top 30 JavaScript Interview Questions 2025 | JavaScript Interview Questions & Answers"
    assert is_video_matching_stage_intent("assess", title)
    pos, neg, net = score_stage_intent("assess", title)
    assert pos >= 3.0
    assert net > 0

    title2 = "Top 50 JavaScript Interview Questions"
    assert is_video_matching_stage_intent("assess", title2)


# =====================================================================
# 6. "Technical interview preparation" should pass Assess
# =====================================================================
def test_technical_interview_preparation_passes_assess():
    """'Technical interview preparation' should pass Assess."""
    title1 = "Technical Interview Preparation and Mock Interview"
    assert is_video_matching_stage_intent("assess", title1)
    pos, neg, net = score_stage_intent("assess", title1)
    assert pos >= 3.0
    assert net > 0

    title2 = "Coding Interview Preparation: Most Asked Questions"
    assert is_video_matching_stage_intent("assess", title2)


# =====================================================================
# 7. "React project tutorial" should pass Build
# =====================================================================
def test_react_project_tutorial_passes_build():
    """'React project tutorial' and building applications should pass Build."""
    title1 = "React Project Tutorial - Build an E-Commerce Store from Scratch"
    assert is_video_matching_stage_intent("build", title1)
    pos, neg, net = score_stage_intent("build", title1)
    assert pos >= 3.0
    assert net > 0

    title2 = "How To Make Weather App Using JavaScript Step By Step Explained"
    assert is_video_matching_stage_intent("build", title2)

    title3 = "How to build a React project for beginners"
    assert is_video_matching_stage_intent("build", title3)


# =====================================================================
# 8. "Python full course for beginners" should pass Learn
# =====================================================================
def test_python_full_course_passes_learn():
    """'Python full course for beginners' should pass Learn."""
    title1 = "Python Full Course for Beginners [Tutorial]"
    assert is_video_matching_stage_intent("learn", title1)
    pos, neg, net = score_stage_intent("learn", title1)
    assert pos >= 2.0
    assert net > 0

    title2 = "JavaScript Tutorial for Beginners"
    assert is_video_matching_stage_intent("learn", title2)

    title3 = "MIT 6.006: Introduction to Algorithms"
    assert is_video_matching_stage_intent("learn", title3)


# =====================================================================
# 9. Short Generic Videos Fail Stage Quality Validation
# =====================================================================
def test_short_generic_video_fails_quality_validation():
    """Very short generic videos / shorts should fail stage quality validation."""
    # 47-second superficial algorithms listicle
    title_short = "Top 5 Algorithms for interviews"
    assert not is_video_quality_and_duration_valid("assess", title_short, duration_seconds=47)

    # Rejection of shorts across all stages
    assert not is_video_quality_and_duration_valid("learn", "Python in 30 Seconds #shorts", duration_seconds=30)
    assert not is_video_quality_and_duration_valid("practice", "Coding drill #short", duration_seconds=45)
    assert not is_video_quality_and_duration_valid("build", "Build app in 60s #shorts", duration_seconds=60)

    # Sub-120s learn or practice without depth
    assert not is_video_quality_and_duration_valid("learn", "Quick Intro", duration_seconds=60)
    assert not is_video_quality_and_duration_valid("practice", "Quick Exercise", duration_seconds=90)
    assert not is_video_quality_and_duration_valid("build", "Build Weather App", duration_seconds=120)


# =====================================================================
# 10. Short But Genuine Assessment / Quiz Remains Eligible
# =====================================================================
def test_short_genuine_quiz_remains_eligible():
    """A short video clearly representing a genuine quiz/question remains eligible for Assess."""
    # Focused single question / quiz / puzzle under 60s
    quiz_title = "JavaScript Quiz: What does this output? [MCQ Test]"
    assert is_video_quality_and_duration_valid("assess", quiz_title, duration_seconds=45)

    puzzle_title = "Daily Coding Puzzle: Two Sum Variant"
    assert is_video_quality_and_duration_valid("assess", puzzle_title, duration_seconds=55)


# =====================================================================
# 11. Compound Phrases Override Conflicting Individual Keyword Signals
# =====================================================================
def test_compound_phrases_override_conflicting_keywords():
    """
    Compound semantic units must be parsed before individual unigrams:
    - 'Python project tutorial': 'project tutorial' indicates Build over Learn.
    - 'React coding exercises': 'coding exercises' indicates Practice, not Learn.
    - 'SQL query practice': 'query practice' indicates Practice, not Learn.
    - 'MongoDB aggregation exercises': indicates Practice, not Learn.
    - 'JavaScript interview questions': indicates Assess, not Practice.
    """
    # 1. "Python project tutorial" -> Build, not Learn
    proj = "Python Project Tutorial for Beginners"
    assert is_video_matching_stage_intent("build", proj)
    assert not is_video_matching_stage_intent("learn", proj)

    # 2. "React coding exercises" -> Practice, not Learn
    exercises = "React Coding Exercises with Solutions"
    assert is_video_matching_stage_intent("practice", exercises)
    assert not is_video_matching_stage_intent("learn", exercises)

    # 3. "SQL query practice" -> Practice
    sql = "SQL Query Practice: 20 Hands-on Problems"
    assert is_video_matching_stage_intent("practice", sql)

    # 4. "MongoDB aggregation exercises" -> Practice
    mongo = "MongoDB Aggregation Exercises and Challenges"
    assert is_video_matching_stage_intent("practice", mongo)

    # 5. "JavaScript interview questions" -> Assess, not Practice
    interview = "JavaScript Interview Questions & Answers"
    assert is_video_matching_stage_intent("assess", interview)
    assert not is_video_matching_stage_intent("practice", interview)


# =====================================================================
# 12. Cross-Stage Duplicate Protection Must Remain Intact
# =====================================================================
def test_cross_stage_duplicate_protection_intact(youtube_service):
    """Ensure no video ID is duplicated across stages for a skill."""
    stages = ["learn", "practice", "build", "assess"]
    seen_ids = set()

    for st in stages:
        videos = youtube_service.get_videos_for_skill("JavaScript", stage=st)
        for v in videos:
            vid_id = v.get("id")
            if vid_id:
                assert vid_id not in seen_ids, f"Cross-stage duplicate detected: {vid_id} in {st}"
                seen_ids.add(vid_id)


# =====================================================================
# 13. Existing JavaScript Recommendations Must Remain Valid
# =====================================================================
def test_existing_javascript_recommendations_valid(youtube_service):
    """Ensure JavaScript recommendations across all stages remain valid and high quality."""
    learn = youtube_service.get_videos_for_skill("JavaScript", stage="learn")
    practice = youtube_service.get_videos_for_skill("JavaScript", stage="practice")
    build = youtube_service.get_videos_for_skill("JavaScript", stage="build")
    assess = youtube_service.get_videos_for_skill("JavaScript", stage="assess")

    assert len(learn) >= 1
    assert len(practice) >= 1
    assert len(build) >= 1
    assert len(assess) >= 1

    # Specifically confirm 'Top 10 Javascript Algorithms to Prepare for Coding Interviews'
    # is still in Practice because its real algorithmic practice outweighs contextual interview mention
    practice_ids = [v["id"] for v in practice]
    assert "ufBbWIyKY2E" in practice_ids

    # Confirm all videos match their stage intent
    for v in learn:
        assert is_video_matching_stage_intent("learn", v["title"])
    for v in practice:
        assert is_video_matching_stage_intent("practice", v["title"])
    for v in build:
        assert is_video_matching_stage_intent("build", v["title"])
    for v in assess:
        assert is_video_matching_stage_intent("assess", v["title"])


# =====================================================================
# 14. Existing Algorithms Recommendations Re-evaluated
# =====================================================================
def test_existing_algorithms_recommendations_reevaluated(youtube_service):
    """
    Ensure Algorithms skill recommendations reflect the generic improvements:
    - LEARN: MIT 6.006 (Introduction to Algorithms)
    - PRACTICE: Greedy Algorithms Tutorial (Solve Coding Challenges),
                and 'Top 6 Coding Interview Concepts' is EXCLUDED
    - BUILD: Safe empty state [] (honest empty state, no forced low-quality videos)
    - ASSESS: Top 7 Algorithms (21:22) and Top 5 Algorithms (6:09),
              and the 0:47 teaser clip 'Top 5 Algorithms for interviews' is EXCLUDED
    """
    learn = youtube_service.get_videos_for_skill("Algorithms", target_role="Full Stack Developer", stage="learn", max_results=4)
    practice = youtube_service.get_videos_for_skill("Algorithms", target_role="Full Stack Developer", stage="practice", max_results=4)
    build = youtube_service.get_videos_for_skill("Algorithms", target_role="Full Stack Developer", stage="build", max_results=4)
    assess = youtube_service.get_videos_for_skill("Algorithms", target_role="Full Stack Developer", stage="assess", max_results=4)

    # Learn
    assert len(learn) >= 1
    assert any("MIT 6.006" in v["title"] or "Introduction to Algorithms" in v["title"] for v in learn)

    # Practice
    practice_ids = [v["id"] for v in practice]
    assert "ft0owvS5tQA" not in practice_ids, "Top 6 Coding Interview Concepts must NOT be in Practice!"
    assert any("Greedy Algorithms" in v["title"] for v in practice)

    # Build: Genuine build projects discovered via generic dynamic search
    assert len(build) >= 1
    for v in build:
        assert is_video_matching_stage_intent("build", v["title"])
        assert is_video_quality_and_duration_valid("build", v["title"], v.get("duration_seconds"))

    # Assess: Top 7 and Top 5 valid, short 0:47 teaser excluded
    assess_ids = [v["id"] for v in assess]
    assert "PjiH9yQZYa0" not in assess_ids, "0:47 teaser short 'Top 5 Algorithms for interviews' must NOT be in Assess!"
    assert any("Top 7 Algorithms" in v["title"] for v in assess)
    assert any("Top 5 Algorithms To Crack Interviews" in v["title"] for v in assess)


# =====================================================================
# 15. Generic Build Semantics: Implementation & Visualizer Projects
# =====================================================================
def test_generic_build_semantics_implementation_and_visualizer():
    """
    Verify generic Build engine recognizes legitimate implementation-oriented phrases
    and rejects conceptual/learning content:
    - 'Build an Algorithm Visualizer' -> Build
    - 'Implement Dijkstra's Algorithm in a Project' -> Build
    - 'Algorithm Visualization Project' -> Build
    - 'Build a Pathfinding Application' -> Build
    - 'Introduction to Algorithms' -> Learn, not Build
    - 'Algorithms Full Course' -> Learn, not Build
    - 'Algorithms Concepts Explained' -> Learn, not Build
    """
    # Valid Build titles
    assert is_video_matching_stage_intent("build", "Build an Algorithm Visualizer")
    assert is_video_matching_stage_intent("build", "Implement Dijkstra's Algorithm in a Project")
    assert is_video_matching_stage_intent("build", "Algorithm Visualization Project")
    assert is_video_matching_stage_intent("build", "Build a Pathfinding Application")
    assert is_video_matching_stage_intent("build", "Python Sorting Algorithm Visualizer Tutorial")

    # Pure learning titles must fail Build
    assert not is_video_matching_stage_intent("build", "Introduction to Algorithms")
    assert not is_video_matching_stage_intent("build", "Algorithms Full Course")
    assert not is_video_matching_stage_intent("build", "Algorithms Concepts Explained")


# =====================================================================
# 16. Generic Plural / Singular Stemming in Skill Relevance
# =====================================================================
def test_generic_stemming_in_skill_relevance():
    """
    Verify that English noun inflections (singular/plural) match correctly:
    - 'Algorithms' matches 'Python Sorting Algorithm Visualizer Tutorial'
    - 'Algorithms' matches 'Data Structures and Algorithm'
    - 'Microservices' matches 'Building a Microservice in Go'
    - 'REST APIs' matches 'Building a REST API with FastAPI'
    - 'Containers' matches 'Docker Container Tutorial'
    """
    assert is_video_relevant_to_skill("Algorithms", "Python Sorting Algorithm Visualizer Tutorial")
    assert is_video_relevant_to_skill("Algorithms", "5 DSA Projects for Resume + Code | Data Structures and Algorithm")
    assert is_video_relevant_to_skill("Microservices", "Building a Microservice in Go")
    assert is_video_relevant_to_skill("REST APIs", "Building a REST API with FastAPI")
    assert is_video_relevant_to_skill("Containers", "Docker Container Tutorial")

    # Unrelated skills must still fail
    assert not is_video_relevant_to_skill("Algorithms", "React Full Course")
    assert not is_video_relevant_to_skill("Python", "Java Tutorial for Beginners")


# =====================================================================
# 17. Multi-Skill Build Verification
# =====================================================================
def test_multiskill_build_verification(youtube_service):
    """
    Verify Build stage returns genuine, authentic recommendations
    across multiple skills: JavaScript, Algorithms, Python, React, SQL.
    """
    skills_to_test = ["JavaScript", "Algorithms", "Python", "React", "SQL"]
    for sk in skills_to_test:
        build_vids = youtube_service.get_videos_for_skill(sk, target_role="Software Engineer", stage="build", max_results=2)
        assert len(build_vids) >= 1, f"Expected at least 1 Build video for {sk}"
        for v in build_vids:
            assert v.get("id"), f"Missing video ID for {sk}"
            assert v.get("embed_url"), f"Missing embed URL for {sk}"
            assert is_video_quality_and_duration_valid("build", v["title"], v.get("duration_seconds")), f"Failed quality/duration for {sk}"
            if sk == "Algorithms":
                assert is_video_matching_stage_intent("build", v["title"]), f"Failed Build intent for {sk}"


# =====================================================================
# 18. Generic Skill Equivalence System
# =====================================================================
def test_generic_skill_equivalence_system():
    """
    Verify generic skill normalization and equivalence forms across technical nomenclature.
    Handles *.js variants, plural/singular inflections, and canonical aliases without hardcoded exceptions.
    """
    from app.services.youtube_service import get_skill_equivalent_forms

    # Express variations
    express_forms = get_skill_equivalent_forms("Express.js")
    assert "express.js" in express_forms
    assert "express" in express_forms
    assert "express js" in express_forms

    assert is_video_relevant_to_skill("Express.js", "Build a REST API with Node JS and Express | CRUD API Tutorial")
    assert is_video_relevant_to_skill("Express.js", "Create route in expressjs")
    assert is_video_relevant_to_skill("Express.js", "Express JS Crash Course")
    assert is_video_relevant_to_skill("Express.js", "Building REST APIs with Node.js Express")
    assert is_video_relevant_to_skill("Express", "Build a REST API with Node JS and Express | CRUD API Tutorial")
    assert is_video_relevant_to_skill("Express JS", "Simple REST API with Express.js")

    # Unrelated skill must fail
    assert not is_video_relevant_to_skill("Express.js", "What is Node.js and how it works")
    assert not is_video_relevant_to_skill("Express.js", "Python Django Tutorial")

    # Other frameworks and technical terms
    assert is_video_relevant_to_skill("Node.js", "Node JS Crash Course")
    assert is_video_relevant_to_skill("React.js", "React Tutorial for Beginners")
    assert is_video_relevant_to_skill("REST API", "Working with REST APIs in Python")
    assert is_video_relevant_to_skill("REST APIs", "What is a REST API?")
    assert is_video_relevant_to_skill("Algorithms", "Sorting Algorithm Visualizer Tutorial")


# =====================================================================
# 19. Framework Practice Stage-Intent Scoring
# =====================================================================
def test_framework_practice_stage_intent_scoring():
    """
    Verify framework practice semantics (CRUD, routes, middleware, REST APIs)
    are recognized as valid Practice without allowing pure courses or interview listicles.
    """
    # Genuine practice candidates must pass
    practice_candidates = [
        "Build a REST API with Node JS and Express | CRUD API Tutorial",
        "CRUD API Tutorial - Node, Express, MongoDB",
        "Express.js - Working with Express Routes to perform CRUD operations",
        "Building REST API's using Node and Express.js",
        "How to build a REST API with Node js and Express",
        "Node.js Express CRUD Operations Hands-on Tutorial",
        "JavaScript Practice Exercises For Beginners: Beginner Exercises Part 1",
        "12 Beginner Python Projects - Coding Course"
    ]
    for title in practice_candidates:
        pos, neg, net = score_stage_intent("practice", title)
        assert is_video_matching_stage_intent("practice", title), f"Expected '{title}' to pass Practice (pos={pos}, net={net})"

    # Pure courses and interview questions must fail practice
    non_practice_candidates = [
        "Node.js and Express.js - Full Course",
        "Express Tutorial for Beginners",
        "Top 10 Express.js Interview Questions and Answers",
        "Express.js Fundamentals and Architecture",
        "What is Node.js and how it works (explained in 2 minutes)",
        "Introduction to Express JS",
        "Express.js Full Course - Learn Express in 6 Hours"
    ]
    for title in non_practice_candidates:
        assert not is_video_matching_stage_intent("practice", title), f"Expected '{title}' to FAIL Practice"


# =====================================================================
# 20. Domain-Aware Practice Query Generation
# =====================================================================
def test_framework_practice_query_generation(youtube_service):
    """
    Verify backend frameworks generate CRUD/API/practice queries,
    and generic fallback avoids stiff 'implementation drills'.
    """
    express_queries = youtube_service._build_stage_queries("Express.js", "Software Engineer", "practice")
    assert any("crud" in q.lower() for q in express_queries)
    assert any("rest api" in q.lower() for q in express_queries)
    assert not any("implementation drills" in q.lower() for q in express_queries)

    fastapi_queries = youtube_service._build_stage_queries("FastAPI", "Software Engineer", "practice")
    assert any("crud" in q.lower() or "rest api" in q.lower() for q in fastapi_queries)

    generic_queries = youtube_service._build_stage_queries("General Skill", "Software Engineer", "practice")
    assert not any("implementation drills" in q.lower() for q in generic_queries)

