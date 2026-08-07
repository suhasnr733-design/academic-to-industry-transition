# backend/app/services/transformers_parser.py

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import numpy as np
import re

class TransformersParser:
    """Advanced resume parsing using Transformers"""
    
    def __init__(self):
        # Load models
        self.skill_extractor = pipeline(
            "token-classification",
            model="dslim/bert-base-NER",
            aggregation_strategy="simple"
        )
        
        self.classifier = pipeline(
            "text-classification",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )
        
        # Load domain-specific model
        self.domain_model = self._load_domain_model()
    
    def _load_domain_model(self):
        """Load domain classification model"""
        # Custom domain classification model
        pass
    
    def extract_skills(self, text):
        """Extract skills using NER"""
        # Use NER to extract entities
        entities = self.skill_extractor(text)
        
        skills = []
        for entity in entities:
            if entity['entity_group'] in ['ORG', 'PRODUCT']:
                skills.append(entity['word'])
        
        # Add skill keywords
        skill_keywords = ['Python', 'Java', 'SQL', 'Machine Learning', 'Deep Learning',
                         'React', 'Angular', 'Node.js', 'Django', 'Flask', 'AWS',
                         'Docker', 'Kubernetes', 'TensorFlow', 'PyTorch']
        
        for keyword in skill_keywords:
            if keyword.lower() in text.lower():
                skills.append(keyword)
        
        return list(set(skills))
    
    def classify_domain(self, text):
        """Classify job domain"""
        domains = ['AI/ML', 'Software Development', 'Data Science', 
                  'Cloud/DevOps', 'Web Development']
        
        # Use domain-specific classification
        scores = {}
        for domain in domains:
            # Simple keyword matching (can be replaced with trained model)
            keywords = {
                'AI/ML': ['machine learning', 'deep learning', 'neural', 'ai', 'tensorflow'],
                'Software Development': ['software', 'developer', 'programming', 'code'],
                'Data Science': ['data', 'analytics', 'visualization', 'statistics'],
                'Cloud/DevOps': ['cloud', 'devops', 'aws', 'docker', 'kubernetes'],
                'Web Development': ['web', 'frontend', 'backend', 'react', 'angular']
            }
            
            score = sum(1 for kw in keywords.get(domain, []) if kw in text.lower())
            scores[domain] = score
        
        return max(scores, key=scores.get) if scores else 'Unknown'
    
    def parse_resume(self, text):
        """Parse resume using transformers"""
        return {
            'skills': self.extract_skills(text),
            'domain': self.classify_domain(text),
            'entities': self.skill_extractor(text)
        }