# backend/app/services/semantic_search.py

import torch
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class SemanticSearch:
    """Semantic search for resume-job matching"""
    
    def __init__(self):
        self.model_name = "all-MiniLM-L6-v2"
        self.model = SentenceTransformer(self.model_name)
        self.embeddings_cache = {}
        self.job_embeddings = None
        self.job_data = None
        self.load_embeddings()
        logger.info("✅ Semantic search initialized")
    
    def encode_text(self, text: str) -> np.ndarray:
        """Encode text to embedding"""
        if not text:
            return np.zeros(384)  # Default dimension
        return self.model.encode(text, convert_to_numpy=True)
    
    def compute_similarity(self, text1: str, text2: str) -> float:
        """Compute similarity between two texts"""
        emb1 = self.encode_text(text1)
        emb2 = self.encode_text(text2)
        return cosine_similarity([emb1], [emb2])[0][0]
    
    def index_jobs(self, jobs: List[Dict[str, Any]]):
        """Index jobs for semantic search"""
        self.job_data = jobs
        
        # Create job descriptions for embedding
        job_texts = []
        for job in jobs:
            text = f"{job['title']} {job['company']} {job.get('description', '')}"
            job_texts.append(text)
        
        # Compute embeddings
        self.job_embeddings = self.model.encode(job_texts, convert_to_numpy=True)
        
        # Cache embeddings
        self._save_embeddings()
        logger.info(f"✅ Indexed {len(jobs)} jobs")
    
    def search_jobs(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Search for jobs matching query"""
        if self.job_embeddings is None or self.job_data is None:
            return []
        
        # Encode query
        query_embedding = self.encode_text(query)
        
        # Compute similarities
        similarities = cosine_similarity([query_embedding], self.job_embeddings)[0]
        
        # Get top matches
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            result = self.job_data[idx].copy()
            result['similarity_score'] = float(similarities[idx])
            results.append(result)
        
        return results
    
    def match_resume_to_jobs(self, resume_text: str, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Match resume to jobs using semantic search"""
        if not jobs:
            return []
        
        # Index jobs
        self.index_jobs(jobs)
        
        # Search
        results = self.search_jobs(resume_text, top_k=20)
        
        return results
    
    def _save_embeddings(self):
        """Save embeddings to cache"""
        cache_path = 'data/cache/job_embeddings.pkl'
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        with open(cache_path, 'wb') as f:
            pickle.dump({
                'embeddings': self.job_embeddings,
                'jobs': self.job_data
            }, f)
        logger.info(f"✅ Embeddings cached to {cache_path}")
    
    def load_embeddings(self):
        """Load cached embeddings"""
        cache_path = 'data/cache/job_embeddings.pkl'
        if os.path.exists(cache_path):
            try:
                with open(cache_path, 'rb') as f:
                    data = pickle.load(f)
                self.job_embeddings = data['embeddings']
                self.job_data = data['jobs']
                logger.info(f"✅ Loaded cached embeddings from {cache_path}")
            except Exception as e:
                logger.error(f"Error loading cache: {e}")
    
    def get_similar_skills(self, skill: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Get similar skills using embeddings"""
        # Predefined skills
        skills = [
            'Python', 'Java', 'JavaScript', 'SQL', 'C++', 'Ruby',
            'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
            'React', 'Angular', 'Vue.js', 'Node.js', 'Django',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes'
        ]
        
        # Encode all skills
        skill_embeddings = self.model.encode(skills, convert_to_numpy=True)
        
        # Encode query
        query_embedding = self.encode_text(skill)
        
        # Compute similarities
        similarities = cosine_similarity([query_embedding], skill_embeddings)[0]
        
        # Get top matches
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            results.append({
                'skill': skills[idx],
                'similarity': float(similarities[idx])
            })
        
        return results