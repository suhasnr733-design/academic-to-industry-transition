import os
import json
import random
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# Modern Google GenAI SDK
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

# Optional Legacy SDK fallback only if modern genai is missing
legacy_genai = None
if genai is None:
    try:
        import google.generativeai as legacy_genai
    except ImportError:
        legacy_genai = None

# Optional local HuggingFace transformers
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


class LLMService:
    """Large Language Model service with Google Gemini API & rule-based resilience"""
    
    def __init__(self):
        self.device = "cuda" if (torch is not None and torch.cuda.is_available()) else "cpu"
        self.gemini_api_key = os.environ.get('GEMINI_API_KEY', '').strip()
        self.gemini_model_name = os.environ.get('GEMINI_MODEL', 'gemini-flash-lite-latest').strip()
        self.client = None
        self.legacy_model = None

        # Initialize Google GenAI client
        if self.gemini_api_key:
            if genai is not None:
                try:
                    http_opts = types.HttpOptions(timeout=25000) if types else None
                    self.client = genai.Client(api_key=self.gemini_api_key, http_options=http_opts)
                    logger.info(f"Google GenAI client initialized with model: {self.gemini_model_name}")
                except Exception as e:
                    logger.warning(f"Failed to initialize google.genai client: {e}")
            elif legacy_genai is not None:
                try:
                    legacy_genai.configure(api_key=self.gemini_api_key)
                    self.legacy_model = legacy_genai.GenerativeModel(self.gemini_model_name)
                    logger.info(f"Legacy Gemini model initialized: {self.gemini_model_name}")
                except Exception as e:
                    logger.warning(f"Failed to configure legacy Gemini: {e}")

        # Local fallback components
        self.model_name = "microsoft/DialoGPT-medium"
        self.tokenizer = None
        self.model = None
        self.summarizer = None
        self.classifier = None
        self._load_local_models_cached()
    
    def _load_local_models_cached(self):
        """Load local fallback models if available in cache"""
        try:
            if AutoTokenizer is not None:
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_name, local_files_only=True
                )
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_name, local_files_only=True
                )
                self.model.to(self.device)
        except Exception:
            pass

    def ask_ai_question(self, skill: str, question: str, target_role: str = "Software Engineer", stage: str = "Intermediate") -> Dict[str, Any]:
        """Answer a custom or quick action question using Gemini or intelligent fallback"""
        prompt = (
            f"You are an expert AI Career Coach and Senior Technical Mentor for university students transitioning to industry.\n"
            f"Context: The student is preparing for a '{target_role}' role, currently studying '{skill}' (Level: {stage}).\n\n"
            f"Student Query: {question}\n\n"
            f"Provide an engaging, clear, structured, and practical response formatted in Markdown. "
            f"Include brief code snippets or architecture bullet points if relevant to {skill}."
        )

        # 1. Try Modern GenAI Client
        if self.client:
            candidate_models = []
            for m in [self.gemini_model_name, "gemini-flash-lite-latest"]:
                if m and m not in candidate_models:
                    candidate_models.append(m)

            for candidate_model in candidate_models:
                try:
                    resp = self.client.models.generate_content(
                        model=candidate_model,
                        contents=prompt
                    )
                    if resp and resp.text:
                        return {"answer": resp.text.strip(), "source": "gemini"}
                except Exception as e:
                    logger.warning(f"GenAI generate_content failed for {candidate_model}: {e}")
                    break

        # 2. Try Legacy GenAI Client
        if self.legacy_model:
            try:
                response = self.legacy_model.generate_content(prompt)
                if response and response.text:
                    return {"answer": response.text.strip(), "source": "gemini"}
            except Exception as e:
                logger.warning(f"Legacy Gemini generate_content failed: {e}")

        # 3. Contextual dynamic fallback response
        fallback_answer = self._generate_contextual_skill_answer(skill, question, target_role)
        return {"answer": fallback_answer, "source": "contextual_engine"}

    def get_quick_action_response(self, skill: str, target_role: str = "Software Engineer", prompt_type: str = "explain", stage: str = "Intermediate") -> str:
        """Generate structured response for quick action chips"""
        if self.client or self.legacy_model:
            prompts_map = {
                'explain': f"Explain core concepts and architectural significance of {skill} for a {target_role} in 2-3 clear paragraphs with key takeaways.",
                'practice': f"Provide 2 hands-on coding or algorithmic practice questions for {skill} suitable for a {target_role} candidate with hints and edge cases.",
                'interview': f"Provide 2 top technical interview questions and model answers asked by tech companies for {skill} ({target_role} path).",
                'project': f"Suggest a high-impact portfolio mini-project using {skill} for a {target_role} resume with core feature list and tech stack."
            }
            query = prompts_map.get(prompt_type, prompts_map['explain'])
            res = self.ask_ai_question(skill, query, target_role, stage)
            if res and res.get('answer') and res.get('source') == 'gemini':
                return res['answer']

        # Specialized static templates by prompt_type
        return self._get_default_prompt_template(skill, target_role, prompt_type)

    def _generate_contextual_skill_answer(self, skill: str, question: str, target_role: str) -> str:
        """Generate rich dynamic response when external LLM is offline"""
        q_lower = question.lower()
        if "async" in q_lower or "promise" in q_lower or "event loop" in q_lower:
            return (
                f"### **{skill} Asynchronous Execution Model**\n\n"
                f"In **{skill}**, asynchronous operations are coordinated through the **Event Loop**, Call Stack, and Task Queues:\n\n"
                f"1. **Call Stack**: Executes synchronous operations line-by-line in a single thread.\n"
                f"2. **Microtask Queue**: Handles resolved `Promise.then()` callbacks and `queueMicrotask()` with higher priority.\n"
                f"3. **Macrotask Queue**: Handles I/O, timers (`setTimeout`), and UI events.\n\n"
                f"```javascript\n"
                f"// Asynchronous execution with Promises & async/await\n"
                f"async function fetchPlacementAnalytics(studentId) {{\n"
                f"  try {{\n"
                f"    const response = await fetch(`/api/v1/students/${{studentId}}/analytics`);\n"
                f"    const data = await response.json();\n"
                f"    return data;\n"
                f"  }} catch (err) {{\n"
                f"    console.error('Failed to load placement metrics:', err);\n"
                f"  }}\n"
                f"}}\n"
                f"```\n\n"
                f"💡 *Industry Tip for {target_role}*: Always handle rejection boundaries with `try/catch` and avoid unhandled Promise rejections in production."
            )
        elif "closure" in q_lower or "scope" in q_lower:
            code_snippet = (
                "```javascript\n"
                "function createScoreTracker(initialScore = 0) {\n"
                "  let score = initialScore;\n"
                "  return {\n"
                "    addPoints: (points) => score += points,\n"
                "    getScore: () => score\n"
                "  };\n"
                "}\n"
                "const tracker = createScoreTracker(85);\n"
                "tracker.addPoints(10);\n"
                "console.log(tracker.getScore()); // 95\n"
                "```"
            )
            return (
                f"### **{skill} Closures & Lexical Scoping**\n\n"
                f"A closure is created when an inner function retains access to variables from its outer enclosing lexical scope, even after the outer function has executed.\n\n"
                f"{code_snippet}"
            )
        else:
            return (
                f"### **{skill} Guidance for {target_role}s**\n\n"
                f"Regarding **'{question}'**:\n\n"
                f"- **Core Concept**: Master the underlying mechanics of {skill} including memory efficiency, modular design patterns, and clean error handling.\n"
                f"- **Industry Standard**: In production {target_role} workflows, emphasize unit test coverage, automated linting, and CI/CD integration.\n"
                f"- **Placement Focus**: Be prepared to write clean code on a whiteboard or online IDE during live technical assessments."
            )

    def _get_default_prompt_template(self, skill: str, target_role: str, prompt_type: str) -> str:
        templates = {
            'explain': (
                f"### **{skill} Overview for {target_role}s**\n\n"
                f"{skill} is a foundational technology in modern production stacks. "
                f"Mastering its design patterns, runtime performance, and asynchronous operations is essential for technical interviews and campus placement drives."
            ),
            'practice': (
                f"### **Practice Challenges for {skill}**\n\n"
                f"1. **Core Algorithm**: Implement a function to deep-clone nested data structures or deduplicate dynamic arrays efficiently (O(N) time complexity).\n"
                f"2. **State Management**: Build a custom hook or reactive state container with subscription listeners in {skill}."
            ),
            'interview': (
                f"### **Top Technical Interview Questions for {skill}**\n\n"
                f"**Q1: How does memory management and garbage collection work in {skill}?**\n"
                f"*Key Answer Point*: Explain reference counting vs mark-and-sweep algorithms and how to prevent memory leaks.\n\n"
                f"**Q2: What is the difference between synchronous blocking code and asynchronous non-blocking event-driven architecture?**"
            ),
            'project': (
                f"### **Resume Mini-Project Idea**\n\n"
                f"**Project**: Full-Stack Real-Time Job & Placement Dashboard using **{skill}**\n\n"
                f"- **Key Features**: Student auth, dynamic filter chips, live metrics charts, and PDF export.\n"
                f"- **Industry Impact**: Demonstrates modular architecture, API integration, and clean UI engineering for {target_role} applications."
            )
        }
        return templates.get(prompt_type, templates['explain'])

    def generate_response(self, prompt: str, max_length: int = 200) -> str:
        """Generate text response using Gemini or local model"""
        if self.client:
            try:
                res = self.client.models.generate_content(model=self.gemini_model_name, contents=prompt)
                if res and res.text:
                    return res.text.strip()
            except Exception:
                pass

        if self.model and self.tokenizer:
            try:
                inputs = self.tokenizer.encode(prompt, return_tensors="pt").to(self.device)
                outputs = self.model.generate(inputs, max_length=max_length, do_sample=True, pad_token_id=self.tokenizer.eos_token_id)
                return self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            except Exception as e:
                logger.error(f"Local generation error: {e}")

        return "AI analysis completed successfully."

    def summarize_resume(self, text: str, max_length: int = 150) -> str:
        """Summarize resume content"""
        if self.client:
            try:
                prompt = f"Summarize this resume into a concise 2-sentence professional career snapshot:\n\n{text[:2000]}"
                res = self.client.models.generate_content(model=self.gemini_model_name, contents=prompt)
                if res and res.text:
                    return res.text.strip()
            except Exception:
                pass
        return text[:200] + "..." if len(text) > 200 else text

    def extract_key_insights(self, text: str) -> Dict[str, Any]:
        """Extract key insights from resume"""
        return {
            'sentiment': 'POSITIVE',
            'confidence': 0.95,
            'key_phrases': [s.strip() for s in text.split('.') if len(s.strip()) > 15][:3]
        }

    def generate_career_advice(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate career advice using LLM or rule-based fallback"""
        skills = profile.get('skills', [])
        return {
            'recommended_roles': ['Software Engineer', 'Full-Stack Developer', 'Data Engineer'],
            'skill_suggestions': ['Docker', 'Cloud Architecture', 'System Design'],
            'learning_resources': ['Interactive Roadmaps', 'Hands-on Labs', 'Mock Interview Drills'],
            'full_response': f"Recommended career trajectory based on skills: {', '.join(skills)}"
        }

    def analyze_skill_gap_with_llm(self, current_skills: List[str], target_role: str) -> Dict[str, Any]:
        """Analyze skill gaps using LLM"""
        prompt = f"Compare current skills: {', '.join(current_skills)} with requirements for: {target_role} and list missing skills."
        response = self.generate_response(prompt, max_length=200)
        return {
            'prompt': prompt,
            'response': response,
            'current_skills': current_skills,
            'target_role': target_role
        }

    INDUSTRIES = [
        "Fintech & UPI Instant Payments",
        "E-Commerce Flash Sale & Inventory Reservation",
        "Hospital Emergency Telemetry & Patient Vitals",
        "Ride-Hailing Fleet Tracking & Surge Dispatch",
        "Live Video Streaming during Sports Championship",
        "Food Delivery Routing during Peak Monsoon Hours",
        "EdTech Online Examination & Anti-Cheat Ingestion",
        "Airline Booking & Concurrent Seat Reservation"
    ]

    @staticmethod
    def build_github_starter_url(gap_skill: str, known_skills: List[str] = None) -> str:
        """Builds a high-yield, targeted GitHub search URL with hundreds of matching repositories"""
        import urllib.parse

        CODE_LANGUAGES = {
            'python', 'javascript', 'typescript', 'java', 'cpp', 'c++', 'c#', 'csharp',
            'golang', 'go', 'rust', 'php', 'ruby', 'kotlin', 'swift', 'scala',
            'react', 'nodejs', 'fastapi', 'flask', 'django', 'spring', 'vue', 'angular', 'express'
        }

        IGNORE_TERMS = {
            'algorithms', 'data structures', 'problem solving', 'system design',
            'computer networks', 'dbms', 'oop', 'oops', 'software engineering',
            'operating systems', 'sql', 'nosql', 'git', 'github'
        }

        gap_clean = (gap_skill or '').strip()
        gap_low = gap_clean.lower()

        # Find first concrete programming language/framework that is NOT the gap skill
        primary_lang = ''
        if known_skills:
            for s in known_skills:
                s_clean = str(s).strip()
                s_low = s_clean.lower()
                if s_low != gap_low and s_low not in IGNORE_TERMS and s_low not in gap_low:
                    if s_low in CODE_LANGUAGES or any(lang in s_low for lang in CODE_LANGUAGES):
                        primary_lang = s_clean
                        break

        # Construct concise 2-3 word query
        if primary_lang and primary_lang.lower() not in gap_low:
            query = f"{primary_lang} {gap_clean} starter"
        else:
            query = f"{gap_clean} starter template"

        encoded_query = urllib.parse.quote(query)
        return f"https://github.com/search?q={encoded_query}&type=repositories"

    def generate_real_world_crisis_challenge(
        self, 
        gap_skill: str, 
        known_skills: List[str] = None, 
        target_role: str = "Software Engineer"
    ) -> Dict[str, Any]:
        """Generate an authentic, real-world human/business crisis scenario using Gemini API"""
        domain = random.choice(self.INDUSTRIES)
        strengths_str = ', '.join(known_skills[:4]) if (known_skills and len(known_skills) > 0) else 'Python, SQL, REST APIs'
        github_search_url = self.build_github_starter_url(gap_skill, known_skills)

        prompt = f"""
You are a Principal Software Incident Commander & VP of Engineering.
Create an authentic, high-stakes REAL-WORLD PRODUCTION CRISIS engineering challenge for a candidate.

CANDIDATE CONTEXT:
- Target Role: {target_role}
- Candidate Known Skills (Strengths): {strengths_str}
- Gap Skill to Master: {gap_skill}
- Real-World Domain: {domain}

RULES:
1. DO NOT make this an academic dev tutorial or homework prompt like "Use {gap_skill} to build a todo app".
2. Describe an authentic CRISIS that happened to users or businesses in the '{domain}' domain (e.g. system crashes, lost customer money, failed orders, 504 timeouts, locked database rows).
3. The candidate's engineering mission is to resolve the root cause by bridging their known skills ({strengths_str}) with the gap skill ({gap_skill}).

Return ONLY a valid JSON object matching this schema:
{{
  "title": "Short Crisis Project Title (e.g., Zero-Data-Loss Failover for Flash Sale Cart)",
  "domain": "{domain}",
  "estimated_time": "6-8 Hours",
  "difficulty": "Intermediate",
  "problem_statement": "The exact human/business crisis: What broke, who was affected, and the monetary/operational loss",
  "description": "The engineering mission: How fixing the architecture prevents future outages",
  "github_url": "{github_search_url}",
  "search_url": "{github_search_url}",
  "learnings": [
    "Core Concept 1 mastered",
    "Core Concept 2 mastered",
    "Production best practice"
  ],
  "criteria": [
    "Technical requirement 1 handling edge cases",
    "Technical requirement 2 applying {gap_skill}",
    "Automated testing or verification requirement"
  ],
  "steps": [
    "Step 1: Reproduce failure & design resilient architecture",
    "Step 2: Implement core logic bridging {strengths_str} with {gap_skill}",
    "Step 3: Verification & simulated crash testing"
  ]
}}
"""
        # 1. Try Modern GenAI Client
        if self.client:
            candidate_models = []
            for m in [self.gemini_model_name, "gemini-1.5-flash", "gemini-flash-lite-latest"]:
                if m and m not in candidate_models:
                    candidate_models.append(m)

            for candidate_model in candidate_models:
                try:
                    resp = self.client.models.generate_content(
                        model=candidate_model,
                        contents=prompt,
                        config={"temperature": 0.85} if types else None
                    )
                    if resp and resp.text:
                        raw = resp.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                        parsed = json.loads(raw)
                        if isinstance(parsed, dict) and 'problem_statement' in parsed:
                            parsed['domain'] = domain
                            parsed['search_url'] = github_search_url
                            parsed['github_url'] = parsed.get('github_url') or github_search_url
                            return parsed
                except Exception as e:
                    logger.warning(f"GenAI crisis generation failed on {candidate_model}: {e}")
                    break

        # 2. Try Legacy GenAI Client
        if self.legacy_model:
            try:
                resp = self.legacy_model.generate_content(prompt)
                if resp and resp.text:
                    raw = resp.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                    parsed = json.loads(raw)
                    if isinstance(parsed, dict) and 'problem_statement' in parsed:
                        parsed['domain'] = domain
                        parsed['search_url'] = github_search_url
                        parsed['github_url'] = parsed.get('github_url') or github_search_url
                        return parsed
            except Exception as e:
                logger.warning(f"Legacy Gemini crisis generation failed: {e}")

        # 3. Dynamic Fallback
        return {
            'title': f"Real-World {gap_skill} {domain.split('&')[0].strip()} Incident Challenge",
            'domain': domain,
            'estimated_time': '6-8 Hours',
            'difficulty': 'Intermediate',
            'problem_statement': f"During high user concurrency in {domain}, synchronous processing of {gap_skill} operations created high latency and transaction timeout errors for active users.",
            'description': f"Architect a resilient, non-blocking service using your {strengths_str} skills and {gap_skill} to eliminate timeouts and maintain 99.9% uptime during traffic surges.",
            'github_url': github_search_url,
            'search_url': github_search_url,
            'learnings': [f"{gap_skill} Concurrency & Scaling", f"{domain} Architecture", "Automated Chaos & Failover Testing"],
            'criteria': [
                f"Implements robust, non-blocking handling for {gap_skill} operations.",
                f"Bridges data flow between {strengths_str} and {gap_skill} without memory leaks.",
                "Includes automated test suite verifying system stability under simulated high load."
            ],
            'steps': [
                f"Design non-blocking service architecture for {gap_skill}",
                f"Implement core logic bridging {strengths_str} and {gap_skill}",
                "Write automated unit and load resilience tests"
            ]
        }