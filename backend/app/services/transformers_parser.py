"""
TransformersParser — Advanced resume parsing.

Uses HuggingFace NER pipelines when models are available in local cache.
Always falls back to keyword-regex extraction which is fast and dependency-free.

IMPORTANT: The __init__ never triggers a network download. HuggingFace pipeline
loading is intentionally deferred to an explicit `load_pipelines()` call that
requires the caller to have the models pre-downloaded.
"""

import re
import os
import logging
from typing import List

logger = logging.getLogger(__name__)

# Optional heavy imports
try:
    import torch
    _TORCH_AVAILABLE = True
except ImportError:
    _TORCH_AVAILABLE = False

# Pre-defined skill keyword list for keyword fallback
_SKILL_KEYWORDS: List[str] = [
    'Python', 'Java', 'SQL', 'Machine Learning', 'Deep Learning',
    'React', 'Angular', 'Node.js', 'Django', 'Flask', 'AWS',
    'Docker', 'Kubernetes', 'TensorFlow', 'PyTorch',
    'JavaScript', 'TypeScript', 'C++', 'Go', 'Git', 'Linux',
    'Azure', 'Jenkins', 'Redis', 'MongoDB', 'PostgreSQL',
    'HTML', 'CSS', 'MySQL', 'Scikit-learn', 'Pandas',
    'NumPy', 'FastAPI', 'GraphQL', 'REST', 'CI/CD', 'DevOps',
]

_DOMAIN_KEYWORDS = {
    'AI/ML': ['machine learning', 'deep learning', 'neural', 'ai', 'tensorflow', 'pytorch'],
    'Software Development': ['software', 'developer', 'programming', 'code', 'algorithm'],
    'Data Science': ['data', 'analytics', 'visualization', 'statistics', 'pandas'],
    'Cloud/DevOps': ['cloud', 'devops', 'aws', 'docker', 'kubernetes', 'terraform'],
    'Web Development': ['web', 'frontend', 'backend', 'react', 'angular', 'html', 'css'],
}


class TransformersParser:
    """
    Advanced resume parser.

    NER pipelines are NOT loaded in __init__ to avoid network downloads.
    Keyword extraction always works without any heavy dependencies.
    """

    def __init__(self):
        # Pipelines are None by default — keyword fallback is always available.
        self.skill_extractor = None
        self.classifier = None
        self.domain_model = None

    def load_pipelines(self):
        """
        Explicitly load HuggingFace pipelines from LOCAL CACHE ONLY.
        Call this method only after confirming the models are cached.
        Never called automatically to prevent network I/O at startup/test time.
        """
        if not _TORCH_AVAILABLE:
            logger.warning("torch not available; skipping pipeline load.")
            return

        try:
            from transformers import pipeline as hf_pipeline
        except ImportError:
            logger.warning("transformers not installed; skipping pipeline load.")
            return

        # Hard-block any network download — raise if not cached.
        prev_offline = os.environ.get('TRANSFORMERS_OFFLINE')
        prev_hf_offline = os.environ.get('HF_HUB_OFFLINE')
        os.environ['TRANSFORMERS_OFFLINE'] = '1'
        os.environ['HF_HUB_OFFLINE'] = '1'

        try:
            self.skill_extractor = hf_pipeline(
                "token-classification",
                model="dslim/bert-base-NER",
                aggregation_strategy="simple",
            )
            self.classifier = hf_pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english",
            )
            logger.info("TransformersParser: NER pipelines loaded from cache.")
        except Exception as exc:
            self.skill_extractor = None
            self.classifier = None
            logger.info(f"TransformersParser: Could not load pipelines ({exc}); using keyword fallback.")
        finally:
            if prev_offline is None:
                os.environ.pop('TRANSFORMERS_OFFLINE', None)
            else:
                os.environ['TRANSFORMERS_OFFLINE'] = prev_offline
            if prev_hf_offline is None:
                os.environ.pop('HF_HUB_OFFLINE', None)
            else:
                os.environ['HF_HUB_OFFLINE'] = prev_hf_offline

    def extract_skills(self, text: str) -> List[str]:
        """
        Extract skills from text.
        Uses NER pipeline when loaded, always supplements with keyword regex.
        """
        skills = []

        # NER pipeline extraction (if loaded)
        if self.skill_extractor is not None:
            try:
                entities = self.skill_extractor(text)
                for entity in entities:
                    if entity.get('entity_group') in ['ORG', 'PRODUCT']:
                        word = entity.get('word', '').strip()
                        if word:
                            skills.append(word)
            except Exception as exc:
                logger.debug(f"NER extraction failed: {exc}")

        # Keyword regex fallback — always runs
        text_lower = text.lower()
        for kw in _SKILL_KEYWORDS:
            if re.search(r'\b' + re.escape(kw.lower()) + r'\b', text_lower):
                skills.append(kw)

        return list(set(skills))

    def classify_domain(self, text: str) -> str:
        """Classify job domain using keyword scoring."""
        text_lower = text.lower()
        scores = {
            domain: sum(1 for kw in kws if kw in text_lower)
            for domain, kws in _DOMAIN_KEYWORDS.items()
        }
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else 'Unknown'

    def parse_resume(self, text: str) -> dict:
        """Parse resume and return structured result."""
        return {
            'skills': self.extract_skills(text),
            'domain': self.classify_domain(text),
            'entities': [],
        }