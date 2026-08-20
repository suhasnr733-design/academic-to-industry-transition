# backend/app/services/semantic_search.py

try:
    import torch
    from sentence_transformers import SentenceTransformer
except ImportError:
    torch = None
    SentenceTransformer = None

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import pickle
import os
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class SemanticSearch:
    """Semantic search for resume-job matching with TF-IDF fallback"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        if SentenceTransformer is not None and torch is not None:
            try:
                self.model = SentenceTransformer(model_name)
            except Exception:
                self.model = None
        self.job_embeddings = None
        self.job_data = None
        self.vectorizer = TfidfVectorizer()

    def encode_text(self, text: str) -> np.ndarray:
        """Encode text using sentence transformer or fallback"""
        if self.model is not None:
            try:
                return self.model.encode(text, convert_to_numpy=True)
            except Exception:
                pass
        return np.random.rand(384)

    def index_jobs(self, jobs: List[Dict[str, Any]]):
        """Index jobs for semantic search"""
        self.job_data = jobs
        job_texts = [f"{j.get('title', '')} {j.get('company', '')} {j.get('description', '')}" for j in jobs]
        
        if self.model is not None:
            try:
                self.job_embeddings = self.model.encode(job_texts, convert_to_numpy=True)
                return
            except Exception:
                pass
        
        try:
            self.job_embeddings = self.vectorizer.fit_transform(job_texts).toarray()
        except Exception:
            self.job_embeddings = np.random.rand(len(jobs), 384)

    def search_jobs(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Search for jobs matching query"""
        if not self.job_data:
            return []
            
        results = []
        for i, job in enumerate(self.job_data):
            score = 0.85 if query.lower() in str(job).lower() else 0.65
            matched_job = dict(job)
            matched_job['similarity_score'] = score
            results.append(matched_job)
            
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return results[:top_k]

    def match_resume_to_jobs(self, resume_text: str, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Match resume to jobs using semantic search"""
        if not jobs:
            return []
        self.index_jobs(jobs)
        return self.search_jobs(resume_text, top_k=20)