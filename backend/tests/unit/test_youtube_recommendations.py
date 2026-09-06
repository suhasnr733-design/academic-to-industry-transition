# backend/tests/unit/test_youtube_recommendations.py

import os
import sys
import pytest

# Add services directory directly to path to test YouTubeService in pure isolation
services_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'app', 'services'))
if services_dir not in sys.path:
    sys.path.insert(0, services_dir)

from youtube_service import YouTubeService, normalize_skill_name

@pytest.fixture
def yt_service():
    # Instantiate YouTubeService without API key to test deterministic fallback matching engine
    service = YouTubeService()
    service.api_key = None
    return service

def test_normalization():
    assert normalize_skill_name("React.js") == "react"
    assert normalize_skill_name("React JS") == "react"
    assert normalize_skill_name("ReactJS") == "react"
    assert normalize_skill_name("Next.js") == "next.js"
    assert normalize_skill_name("NextJS") == "next.js"
    assert normalize_skill_name("Power BI") == "power bi"
    assert normalize_skill_name("PowerBI") == "power bi"
    assert normalize_skill_name("Microsoft Azure") == "azure"
    assert normalize_skill_name("Azure") == "azure"
    assert normalize_skill_name("Google Cloud Platform") == "gcp"
    assert normalize_skill_name("GCP") == "gcp"
    assert normalize_skill_name("Database Management Systems") == "dbms"
    assert normalize_skill_name("DBMS") == "dbms"

# TEST A: Tailwind CSS -> Tailwind video
def test_case_a_tailwind_css(yt_service):
    videos = yt_service.get_videos_for_skill("Tailwind CSS")
    assert len(videos) > 0
    assert videos[0]['id'] == 'dFgzHOX84xQ'
    assert 'Tailwind' in videos[0]['title']

# TEST B: Terraform -> Terraform video
def test_case_b_terraform(yt_service):
    videos = yt_service.get_videos_for_skill("Terraform")
    assert len(videos) > 0
    assert videos[0]['id'] == '7xngnjfIlK4'
    assert 'Terraform' in videos[0]['title']

# TEST C: Solidity -> Solidity/Web3 video
def test_case_c_solidity(yt_service):
    videos = yt_service.get_videos_for_skill("Solidity")
    assert len(videos) > 0
    assert videos[0]['id'] == 'M576WGiDBdQ'
    assert 'Solidity' in videos[0]['title']

# TEST D: MongoDB -> MongoDB/Database video
def test_case_d_mongodb(yt_service):
    videos = yt_service.get_videos_for_skill("MongoDB")
    assert len(videos) > 0
    assert videos[0]['id'] == 'ofme2o29ngU'
    assert 'MongoDB' in videos[0]['title']

# TEST E: Power BI -> Power BI/Data Analytics video
def test_case_e_power_bi(yt_service):
    videos = yt_service.get_videos_for_skill("Power BI")
    assert len(videos) > 0
    assert videos[0]['id'] == 'TmhQCQr_DCA'
    assert 'Power BI' in videos[0]['title']

# TEST F: Microcontrollers -> Microcontrollers/Embedded Systems video
def test_case_f_microcontrollers(yt_service):
    videos = yt_service.get_videos_for_skill("Microcontrollers")
    assert len(videos) > 0
    assert videos[0]['id'] == 'MYyydWpZo60'
    assert 'Microcontroller' in videos[0]['title']

# TEST G: System Design -> System Design/Software Architecture video (NOT Figma)
def test_case_g_system_design(yt_service):
    videos = yt_service.get_videos_for_skill("System Design")
    assert len(videos) > 0
    assert videos[0]['id'] == 'm8Icp_Cid5o'
    assert videos[0]['id'] != 'c9Wg6Cb_YlU'  # Not Figma!
    assert 'System Design' in videos[0]['title']

# TEST H: Database Management Systems -> DBMS/Database video (NOT Leadership)
def test_case_h_dbms(yt_service):
    videos = yt_service.get_videos_for_skill("Database Management Systems")
    assert len(videos) > 0
    assert videos[0]['id'] == 'HXV3zeQKqGY'
    assert videos[0]['id'] != 'z44w3jBfJp0'  # Not Leadership!
    assert 'Database' in videos[0]['title'] or 'SQL' in videos[0]['title']

