# backend/app/services/bert_skill_extractor.py
# BERT-based skill extraction with keyword fallback when transformers unavailable.

import re
import logging

logger = logging.getLogger(__name__)

# Check BERT availability — do NOT attempt model download at import time.
_BERT_AVAILABLE = False
_torch = None
_AutoTokenizer = None
_AutoModel = None
try:
    import torch as _torch
    from transformers import AutoTokenizer as _AutoTokenizer, AutoModel as _AutoModel
    _BERT_AVAILABLE = True
except ImportError:
    pass

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


_SKILL_LIST = [
    'Python', 'Java', 'SQL', 'Machine Learning', 'Deep Learning',
    'React', 'Angular', 'Node.js', 'Django', 'Flask',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'Jenkins',
    'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision',
    'JavaScript', 'TypeScript', 'C++', 'Go', 'Rust',
    'Redis', 'MongoDB', 'PostgreSQL', 'MySQL', 'Git',
    'Linux', 'Terraform', 'Ansible', 'CI/CD', 'DevOps',
    'Data Science', 'Statistics', 'Power BI', 'Tableau',
]


class BertSkillExtractor:
    """Skill extraction using BERT embeddings when available, keyword-regex fallback otherwise."""

    def __init__(self):
        self.tokenizer = None
        self.model = None
        self.skill_embeddings = None

        if _BERT_AVAILABLE:
            # Only attempt loading if a local cached model exists.
            # Never block on a network download during tests or server startup.
            try:
                from transformers import AutoTokenizer, AutoModel
                # from_pretrained with local_files_only=True to avoid hanging downloads
                self.tokenizer = AutoTokenizer.from_pretrained(
                    "bert-base-uncased", local_files_only=True
                )
                self.model = AutoModel.from_pretrained(
                    "bert-base-uncased", local_files_only=True
                )
                self.skill_embeddings = self._precompute_skill_embeddings()
                logger.info("BERT skill extractor loaded from local cache.")
            except Exception as e:
                logger.info(
                    f"BERT model not in local cache ({e}); using keyword fallback."
                )
                self.tokenizer = None
                self.model = None
        else:
            logger.info("torch/transformers not installed; using keyword fallback.")

    # ------------------------------------------------------------------
    # BERT helpers
    # ------------------------------------------------------------------

    def _precompute_skill_embeddings(self):
        """Precompute embeddings for the skill list."""
        embeddings = [self._get_embedding(skill) for skill in _SKILL_LIST]
        return np.array(embeddings)

    def _get_embedding(self, text: str):
        """Return mean-pooled BERT embedding for text."""
        import torch
        inputs = self.tokenizer(
            text, return_tensors="pt", truncation=True, max_length=128
        )
        with torch.no_grad():
            outputs = self.model(**inputs)
        return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract_skills(self, text: str):
        """Extract skills. Uses BERT cosine similarity when available, else regex keywords."""
        if self.model is not None and self.skill_embeddings is not None:
            try:
                text_embedding = self._get_embedding(text)
                similarities = cosine_similarity([text_embedding], self.skill_embeddings)[0]
                threshold = 0.5
                return [
                    _SKILL_LIST[i]
                    for i, sim in enumerate(similarities)
                    if sim > threshold
                ]
            except Exception as e:
                logger.error(f"BERT skill extraction error: {e}")

        # Keyword regex fallback
        found = []
        text_lower = text.lower()
        for skill in _SKILL_LIST:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found.append(skill)
        return found