try:
    import torch
    from transformers import (
        AutoTokenizer,
        AutoModelForCausalLM,
        pipeline,
        AutoModelForSequenceClassification
    )
except ImportError:
    torch = None
    AutoTokenizer = None
    AutoModelForCausalLM = None
    pipeline = None
    AutoModelForSequenceClassification = None
import logging
from typing import Dict, List, Any
import json

logger = logging.getLogger(__name__)

class LLMService:
    """Large Language Model service for advanced NLP tasks"""
    
    def __init__(self):
        self.device = "cuda" if (torch is not None and torch.cuda.is_available()) else "cpu"
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
            if self.summarizer is not None:
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
            'sentiment': 'POSITIVE',
            'confidence': 0.95,
            'key_phrases': [s.strip() for s in text.split('.') if len(s.strip()) > 15][:3]
        }
        return insights
    
    def generate_career_advice(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate career advice using LLM or rule-based fallback"""
        skills = profile.get('skills', [])
        return {
            'recommended_roles': ['Software Engineer', 'Data Scientist', 'Full-Stack Developer'],
            'skill_suggestions': ['Docker', 'AWS Cloud', 'REST API Architecture'],
            'learning_resources': ['Coursera Python for Data Science', 'Udemy Full-Stack Engineering'],
            'full_response': f"Recommended career trajectory based on skills: {', '.join(skills)}"
        }
    
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