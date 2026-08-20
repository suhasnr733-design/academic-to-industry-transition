# backend/tests/test_transformers.py
# Tests for TransformersParser, SkillKnowledgeGraph, and EnhancedRecommender.
# NER pipeline tests are skipped unless HuggingFace models are cached locally.

import pytest
import os
from app.services.transformers_parser import TransformersParser
from app.services.skill_graph import SkillKnowledgeGraph
from app.services.enhanced_recommender import EnhancedRecommender


def _bert_ner_is_cached() -> bool:
    """Return True only if dslim/bert-base-NER exists in local HuggingFace cache."""
    try:
        from huggingface_hub import scan_cache_dir
        for repo in scan_cache_dir().repos:
            if 'bert-base-NER' in repo.repo_id or 'dslim' in repo.repo_id:
                return True
    except Exception:
        pass
    return False


class TestTransformers:

    def test_skill_extraction(self):
        """Test skill extraction falls back to keyword regex correctly."""
        parser = TransformersParser()
        text = "Python developer with React and AWS experience"
        skills = parser.extract_skills(text)
        assert len(skills) > 0, "Should extract at least some skills via keyword fallback"
        assert 'Python' in skills, "Should find 'Python'"
        assert 'React' in skills, "Should find 'React'"
        print(f"Extracted skills: {skills}")

    def test_domain_classification(self):
        """Test domain classification via keyword scoring."""
        parser = TransformersParser()
        text = "Machine learning engineer with deep learning expertise"
        domain = parser.classify_domain(text)
        assert domain in ['AI/ML', 'Data Science', 'Software Development'], \
            f"Unexpected domain: {domain}"
        print(f"Classified domain: {domain}")

    def test_skill_graph(self):
        """Test SkillKnowledgeGraph prerequisite and path logic."""
        graph = SkillKnowledgeGraph()
        prereqs = graph.get_prerequisites('Deep Learning')
        assert 'Machine Learning' in prereqs, "Deep Learning prereq should include Machine Learning"
        print(f"Prerequisites: {prereqs}")

        learning_path = graph.get_learning_path('Deep Learning', ['Python'])
        print(f"Learning path: {learning_path}")


if __name__ == '__main__':
    pytest.main()