# backend/tests/test_transformers.py

import pytest
from app.services.transformers_parser import TransformersParser
from app.services.skill_graph import SkillKnowledgeGraph
from app.services.enhanced_recommender import EnhancedRecommender

class TestTransformers:
    
    def test_skill_extraction(self):
        parser = TransformersParser()
        text = "Python developer with React and AWS experience"
        skills = parser.extract_skills(text)
        assert len(skills) > 0
        print(f"Extracted skills: {skills}")
    
    def test_domain_classification(self):
        parser = TransformersParser()
        text = "Machine learning engineer with deep learning expertise"
        domain = parser.classify_domain(text)
        assert domain in ['AI/ML', 'Data Science', 'Software Development']
        print(f"Classified domain: {domain}")
    
    def test_skill_graph(self):
        graph = SkillKnowledgeGraph()
        prereqs = graph.get_prerequisites('Deep Learning')
        assert 'Machine Learning' in prereqs
        print(f"Prerequisites: {prereqs}")
        
        learning_path = graph.get_learning_path('Deep Learning', ['Python'])
        print(f"Learning path: {learning_path}")

if __name__ == '__main__':
    pytest.main()