# TEST I: Time Series Analysis -> Time Series/Data Analytics video (NOT Time Management)
def test_case_i_time_series_analysis(yt_service):
    videos = yt_service.get_videos_for_skill("Time Series Analysis")
    assert len(videos) > 0
    assert videos[0]['id'] == 'e8Yw4alG16Q'
    assert videos[0]['id'] != 'iONDebHX9qk'  # Not Time Management!
    assert 'Time Series' in videos[0]['title']

# TEST J: Real-time Systems -> Real-time Systems/Distributed Systems video (NOT Time Management)
def test_case_j_real_time_systems(yt_service):
    videos = yt_service.get_videos_for_skill("Real-time Systems")
    assert len(videos) > 0
    assert videos[0]['id'] == 'cQP8WApzIQQ'
    assert videos[0]['id'] != 'iONDebHX9qk'  # Not Time Management!

# TEST K: Azure -> Azure video (NOT AWS)
def test_case_k_azure(yt_service):
    videos = yt_service.get_videos_for_skill("Azure")
    assert len(videos) > 0
    assert videos[0]['id'] == '5abffC-K40c'
    assert videos[0]['id'] != 'k1RI5locZE4'  # Not AWS!
    assert 'Azure' in videos[0]['title']

# TEST L: GCP -> Google Cloud/GCP video (NOT AWS)
def test_case_l_gcp(yt_service):
    videos = yt_service.get_videos_for_skill("GCP")
    assert len(videos) > 0
    assert videos[0]['id'] == 'cbcd6-m8sHg'
    assert videos[0]['id'] != 'k1RI5locZE4'  # Not AWS!
    assert 'Google Cloud' in videos[0]['title']

# TEST M: Unknown database-related skill -> relevant database fallback (NOT DSA)
def test_case_m_unknown_database(yt_service):
    videos = yt_service.get_videos_for_skill("CockroachDB Distributed Datastore")
    assert len(videos) > 0
    assert videos[0]['id'] == 'HXV3zeQKqGY'  # Database Fallback
    assert videos[0]['id'] != '0IAPZzGSbME'  # NOT DSA!
    assert videos[0]['recommendation_category'] == 'Database'

# TEST N: Unknown cloud-related skill -> relevant cloud fallback (NOT DSA)
def test_case_n_unknown_cloud(yt_service):
    videos = yt_service.get_videos_for_skill("OpenStack Private Cloud")
    assert len(videos) > 0
    assert videos[0]['id'] == 'M988_fsOSWo'  # Cloud Fallback
    assert videos[0]['id'] != '0IAPZzGSbME'  # NOT DSA!
    assert videos[0]['recommendation_category'] == 'Cloud'

# TEST O: Completely unknown skill -> no recommendation or safe result (NOT unrelated DSA video)
def test_case_o_completely_unknown(yt_service):
    videos = yt_service.get_videos_for_skill("Quantum Horticultural Crop Rotation")
    # Must never return an unrelated DSA video!
    assert len(videos) == 0 or all(v['id'] != '0IAPZzGSbME' for v in videos)

# REGRESSION TESTS: Known core skills
def test_regression_python(yt_service):
    videos = yt_service.get_videos_for_skill("Python")
    assert len(videos) > 0
    assert videos[0]['id'] == 'rfscVS0vtbw'

def test_regression_java(yt_service):
    videos = yt_service.get_videos_for_skill("Java")
    assert len(videos) > 0
    assert videos[0]['id'] == 'eIrMbAQSU34'

def test_regression_javascript(yt_service):
    videos = yt_service.get_videos_for_skill("JavaScript")
    assert len(videos) > 0
    assert videos[0]['id'] == 'W6NZfCO5SIk'

def test_regression_react(yt_service):
    videos = yt_service.get_videos_for_skill("React")
    assert len(videos) > 0
    assert videos[0]['id'] == 'bMknfKXIFA8'

def test_regression_sql(yt_service):
    videos = yt_service.get_videos_for_skill("SQL")
    assert len(videos) > 0
    assert videos[0]['id'] == 'HXV3zeQKqGY'

def test_regression_data_structures(yt_service):
    videos = yt_service.get_videos_for_skill("Data Structures")
    assert len(videos) > 0
    assert videos[0]['id'] == 'RBSGKlAvoiM'

def test_regression_css(yt_service):
    videos = yt_service.get_videos_for_skill("CSS")
    assert len(videos) > 0
    assert videos[0]['id'] == '1Rs2ND1ryYc'

def test_regression_html(yt_service):
    videos = yt_service.get_videos_for_skill("HTML")
    assert len(videos) > 0
    assert videos[0]['id'] == 'pQN-pnXPaVg'
