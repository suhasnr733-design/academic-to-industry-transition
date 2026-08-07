# backend/tests/test_llm_service.py

import pytest
from app.services.llm_service import LLMService
from app.services.semantic_search import SemanticSearch
from app.services.skill_graph_enhanced import EnhancedSkillGraph

class TestAdvancedNLP:
    
    @pytest.fixture
    def llm_service(self):
        return LLMService()
    
    @pytest.fixture
    def semantic_search(self):
        return SemanticSearch()
    
    @pytest.fixture
    def skill_graph(self):
        return EnhancedSkillGraph()
    
    def test_llm_summarization(self, llm_service):
        """Test resume summarization"""
        text = "Python developer with 5 years experience in Django, React, and AWS."
        summary = llm_service.summarize_resume(text)
        assert summary is not None
        assert len(summary) > 0
        print(f"Summary: {summary}")
    
    def test_career_advice(self, llm_service):
        """Test career advice generation"""
        profile = {
            'skills': ['Python', 'Django', 'React'],
            'experience': '2 years',
            'education': 'B.Tech Computer Science'
        }
        advice = llm_service.generate_career_advice(profile)
        assert 'recommended_roles' in advice
        print(f"Advice: {advice}")
    
    def test_semantic_search(self, semantic_search):
        """Test semantic search for jobs"""
        jobs = [
            {'title': 'Data Scientist', 'company': 'Google', 'description': 'ML and AI'},
            {'title': 'Software Engineer', 'company': 'Microsoft', 'description': 'Backend development'},
        ]
        
        results = semantic_search.match_resume_to_jobs(
            'Machine Learning expert with Python',
            jobs
        )
        assert len(results) > 0
        print(f"Search results: {results}")
    
    def test_skill_graph(self, skill_graph):
        """Test skill graph"""
        info = skill_graph.get_skill_info('Machine Learning')
        assert info is not None
        assert 'prerequisites' in info
        
        path = skill_graph.get_learning_path('Machine Learning', ['Python'])
        assert 'recommended_order' in path
        print(f"Learning path: {path}")