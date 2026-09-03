# backend/app/services/learning_service.py

import logging
from typing import Dict, List, Any, Optional
from app import db
from app.models.resume import Resume
from app.models.learning import LearningProgress, LearningBookmark, LearningActivity
from app.services.skill_analyzer import SkillAnalyzer
from app.services.youtube_service import YouTubeService
from app.services.llm_service import LLMService
try:
    from app.utils.courseUrls import get_course_url
except ImportError:
    get_course_url = None

logger = logging.getLogger(__name__)

class LearningService:
    """Intelligent resume-specific learning path and recommendation engine"""

    def __init__(self):
        self.skill_analyzer = SkillAnalyzer()
        self.youtube_service = YouTubeService()
        self.llm_service = LLMService()

        # Prerequisite dependency map (Skill A must be learned before Skill B)
        self.prerequisites = {
            'algorithms': ['data structures', 'python', 'java', 'c++'],
            'machine learning': ['python', 'statistics', 'sql'],
            'deep learning': ['machine learning', 'python'],
            'react': ['javascript', 'html', 'css'],
            'redux': ['react', 'javascript'],
            'django': ['python', 'sql'],
            'node.js': ['javascript'],
            'kubernetes': ['docker', 'linux'],
            'system design': ['data structures', 'algorithms', 'sql']
        }

    def classify_skill(self, skill: str) -> str:
        """Classify technical skills into 7 standard categories"""
        s = str(skill).strip().lower()

        languages = {
            'java', 'python', 'c', 'c++', 'cpp', 'c#', 'csharp', 'javascript', 'js', 'typescript', 'ts',
            'go', 'golang', 'kotlin', 'rust', 'ruby', 'php', 'swift', 'r', 'matlab', 'scala',
            'perl', 'shell', 'bash', 'powershell', 'assembly', 'dart', 'haskell', 'lua', 'objective-c'
        }
        if s in languages or any(s == lang for lang in languages):
            return 'Programming Languages'

        web = {
            'html', 'html5', 'css', 'css3', 'react', 'react.js', 'reactjs', 'angular', 'angularjs',
            'vue', 'vue.js', 'vuejs', 'node', 'node.js', 'nodejs', 'express', 'express.js', 'expressjs',
            'next.js', 'nextjs', 'django', 'flask', 'fastapi', 'spring', 'spring boot', 'springboot',
            'asp.net', 'asp.net core', 'bootstrap', 'tailwind', 'tailwindcss', 'jquery', 'rest',
            'rest api', 'restful', 'graphql', 'websockets', 'svelte', 'nuxt', 'laravel', 'redux',
            'sass', 'less', 'webpack', 'vite', 'servlets', 'jsp', 'django rest framework', 'drf'
        }
        if s in web:
            return 'Web Technologies / Frameworks'

        databases = {
            'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'mongo', 'redis', 'sqlite',
            'oracle', 'cassandra', 'elasticsearch', 'dynamodb', 'mariadb', 'firebase', 'firestore',
            'neo4j', 'snowflake', 'cockroachdb', 'supabase', 'prisma', 'orm', 'sqlalchemy',
            'relational databases', 'nosql', 'dbms', 'rdbms'
        }
        if s in databases:
            return 'Databases'

        ai_ml = {
            'numpy', 'pandas', 'scikit-learn', 'sklearn', 'tensorflow', 'pytorch', 'nlp',
            'natural language processing', 'machine learning', 'ml', 'deep learning', 'dl',
            'computer vision', 'cv', 'opencv', 'keras', 'huggingface', 'bert', 'distilbert',
            'transformers', 'llm', 'llms', 'langchain', 'scipy', 'matplotlib', 'seaborn',
            'nltk', 'spacy', 'xgboost', 'lightgbm', 'data science', 'data analysis',
            'artificial intelligence', 'ai', 'neural networks', 'reinforcement learning',
            'generative ai', 'genai', 'rag', 'feature engineering', 'model deployment'
        }
        if s in ai_ml:
            return 'AI / Machine Learning'

        cloud = {
            'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'google cloud platform',
            'heroku', 'vercel', 'netlify', 'cloudflare', 'openstack', 'serverless', 'lambda',
            'aws lambda', 'ec2', 's3', 'aws s3', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'cicd',
            'devops', 'terraform', 'ansible', 'jenkins', 'github actions', 'cloud services',
            'microservices', 'cloud computing'
        }
        if s in cloud:
            return 'Cloud'

        tools = {
            'git', 'github', 'gitlab', 'vs code', 'vscode', 'postman', 'jira', 'linux', 'unix',
            'maven', 'gradle', 'pytest', 'junit', 'jest', 'vitest', 'agile', 'scrum', 'bitbucket',
            'trello', 'system design', 'data structures', 'dsa', 'algorithms', 'oop',
            'object-oriented programming', 'design patterns', 'clean code', 'unit testing',
            'software engineering', 'version control', 'gdb', 'valgrind', 'eslint', 'prettier'
        }
        if s in tools:
            return 'Development Tools'

        # Keyword fallbacks
        if any(kw in s for kw in ['sql', 'database', 'db']):
            return 'Databases'
        if any(kw in s for kw in ['learning', 'neural', 'vision', 'nlp', 'data science', 'ai']):
            return 'AI / Machine Learning'
        if any(kw in s for kw in ['cloud', 'aws', 'azure', 'docker', 'kubernetes']):
            return 'Cloud'
        if any(kw in s for kw in ['react', 'angular', 'vue', 'web', 'frontend', 'backend', 'api', 'framework', 'css', 'html']):
            return 'Web Technologies / Frameworks'
        if any(kw in s for kw in ['script', 'lang', 'code', 'programming']):
            return 'Programming Languages'

        return 'Other'

    def get_roadmap_for_resume(self, user_id: int, resume_id: Optional[int] = None, language: str = 'en', target_date: Optional[str] = None) -> Dict[str, Any]:
        """Generate a complete resume-specific learning path payload"""
        # 1. Fetch requested or active/latest resume for user
        if resume_id:
            resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        else:
            resume = Resume.query.filter_by(user_id=user_id).order_by(Resume.created_at.desc()).first()

        if not resume:
            return {
                'resume_id': None,
                'has_resume': False,
                'target_role': None,
                'target_date': None,
                'days_remaining': None,
                'pace_label': None,
                'match_percentage': 0,
                'learning_progress_percent': 0,
                'skills_to_master_count': 0,
                'estimated_weeks': 0,
                'skills': [],
                'daily_plan': None,
                'continue_learning': None,
                'overall_stats': {
                    'skills_completed': 0,
                    'total_skills': 0,
                    'resources_completed': 0,
                    'projects_completed': 0,
                    'assessments_completed': 0
                }
            }

        target_role = getattr(resume, 'target_role', None)
        if not target_role and getattr(resume, 'recommended_roles', None):
            target_role = resume.recommended_roles[0] if isinstance(resume.recommended_roles, list) and len(resume.recommended_roles) > 0 else None
        target_role = target_role or 'Software Engineer'
        current_skills = resume.skills or []

        # 2. Skill Gap Analysis (Read-Only)
        gap_analysis = self.skill_analyzer.analyze_gaps(current_skills, target_role=target_role)
        missing_skills = gap_analysis.get('missing_skills', [])
        matching_skills = gap_analysis.get('matching_skills', [])
        match_percentage = gap_analysis.get('match_percentage', 0)

        # 3. Order missing skills using Prerequisite & Career Graph
        ordered_missing = self._order_skills_by_prerequisites(missing_skills, current_skills)

        # Build list of all items (Missing first as priority, followed by Matching skills)
        all_skill_items = []
        for s in ordered_missing:
            all_skill_items.append({'name': str(s).strip(), 'is_existing': False, 'status': 'missing'})

        for s in current_skills:
            s_clean = str(s).strip()
            # Avoid duplicate if already in missing list
            if not any(item['name'].lower() == s_clean.lower() for item in all_skill_items):
                all_skill_items.append({'name': s_clean, 'is_existing': True, 'status': 'matching'})

        # If resume has no skills extracted yet, provide target role fundamentals
        if not all_skill_items:
            fallback_skills = ['SQL', 'Data Structures', 'Algorithms', 'System Design']
            for s in fallback_skills:
                all_skill_items.append({'name': s, 'is_existing': False, 'status': 'missing'})

        # 4. Fetch stored LearningProgress records for this specific resume_id
        progress_records = LearningProgress.query.filter_by(user_id=user_id, resume_id=resume.id).all()
        progress_map = {p.skill_name.lower(): p for p in progress_records}
        completed_on_platform = [p.skill_name for p in progress_records if p.is_completed or (p.progress_percent and p.progress_percent >= 70)]
        combined_known_skills = list(dict.fromkeys(current_skills + completed_on_platform))

        # 5. Build rich Skill Learning Cards & Roadmap Nodes
        roadmap_skills = []
        total_skills_count = len(all_skill_items)
        completed_skills_count = 0
        total_progress_sum = 0.0

        for idx, item in enumerate(all_skill_items):
            skill_clean = item['name']
            skill_low = skill_clean.lower()
            is_existing = item['is_existing']

            prog_rec = progress_map.get(skill_low)
            stage = prog_rec.stage if prog_rec else 'learn'
            prog_percent = prog_rec.progress_percent if prog_rec else 0.0
            is_completed = prog_rec.is_completed if prog_rec else False

            if is_completed:
                completed_skills_count += 1
                prog_percent = 100.0

            total_progress_sum += prog_percent

            # Categorize priority and duration
            if is_existing:
                priority = 'Developing'
            else:
                priority = 'High' if idx < 3 else ('Medium' if idx < 6 else 'Low')

            estimated_duration = self._estimate_skill_duration(skill_clean, priority)
            category = self.classify_skill(skill_clean)

            # Scored Courses & Personalized Rationale
            courses = self._get_scored_courses(skill_clean, target_role, current_skills, is_existing)

            # Contextual YouTube Videos (with language support)
            youtube_videos = self.youtube_service.get_videos_for_skill(skill_clean, target_role, stage, language=language)

            # Practice Questions & Mini-Project (combining resume skills + completed platform skills)
            practice_questions = self._get_practice_questions(skill_clean)
            project_rec = self._get_project_recommendation(skill_clean, target_role, known_skills=combined_known_skills)

            if is_existing:
                why_recommended = f"{skill_clean} is an existing skill on your resume. Advance your mastery to excel in {target_role} interviews."
            else:
                why_recommended = f"{skill_clean} is a key missing requirement for {target_role} roles. Mastering it will bridge your skill gap."

            roadmap_skills.append({
                'id': idx + 1,
                'skill_name': skill_clean,
                'category': category,
                'status': 'matching' if is_existing else 'missing',
                'is_existing': is_existing,
                'priority': priority,
                'estimated_duration': estimated_duration,
                'why_recommended': why_recommended,
                'stage': stage,  # learn, practice, build, assess, complete
                'progress_percent': prog_percent,
                'is_completed': is_completed,
                'stages_status': prog_rec.to_dict()['stages_status'] if prog_rec else {
                    'learn': False, 'practice': False, 'build': False, 'assess': False, 'complete': False
                },
                'courses': courses,
                'youtube_videos': youtube_videos,
                'practice_questions': practice_questions,
                'project': project_rec,
                'assessment_info': {
                    'title': f"{skill_clean} Readiness Quiz",
                    'questions_count': 5,
                    'estimated_minutes': 10
                }
            })

        # Calculate Overall Metrics
        overall_progress = round(total_progress_sum / total_skills_count, 1) if total_skills_count > 0 else 0.0
        total_weeks_est = sum(int(s['estimated_duration'].split('-')[0]) for s in roadmap_skills if s['estimated_duration'] and s['estimated_duration'][0].isdigit()) if roadmap_skills else 4

        # Calculate Target Date Countdown & Daily Pace
        days_remaining = None
        target_date_str = target_date
        if target_date_str:
            try:
                from datetime import datetime, date
                target_dt = datetime.strptime(target_date_str, '%Y-%m-%d').date()
                today = date.today()
                days_diff = (target_dt - today).days
                days_remaining = max(1, days_diff)
            except Exception as e:
                logger.warning(f"Error parsing target_date {target_date_str}: {e}")
                days_remaining = None

        # Build Daily Plan & Continue Learning
        active_skill = next((s for s in roadmap_skills if not s['is_completed']), roadmap_skills[0] if roadmap_skills else None)
        daily_plan = self._build_daily_plan(active_skill, target_role, days_remaining=days_remaining, target_date=target_date_str, roadmap_skills=roadmap_skills) if active_skill else None
        continue_learning = self._build_continue_learning(active_skill) if active_skill else None

        return {
            'resume_id': resume.id,
            'filename': getattr(resume, 'filename', 'Uploaded Resume'),
            'has_resume': True,
            'target_role': target_role,
            'target_date': target_date_str,
            'days_remaining': days_remaining,
            'pace_label': daily_plan.get('pace_label') if daily_plan else None,
            'current_skills': current_skills,
            'matching_skills': matching_skills,
            'missing_skills': missing_skills,
            'match_percentage': match_percentage,
            'learning_progress_percent': overall_progress,
            'skills_to_master_count': total_skills_count - completed_skills_count,
            'estimated_weeks': total_weeks_est or 4,
            'skills': roadmap_skills,
            'daily_plan': daily_plan,
            'continue_learning': continue_learning,
            'overall_stats': {
                'skills_completed': completed_skills_count,
                'total_skills': total_skills_count,
                'resources_completed': sum(1 for s in roadmap_skills if s['stages_status']['learn']),
                'projects_completed': sum(1 for s in roadmap_skills if s['stages_status']['build']),
                'assessments_completed': sum(1 for s in roadmap_skills if s['stages_status']['assess'])
            }
        }

    def update_skill_progress(self, user_id: int, resume_id: int, skill_name: str, stage: str, is_completed: bool) -> Dict[str, Any]:
        """Update progress for a specific skill and stage bound to resume_id"""
        prog = LearningProgress.query.filter_by(
            user_id=user_id,
            resume_id=resume_id,
            skill_name=skill_name
        ).first()

        if not prog:
            prog = LearningProgress(
                user_id=user_id,
                resume_id=resume_id,
                skill_name=skill_name,
                stage=stage,
                progress_percent=0.0
            )
            db.session.add(prog)

        stage_low = stage.lower()

        if stage_low == 'learn':
            prog.learn_completed = is_completed
        elif stage_low == 'practice':
            prog.practice_completed = is_completed
        elif stage_low == 'build':
            prog.build_completed = is_completed
        elif stage_low == 'assess':
            prog.assess_completed = is_completed
        elif stage_low == 'complete':
            prog.is_completed = is_completed

        # Re-calculate percentage
        completed_stages = sum([
            1 if prog.learn_completed else 0,
            1 if prog.practice_completed else 0,
            1 if prog.build_completed else 0,
            1 if prog.assess_completed else 0
        ])

        prog.progress_percent = (completed_stages / 4.0) * 100.0

        if prog.progress_percent >= 100.0 or is_completed:
            prog.is_completed = True
            prog.stage = 'complete'
            prog.progress_percent = 100.0
        else:
            # Advance active stage
            if not prog.learn_completed:
                prog.stage = 'learn'
            elif not prog.practice_completed:
                prog.stage = 'practice'
            elif not prog.build_completed:
                prog.stage = 'build'
            elif not prog.assess_completed:
                prog.stage = 'assess'

        db.session.commit()
        return prog.to_dict()

    def _order_skills_by_prerequisites(self, missing_skills: List[str], current_skills: List[str]) -> List[str]:
        """Order missing skills so prerequisites come first"""
        curr_low = {s.lower() for s in current_skills}
        
        weighted = []
        for s in missing_skills:
            s_low = s.lower()
            deps = self.prerequisites.get(s_low, [])
            unmet_deps = [d for d in deps if d not in curr_low and d in [m.lower() for m in missing_skills]]
            weight = len(unmet_deps)
            weighted.append((weight, s))

        weighted.sort(key=lambda x: x[0])
        return [w[1] for w in weighted]

    def _get_scored_courses(self, skill: str, target_role: str, current_skills: List[str], is_existing: bool = False) -> List[Dict[str, Any]]:
        """Generate course recommendations with verified mappings or honest search/discovery links"""
        verified_courses = self.skill_analyzer.course_mapping.get(skill)

        scored = []
        if verified_courses:
            for idx, title in enumerate(verified_courses):
                badge = "⭐ Highly Recommended" if idx == 0 else ("Beginner Friendly" if idx == 1 else "Project Based")
                provider = 'Coursera' if idx == 0 else ('Udemy' if idx == 1 else 'NPTEL')
                difficulty = 'Intermediate' if (is_existing or idx >= 2) else 'Beginner'
                why_rec = f"Recommended because {skill} is a {'current' if is_existing else 'missing'} skill for {target_role} roles."

                scored.append({
                    'id': f"c_{skill.lower().replace(' ', '_')}_{idx}",
                    'title': title,
                    'provider': provider,
                    'badge': badge,
                    'difficulty': difficulty,
                    'url': f"https://www.google.com/search?q={title.replace(' ', '+')}",
                    'why_recommended': why_rec
                })
        else:
            # Honest search/discovery links for skills without pre-verified course titles
            search_query = skill.replace(' ', '+')
            if is_existing:
                why_rec = f"Search top rated intermediate & advanced {skill} courses for {target_role} placement readiness."
            else:
                why_rec = f"Search foundational and hands-on {skill} courses required for {target_role} roles."

            scored = [
                {
                    'id': f"c_{skill.lower().replace(' ', '_')}_0",
                    'title': f"Search Top {skill} Courses on Coursera",
                    'provider': 'Coursera',
                    'badge': '⭐ Course Search',
                    'difficulty': 'All Levels',
                    'url': f"https://www.coursera.org/search?query={search_query}",
                    'why_recommended': why_rec
                },
                {
                    'id': f"c_{skill.lower().replace(' ', '_')}_1",
                    'title': f"Find Hands-on {skill} Tutorials on Udemy",
                    'provider': 'Udemy',
                    'badge': 'Practice Search',
                    'difficulty': 'Beginner to Advanced',
                    'url': f"https://www.udemy.com/courses/search/?q={search_query}",
                    'why_recommended': why_rec
                },
                {
                    'id': f"c_{skill.lower().replace(' ', '_')}_2",
                    'title': f"Explore Verified {skill} Learning Paths",
                    'provider': 'Web Search',
                    'badge': 'Resource Discovery',
                    'difficulty': 'Project Based',
                    'url': f"https://www.google.com/search?q=best+{search_query}+courses+for+{target_role.replace(' ', '+')}",
                    'why_recommended': why_rec
                }
            ]
        return scored

    def _estimate_skill_duration(self, skill: str, priority: str) -> str:
        """Provide realistic estimated completion time"""
        heavy_skills = ['data structures', 'algorithms', 'machine learning', 'deep learning', 'kubernetes', 'system design']
        if skill.lower() in heavy_skills:
            return "3-5 weeks"
        return "2-3 weeks" if priority in ['High', 'Developing'] else "1-2 weeks"

    def _get_project_recommendation(self, skill: str, target_role: str = 'Software Engineer', known_skills: List[str] = None) -> Dict[str, Any]:
        """Generate real-world industry problem challenge tailored to skill gap and known resume skills"""
        try:
            if hasattr(self, 'llm_service') and self.llm_service:
                dyn = self.llm_service.generate_real_world_crisis_challenge(
                    gap_skill=skill,
                    known_skills=known_skills,
                    target_role=target_role
                )
                if dyn and isinstance(dyn, dict) and 'problem_statement' in dyn:
                    return dyn
        except Exception as e:
            logger.warning(f"Dynamic project crisis generation fallback: {e}")

        github_search_url = self.llm_service.build_github_starter_url(skill, known_skills) if hasattr(self, 'llm_service') else f"https://github.com/search?q={skill}+starter+template&type=repositories"

        dbms_challenge = {
            'title': 'E-Commerce Flash-Sale Concurrency & Inventory Race Condition',
            'problem_statement': 'During peak flash sales, thousands of users buy remaining inventory simultaneously, leading to negative stock counts, duplicate orders, and database deadlocks.',
            'description': 'Design a robust relational database schema with locking transactions (Optimistic or Pessimistic) to prevent negative inventory during high-concurrency order checkouts.',
            'difficulty': 'Intermediate to Advanced',
            'estimated_time': '6-10 Hours',
            'github_url': 'https://github.com/topics/sql-database-design',
            'search_url': github_search_url,
            'learnings': ['ACID Transactions & Locking', 'Relational Schema Design', 'Database Indexing & Query Optimization'],
            'criteria': [
                'Database schema defines primary keys, foreign key constraints, and indices on product_id.',
                'Order placement queries use transactional locking (FOR UPDATE or version checking) to prevent negative inventory.',
                'Includes a test script verifying zero negative inventory balance during 50+ concurrent requests.'
            ],
            'steps': [
                'Design relational tables (Users, Products, Orders, Inventory) with proper indices.',
                'Implement atomic transaction SQL queries with FOR UPDATE row-level locking.',
                'Write automated unit/integration tests verifying concurrent checkout isolation.'
            ]
        }

        projects_map = {
            'sql': dbms_challenge,
            'dbms': dbms_challenge,
            'databases': dbms_challenge,
            'aws': {
                'title': 'High-Availability Asynchronous Media Processing Pipeline',
                'description': 'Build an AWS serverless architecture that ingests media uploads asynchronously via S3, triggers Lambda processing, and updates DynamoDB status without blocking web servers.',
                'problem_statement': 'Synchronous file uploads cause web servers to time out and crash during heavy user traffic spikes.',
                'difficulty': 'Intermediate',
                'estimated_time': '6-8 Hours',
                'github_url': 'https://github.com/aws-samples',
                'search_url': github_search_url,
                'learnings': ['AWS S3 & DynamoDB Integration', 'Serverless Lambda Functions', 'IAM Roles & Access Policies'],
                'criteria': [
                    'Uses AWS S3 bucket event notifications to trigger an asynchronous processing function.',
                    'Stores image metadata and processing status records in AWS DynamoDB or database.',
                    'Configures principle-of-least-privilege IAM policies for execution roles.'
                ],
                'steps': [
                    'Configure S3 Bucket with CORS and event notification triggers.',
                    'Create AWS Lambda function (or local mock) to resize images upon upload.',
                    'Persist upload metadata to DynamoDB table and output public access URLs.'
                ]
            },
            'python': {
                'title': 'Production Data Pipeline & ETL Validation Engine',
                'description': 'Build a resilient Python ETL pipeline that extracts raw messy datasets, validates schemas, handles exceptions, and stores cleaned records.',
                'problem_statement': 'Upstream third-party APIs return corrupt JSON and missing fields, crashing downstream analytics reports.',
                'difficulty': 'Intermediate',
                'estimated_time': '8-12 Hours',
                'github_url': 'https://github.com/topics/python-pipeline',
                'search_url': github_search_url,
                'learnings': ['Python Data Pipelines', 'Robust Exception Handling', 'Automated Testing with pytest'],
                'criteria': [
                    'Defines data schema validation functions handling nulls, type mismatches, and corrupt fields.',
                    'Implements custom Python exception classes and logging instead of silent crashes.',
                    'Includes pytest test suite covering edge cases and error handling.'
                ],
                'steps': [
                    'Set up virtual environment with dependency configuration (requirements.txt/Poetry).',
                    'Build modular extraction, transformation, and load functions.',
                    'Write comprehensive pytest test suite verifying edge cases.'
                ]
            },
            'react': {
                'title': 'High-Frequency Financial Dashboard & State Optimization',
                'description': 'Build a responsive React analytics dashboard that handles fast-streaming WebSocket data feeds without page lag or UI memory leaks.',
                'problem_statement': 'High-frequency WebSocket message updates cause non-stop React re-renders, causing browser UI freezes and memory leaks.',
                'difficulty': 'Intermediate',
                'estimated_time': '8-12 Hours',
                'github_url': 'https://github.com/topics/react-dashboard',
                'search_url': github_search_url,
                'learnings': ['React Component Memoization', 'Custom Hook Architecture', 'State Performance Throttling'],
                'criteria': [
                    'Uses React.memo, useMemo, or useCallback to prevent unneeded child component re-renders.',
                    'Implements custom hooks for data fetching or WebSocket connection lifecycle.',
                    'Implements message debouncing/throttling to batch UI updates efficiently.'
                ],
                'steps': [
                    'Set up React Vite project with modular component hierarchy.',
                    'Implement custom hook for state management and API stream handling.',
                    'Apply React performance optimizations (useMemo/useCallback/React.memo).'
                ]
            },
            'go': {
                'title': 'High-Concurrency Distributed Worker Pool & Network Scanner',
                'problem_statement': 'Synchronous network pings cause latency bottlenecks. Build a concurrent Go worker pool using Goroutines and Channels.',
                'description': 'Implement concurrent worker pools, channel communication, and context timeout controls in Go.',
                'difficulty': 'Intermediate',
                'estimated_time': '8-12 Hours',
                'github_url': 'https://github.com/topics/golang-worker-pool',
                'search_url': github_search_url,
                'learnings': ['Goroutines & Channels', 'Context Timeout Control', 'Concurrent Memory Safety'],
                'criteria': [
                    'Uses Goroutines and buffered Channels to distribute network tasks across workers.',
                    'Implements context.WithTimeout to cancel slow workers gracefully.',
                    'Includes Go unit tests (testing package) verifying race conditions (go test -race).'
                ],
                'steps': [
                    'Create a Go module with worker pool channel architecture.',
                    'Implement context cancellation and channel select statements.',
                    'Write benchmark and race condition unit tests.'
                ]
            },
            'golang': {
                'title': 'High-Concurrency Distributed Worker Pool & Network Scanner',
                'problem_statement': 'Synchronous network pings cause latency bottlenecks. Build a concurrent Go worker pool using Goroutines and Channels.',
                'description': 'Implement concurrent worker pools, channel communication, and context timeout controls in Go.',
                'difficulty': 'Intermediate',
                'estimated_time': '8-12 Hours',
                'github_url': 'https://github.com/topics/golang-worker-pool',
                'search_url': github_search_url,
                'learnings': ['Goroutines & Channels', 'Context Timeout Control', 'Concurrent Memory Safety'],
                'criteria': [
                    'Uses Goroutines and buffered Channels to distribute network tasks across workers.',
                    'Implements context.WithTimeout to cancel slow workers gracefully.',
                    'Includes Go unit tests (testing package) verifying race conditions (go test -race).'
                ],
                'steps': [
                    'Create a Go module with worker pool channel architecture.',
                    'Implement context cancellation and channel select statements.',
                    'Write benchmark and race condition unit tests.'
                ]
            },
            'docker': {
                'title': 'Zero-Downtime Microservice Containerization & Multi-Stage Builds',
                'problem_statement': 'Bloated 2GB Docker images increase deployment times and cloud hosting costs.',
                'description': 'Write optimized multi-stage Dockerfiles and docker-compose configurations for enterprise production deployments.',
                'difficulty': 'Intermediate',
                'estimated_time': '6-8 Hours',
                'github_url': 'https://github.com/topics/docker-microservices',
                'search_url': github_search_url,
                'learnings': ['Multi-Stage Docker Builds', 'Docker Compose Networking', 'Container Security Best Practices'],
                'criteria': [
                    'Implements multi-stage Dockerfile reducing final image size under 150MB.',
                    'Creates docker-compose.yml orchestrating app, database, and Redis container networks.',
                    'Runs container under non-root USER security policies.'
                ],
                'steps': [
                    'Write modular multi-stage Dockerfile for target application.',
                    'Configure docker-compose.yml with health checks and volume mounts.',
                    'Verify container startup, zero root privileges, and memory boundaries.'
                ]
            },
            'graphql': {
                'title': 'N+1 Database Query Resolution & Schema Federation',
                'problem_statement': 'Nested GraphQL queries trigger hundreds of redundant database queries, causing severe server latency.',
                'description': 'Implement DataLoader batching, GraphQL schema types, and query complexity limits in a production API.',
                'difficulty': 'Intermediate to Advanced',
                'estimated_time': '8-12 Hours',
                'github_url': 'https://github.com/topics/graphql-api',
                'search_url': github_search_url,
                'learnings': ['DataLoader Batching', 'GraphQL Schema Definition', 'Query Complexity Throttling'],
                'criteria': [
                    'Defines strongly-typed GraphQL schema definitions and resolver functions.',
                    'Integrates DataLoader batching to eliminate N+1 database queries.',
                    'Implements query depth/complexity limits to prevent denial-of-service queries.'
                ],
                'steps': [
                    'Define GraphQL schema types, queries, and mutations.',
                    'Implement DataLoader batching functions for nested field resolvers.',
                    'Write integration tests verifying single SQL batch execution.'
                ]
            },
            'machine learning': {
                'title': 'Real-Time Fraud Detection & Concept Drift Pipeline',
                'problem_statement': 'E-Commerce transaction fraud patterns evolve dynamically, causing static ML models to fail over time.',
                'description': 'Build an end-to-end machine learning pipeline with feature engineering, model evaluation, and automated drift detection.',
                'difficulty': 'Advanced',
                'estimated_time': '10-15 Hours',
                'github_url': 'https://github.com/topics/machine-learning-pipeline',
                'search_url': github_search_url,
                'learnings': ['Feature Engineering', 'Model Evaluation & ROC-AUC', 'Concept Drift Detection'],
                'criteria': [
                    'Preprocesses dataset with handling for missing values, scaling, and class imbalance (SMOTE/undersampling).',
                    'Trains binary classifier evaluating Precision, Recall, and ROC-AUC metrics.',
                    'Implements model persistence (joblib/pickle) and inference API endpoint.'
                ],
                'steps': [
                    'Clean and engineer numerical/categorical dataset features.',
                    'Train Scikit-Learn/XGBoost classification models with cross-validation.',
                    'Save model artifacts and write automated API inference tests.'
                ]
            }
        }

        # Dynamic On-The-Fly Fallback Generator for any niche/unlisted skill
        s_clean = skill.strip()
        fallback = {
            'title': f"Real-World {s_clean} Enterprise Architecture Challenge",
            'problem_statement': f"Legacy systems handling {s_clean} suffer from performance bottlenecks and lack automated test coverage under production load.",
            'description': f"Build a production-grade module demonstrating core concepts, error boundaries, and design patterns of {s_clean} for your {target_role} portfolio.",
            'difficulty': 'Intermediate',
            'estimated_time': '6-8 Hours',
            'github_url': github_search_url,
            'search_url': github_search_url,
            'learnings': [f"{s_clean} Architecture & Patterns", "API / Data Integration", "Clean Code & Testing"],
            'criteria': [
                f"Repository contains valid source code files utilizing {s_clean} core concepts and design patterns.",
                "Implements modular code structure, robust exception handling, and clean documentation.",
                "Includes a detailed README.md explaining architecture, setup instructions, and execution steps."
            ],
            'steps': [
                f"Set up a clean GitHub repository for {s_clean}",
                f"Implement core logic and unit tests using {s_clean} best practices",
                "Write a detailed README.md and push code to GitHub"
            ]
        }
        return projects_map.get(s_clean.lower(), fallback)

    def _get_practice_questions(self, skill: str) -> List[Dict[str, Any]]:
        """Generate interactive practice questions for skill"""
        skill_low = skill.lower()
        if skill_low == 'sql':
            return [
                {
                    'id': 1,
                    'question': 'How do you retrieve the second highest salary from an Employee table?',
                    'hint': 'Use subquery with MAX() or OFFSET 1 LIMIT 1.',
                    'options': [
                        'SELECT MAX(salary) FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee)',
                        'SELECT salary FROM Employee ORDER BY salary DESC LIMIT 1',
                        'SELECT SECOND(salary) FROM Employee',
                        'SELECT salary FROM Employee WHERE rownum = 2'
                    ],
                    'correct_index': 0,
                    'explanation': 'The subquery finds the maximum salary lower than the top maximum salary, correctly yielding the 2nd highest.'
                },
                {
                    'id': 2,
                    'question': 'Which SQL JOIN returns all matching rows from both tables plus unmatched left rows?',
                    'hint': 'It keeps all records from the left table.',
                    'options': ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'],
                    'correct_index': 1,
                    'explanation': 'LEFT JOIN returns all records from the left table, and the matched records from the right table.'
                }
            ]
        elif skill_low == 'python':
            return [
                {
                    'id': 1,
                    'question': 'What is the key difference between a Python list and a tuple?',
                    'hint': 'Consider mutability.',
                    'options': [
                        'Lists are mutable while tuples are immutable.',
                        'Tuples can only store integers.',
                        'Lists cannot be iterated over.',
                        'There is no functional difference.'
                    ],
                    'correct_index': 0,
                    'explanation': 'Lists use brackets [] and can be modified after creation, whereas tuples use parentheses () and cannot be changed.'
                }
            ]
        elif skill_low == 'java':
            return [
                {
                    'id': 1,
                    'question': 'What is the main advantage of the Java Virtual Machine (JVM)?',
                    'hint': 'Think about "Write Once, Run Anywhere".',
                    'options': [
                        'Platform independence through bytecode execution.',
                        'Automatic elimination of all syntax errors.',
                        'Faster execution speed than raw C assembly.',
                        'Guaranteed zero memory usage.'
                    ],
                    'correct_index': 0,
                    'explanation': 'JVM compiles Java source code into bytecode, allowing it to run on any operating system with a JVM installed.'
                }
            ]
        elif skill_low in ['data structures', 'dsa']:
            return [
                {
                    'id': 1,
                    'question': 'What is the average time complexity for searching an element in a balanced Binary Search Tree (BST)?',
                    'hint': 'The search space halves at every step.',
                    'options': ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
                    'correct_index': 2,
                    'explanation': 'In a balanced BST, each comparison reduces search space by half, resulting in logarithmic O(log n) time complexity.'
                }
            ]
        # Dynamic fallback practice questions for any custom skill
        return [
            {
                'id': 1,
                'question': f"What is the primary architectural purpose of using {skill} in software development?",
                'hint': f"Focus on core principles of {skill}.",
                'options': [
                    f"To provide scalable and maintainable solutions for {skill} workflows.",
                    "To replace all existing database systems.",
                    "To eliminate the need for version control.",
                    "None of the above."
                ],
                'correct_index': 0,
                'explanation': f"{skill} provides standardized patterns for building scalable software components."
            },
            {
                'id': 2,
                'question': f"Which best practice should be followed when building production modules with {skill}?",
                'hint': "Consider modular design and testing.",
                'options': [
                    "Follow modular component design and write unit tests.",
                    "Hardcode all environment secrets directly in code.",
                    "Disable error handling to increase runtime performance.",
                    "Avoid code formatting standards."
                ],
                'correct_index': 0,
                'explanation': "Modular design and automated testing ensure reliable software maintenance."
            }
        ]

    def _build_daily_plan(self, active_skill: Dict[str, Any], target_role: str, days_remaining: Optional[int] = None, target_date: Optional[str] = None, roadmap_skills: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Build Today's Goal widget data with dynamic pace calculation"""
        skill_name = active_skill['skill_name']
        stage = active_skill['stage']

        stage_tasks = {
            'learn': f"Watch 1 core video tutorial on {skill_name} fundamentals.",
            'practice': f"Solve 2 interactive practice questions for {skill_name}.",
            'build': f"Set up repository & complete Step 1 of {skill_name} mini-project.",
            'assess': f"Complete the 5-question {skill_name} readiness quiz."
        }

        est_mins = 30
        pace_label = "🎯 Standard Pace"

        if days_remaining and roadmap_skills:
            uncompleted_skills = [s for s in roadmap_skills if not s.get('is_completed')]
            total_hours = len(uncompleted_skills) * 3
            computed_mins = max(15, round((total_hours * 60) / days_remaining))
            est_mins = min(120, computed_mins)

            if days_remaining <= 7:
                pace_label = "🔥 Sprint Pace (Close Target Date)"
                est_mins = max(60, min(180, computed_mins))
            elif days_remaining <= 21:
                pace_label = "⚡ Crash Course Pace"
                est_mins = max(45, min(120, computed_mins))
            elif days_remaining <= 60:
                pace_label = "🎯 Standard Pace"
                est_mins = min(55, max(35, computed_mins))
            else:
                pace_label = "☕ Relaxed Pace"
                est_mins = min(30, max(15, computed_mins))

        return {
            'skill_name': skill_name,
            'goal_title': f"Mastering {skill_name} — {stage.capitalize()} Phase",
            'estimated_minutes': est_mins,
            'task_description': stage_tasks.get(stage, f"Spend {est_mins} minutes practicing {skill_name}."),
            'stage': stage,
            'target_role': target_role,
            'target_date': target_date,
            'days_remaining': days_remaining,
            'pace_label': pace_label
        }

    def _build_continue_learning(self, active_skill: Dict[str, Any]) -> Dict[str, Any]:
        """Build Continue Learning widget data"""
        return {
            'skill_name': active_skill['skill_name'],
            'stage': active_skill['stage'],
            'progress_percent': active_skill['progress_percent'],
            'priority': active_skill['priority']
        }
