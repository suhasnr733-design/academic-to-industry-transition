# backend/app/services/llm_service.py

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    pipeline,
    AutoModelForSequenceClassification
)
import logging
from typing import Dict, List, Any
import json

logger = logging.getLogger(__name__)

class LLMService:
    """Large Language Model service for advanced NLP tasks"""
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_name = "microsoft/DialoGPT-medium"
        self.tokenizer = None
        self.model = None
        self.summarizer = None
        self.classifier = None
        self.load_models()
        logger.info(f"LLM Service initialized on {self.device}")
    
    def load_models(self):
        """Load all required models"""
        try:
            # Load main language model
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForCausalLM.from_pretrained(self.model_name)
            self.model.to(self.device)
            
            # Load summarizer
            self.summarizer = pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                device=0 if self.device == "cuda" else -1
            )
            
            # Load classifier (optional)
            self.classifier = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english"
            )
            
            logger.info("✅ All models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    def generate_response(self, prompt: str, max_length: int = 200) -> str:
        """Generate text response using LLM"""
        try:
            inputs = self.tokenizer.encode(prompt, return_tensors="pt")
            inputs = inputs.to(self.device)
            
            outputs = self.model.generate(
                inputs,
                max_length=max_length,
                num_return_sequences=1,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            return response
        except Exception as e:
            logger.error(f"Generation error: {e}")
            return "Error generating response"
    
    def summarize_resume(self, text: str, max_length: int = 150) -> str:
        """Summarize resume content"""
        try:
            # Truncate long text
            if len(text) > 1024:
                text = text[:1024]
            
            summary = self.summarizer(
                text,
                max_length=max_length,
                min_length=30,
                do_sample=False
            )
            return summary[0]['summary_text']
        except Exception as e:
            logger.error(f"Summarization error: {e}")
            return text[:200] + "..."
    
    def extract_key_insights(self, text: str) -> Dict[str, Any]:
        """Extract key insights from resume"""
        insights = {
            'sentiment': None,
            'confidence': None,
            'key_phrases': []
        }
        
        try:
            # Sentiment analysis
            sentiment = self.classifier(text[:512])[0]
            insights['sentiment'] = sentiment['label']
            insights['confidence'] = sentiment['score']
            
            # Extract key phrases (simple implementation)
            sentences = text.split('.')
            key_phrases = [s.strip() for s in sentences if len(s.strip()) > 20][:5]
            insights['key_phrases'] = key_phrases
            
        except Exception as e:
            logger.error(f"Insight extraction error: {e}")
        
        return insights
    
    def generate_career_advice(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate career advice using LLM"""
        prompt = f"""
        Given the following student profile:
        - Skills: {', '.join(profile.get('skills', []))}
        - Experience: {profile.get('experience', 'No experience')}
        - Education: {profile.get('education', 'Not specified')}
        
        Provide specific career advice including:
        1. Recommended roles
        2. Skill improvement suggestions
        3. Learning resources
        """
        
        try:
            response = self.generate_response(prompt, max_length=300)
            
            # Parse the response (simple parsing)
            lines = response.split('\n')
            advice = {
                'recommended_roles': [],
                'skill_suggestions': [],
                'learning_resources': [],
                'full_response': response
            }
            
            # Extract sections
            current_section = None
            for line in lines:
                line = line.strip()
                if 'role' in line.lower() or 'position' in line.lower():
                    current_section = 'roles'
                elif 'skill' in line.lower():
                    current_section = 'skills'
                elif 'learn' in line.lower() or 'resource' in line.lower():
                    current_section = 'resources'
                elif current_section == 'roles' and line:
                    advice['recommended_roles'].append(line)
                elif current_section == 'skills' and line:
                    advice['skill_suggestions'].append(line)
                elif current_section == 'resources' and line:
                    advice['learning_resources'].append(line)
            
            return advice
        except Exception as e:
            logger.error(f"Career advice error: {e}")
            return {'error': str(e)}
    
    def analyze_skill_gap_with_llm(self, current_skills: List[str], target_role: str) -> Dict[str, Any]:
        """Analyze skill gaps using LLM"""
        prompt = f"""
        Compare these skills: {', '.join(current_skills)}
        With the requirements for: {target_role}
        
        Identify:
        1. Missing skills (gaps)
        2. Skills to improve
        3. Recommended learning path
        """
        
        response = self.generate_response(prompt, max_length=200)
        
        return {
            'prompt': prompt,
            'response': response,
            'current_skills': current_skills,
            'target_role': target_role
        }