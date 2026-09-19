# backend/tests/unit/test_video_progress_tracking.py

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import pytest
from app import create_app, db
from app.models import User, Resume, VideoProgress
from app.services.learning_service import LearningService

@pytest.fixture(scope='module')
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture(autouse=True)
def app_context(app):
    with app.app_context():
        yield

@pytest.fixture
def service():
    return LearningService()

@pytest.fixture
def test_user(app):
    user = User.query.filter_by(username="learner_test").first()
    if not user:
        user = User(
            username="learner_test",
            email="learner@test.com",
            full_name="Learner Test",
            role="student"
        )
        user.set_password("SecurePass123!")
        db.session.add(user)
        db.session.commit()
    return user


def test_interval_union_and_deduplication(service):
    """Verifies interval merging and watched duration union calculation."""
    # Disjoint intervals
    disjoint = [[0, 100], [300, 400], [600, 700]]
    assert service.calculate_watched_duration(disjoint) == 300.0

    # Overlapping intervals: [0, 100], [50, 150], [140, 200] => [0, 200]
    overlapping = [[0, 100], [50, 150], [140, 200]]
    assert service.calculate_watched_duration(overlapping) == 200.0

    # Rewatched intervals (replaying same 60 seconds twice)
    replayed = [[0, 60], [10, 50], [0, 60]]
    assert service.calculate_watched_duration(replayed) == 60.0


def test_seeking_protection_prevents_false_completion(service, test_user):
    """
    Verifies seeking directly to end does not count skipped content.
    Example: 1000s video. User watches 0-100s, seeks 100s -> 1000s.
    Progress must be 10%, NOT 100%. is_completed must be False.
    """
    res = service.save_video_progress(
        user_id=test_user.id,
        video_id="test_vid_seek",
        skill_name="Python",
        target_role="Data Scientist",
        watched_intervals=[[0, 100]],
        total_duration=1000.0,
        last_playback_time=1000.0 # user sought to 1000s
    )

    assert res['progress_percent'] == 10.0
    assert res['is_completed'] is False
    assert res['watched_duration'] == 100.0


def test_strict_100_percent_completion_thresholds(service, test_user):
    """
    Verifies user requirement:
    - 94% is NOT completed.
    - 95% is NOT completed.
    - 99% is NOT completed.
    - 100% genuine full coverage IS completed.
    """
    total = 1000.0

    # 1. 94% watched (940s / 1000s) -> False
    p94 = service.save_video_progress(
        user_id=test_user.id,
        video_id="vid_p94",
        skill_name="Data Science",
        target_role="Data Scientist",
        watched_intervals=[[0, 940]],
        total_duration=total
    )
    assert p94['progress_percent'] == 94.0
    assert p94['is_completed'] is False

    # 2. 95% watched (950s / 1000s) -> False (strictly requires 100%)
    p95 = service.save_video_progress(
        user_id=test_user.id,
        video_id="vid_p95",
        skill_name="Data Science",
        target_role="Data Scientist",
        watched_intervals=[[0, 950]],
        total_duration=total
    )
    assert p95['progress_percent'] == 95.0
    assert p95['is_completed'] is False

    # 3. 99% watched (990s / 1000s) -> False (10 seconds unwatched is not complete)
    p99 = service.save_video_progress(
        user_id=test_user.id,
        video_id="vid_p99",
        skill_name="Data Science",
        target_role="Data Scientist",
        watched_intervals=[[0, 990]],
        total_duration=total
    )
    assert p99['progress_percent'] == 99.0
    assert p99['is_completed'] is False

    # 4. Genuine 100% full coverage (1000s / 1000s) -> True
    p100 = service.save_video_progress(
        user_id=test_user.id,
        video_id="vid_p100",
        skill_name="Data Science",
        target_role="Data Scientist",
        watched_intervals=[[0, 1000]],
        total_duration=total
    )
    assert p100['progress_percent'] == 100.0
    assert p100['is_completed'] is True


def test_video_isolation_completion(service, test_user):
    """Verifies that completing one video does NOT mark another video as completed."""
    v1 = service.save_video_progress(
        user_id=test_user.id,
        video_id="video_alpha",
        skill_name="Machine Learning",
        target_role="Data Scientist",
        watched_intervals=[[0, 500]],
        total_duration=500.0
    )
    assert v1['is_completed'] is True

    v2 = service.save_video_progress(
        user_id=test_user.id,
        video_id="video_beta",
        skill_name="Machine Learning",
        target_role="Data Scientist",
        watched_intervals=[[0, 50]],
        total_duration=500.0
    )
    assert v2['is_completed'] is False
    assert v2['progress_percent'] == 10.0


def test_dynamic_target_role_preserved(service, test_user):
    """Verifies target_role remains dynamically set to 'Data Scientist' and is never hardcoded."""
    rec = service.save_video_progress(
        user_id=test_user.id,
        video_id="vid_ds",
        skill_name="Statistics",
        target_role="Data Scientist",
        watched_intervals=[[0, 120]],
        total_duration=360.0
    )
    assert rec['target_role'] == "Data Scientist"

    # Subsequent update preserves the dynamic target role
    updated = service.save_video_progress(
        user_id=test_user.id,
        video_id="vid_ds",
        skill_name="Statistics",
        watched_intervals=[[120, 240]],
        total_duration=360.0
    )
    assert updated['target_role'] == "Data Scientist"
    assert updated['progress_percent'] == round((240 / 360) * 100, 1)


def test_incremental_persistence_and_restore(service, test_user):
    """Verifies progress builds cumulatively over multiple sessions and restores accurately."""
    # Session 1: watch 0-100s
    s1 = service.save_video_progress(
        user_id=test_user.id,
        video_id="cumulative_vid",
        skill_name="SQL",
        watched_intervals=[[0, 100]],
        total_duration=500.0
    )
    assert s1['watched_duration'] == 100.0
    assert s1['progress_percent'] == 20.0

    # Session 2: watch 100-250s
    s2 = service.save_video_progress(
        user_id=test_user.id,
        video_id="cumulative_vid",
        skill_name="SQL",
        watched_intervals=[[100, 250]],
        total_duration=500.0
    )
    assert s2['watched_duration'] == 250.0
    assert s2['progress_percent'] == 50.0

    # Restore from database
    retrieved = service.get_video_progress(user_id=test_user.id, video_id="cumulative_vid")
    assert len(retrieved) == 1
    assert retrieved[0]['progress_percent'] == 50.0
    assert retrieved[0]['watched_duration'] == 250.0
    assert retrieved[0]['is_completed'] is False
