# backend/app/services/bert_skill_extractor.py

import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

class BertSkillExtractor:
    """Advanced skill extraction using BERT"""
    
    def __init__(self):
        self.model_name = "bert-base-uncased"
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            self.skill_embeddings = self._precompute_skill_embeddings()
            logger.info("✅ BERT model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading BERT: {e}")
    
    def _precompute_skill_embeddings(self):
        """Precompute embeddings for all skills"""
        skills = ['Python', 'Java', 'SQL', 'Machine Learning', 'Deep Learning',
                  'React', 'Angular', 'Node.js', 'Django', 'Flask',
                  'AWS', 'Azure', 'Docker', 'Kubernetes', 'Jenkins',
                  'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision']
        embeddings = []
        
        for skill in skills:
            embedding = self._get_embedding(skill)
            embeddings.append(embedding)
        
        return np.array(embeddings)
    
    def _get_embedding(self, text):
        """Get BERT embedding for text"""
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
        with torch.no_grad():
            outputs = self.model(**inputs)
        return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()
    
    def extract_skills(self, text):
        """Extract skills using BERT embeddings"""
        try:
            # Get text embedding
            text_embedding = self._get_embedding(text)
            
            # Calculate similarities
            similarities = cosine_similarity([text_embedding], self.skill_embeddings)[0]
            
            # Get skills above threshold
            threshold = 0.5
            skills = []
            for i, sim in enumerate(similarities):
                if sim > threshold:
                    skills.append(self._get_skill_name(i))
            
            return skills
        except Exception as e:
            logger.error(f"Skill extraction error: {e}")
            return []
    
    def _get_skill_name(self, index):
        """Get skill name by index"""
        skills = ['Python', 'Java', 'SQL', 'Machine Learning', 'Deep Learning',
                  'React', 'Angular', 'Node.js', 'Django', 'Flask',
                  'AWS', 'Azure', 'Docker', 'Kubernetes', 'Jenkins',
                  'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision']
        return skills[index] if index < len(skills) else "Unknown"