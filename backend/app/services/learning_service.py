# backend/app/services/learning_service.py

import logging
from typing import Dict, List, Any, Optional
from app import db
from app.models.resume import Resume
from app.models.learning import LearningProgress, LearningBookmark, LearningActivity
from app.services.skill_analyzer import SkillAnalyzer
from app.services.youtube_service import YouTubeService
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

    def get_roadmap_for_resume(self, user_id: int, resume_id: Optional[int] = None) -> Dict[str, Any]:
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
                'target_role': 'Software Engineer',
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
        ordered_skills = self._order_skills_by_prerequisites(missing_skills, current_skills)

        # 4. Fetch stored LearningProgress records for this specific resume_id
        progress_records = LearningProgress.query.filter_by(user_id=user_id, resume_id=resume.id).all()
        progress_map = {p.skill_name.lower(): p for p in progress_records}

        # 5. Build rich Skill Learning Cards & Roadmap Nodes
        roadmap_skills = []
        total_skills_count = len(ordered_skills)
        completed_skills_count = 0
        total_progress_sum = 0.0

        for idx, skill in enumerate(ordered_skills):
            skill_clean = str(skill).strip()
            skill_low = skill_clean.lower()

            prog_rec = progress_map.get(skill_low)
            stage = prog_rec.stage if prog_rec else 'learn'
            prog_percent = prog_rec.progress_percent if prog_rec else 0.0
            is_completed = prog_rec.is_completed if prog_rec else False

            if is_completed:
                completed_skills_count += 1
                prog_percent = 100.0

            total_progress_sum += prog_percent

            # Categorize priority
            priority = 'High' if idx < 3 else ('Medium' if idx < 6 else 'Low')
            estimated_duration = self._estimate_skill_duration(skill_clean, priority)

            # Scored Courses & Rationale
            courses = self._get_scored_courses(skill_clean, target_role, current_skills)

            # Contextual YouTube Videos
            youtube_videos = self.youtube_service.get_videos_for_skill(skill_clean, target_role, stage)

            # Practice Questions & Mini-Project
            practice_questions = self._get_practice_questions(skill_clean)
            project_rec = self._get_project_recommendation(skill_clean, target_role)

            roadmap_skills.append({
                'id': idx + 1,
                'skill_name': skill_clean,
                'priority': priority,
                'estimated_duration': estimated_duration,
                'why_recommended': f"{skill_clean} is a current skill gap required for {target_role} roles.",
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
        total_weeks_est = sum(int(s['estimated_duration'].split('-')[0]) for s in roadmap_skills) if roadmap_skills else 0

        # Build Daily Plan & Continue Learning
        active_skill = next((s for s in roadmap_skills if not s['is_completed']), roadmap_skills[0] if roadmap_skills else None)
        daily_plan = self._build_daily_plan(active_skill, target_role) if active_skill else None
        continue_learning = self._build_continue_learning(active_skill) if active_skill else None

        return {
            'resume_id': resume.id,
            'filename': getattr(resume, 'filename', 'Uploaded Resume'),
            'has_resume': True,
            'target_role': target_role,
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
        
        # Calculate dependency weight
        weighted = []
        for s in missing_skills:
            s_low = s.lower()
            deps = self.prerequisites.get(s_low, [])
            unmet_deps = [d for d in deps if d not in curr_low and d in [m.lower() for m in missing_skills]]
            # Lower unmet_deps score means can be learned earlier
            weight = len(unmet_deps)
            weighted.append((weight, s))

        weighted.sort(key=lambda x: x[0])
        return [w[1] for w in weighted]

    def _get_scored_courses(self, skill: str, target_role: str, current_skills: List[str]) -> List[Dict[str, Any]]:
        """Generate scored course recommendations with transparent rationale"""
        raw_courses = self.skill_analyzer.course_mapping.get(skill, [
            f"{skill} Complete Fundamentals",
            f"Mastering {skill} for Professionals",
            f"Applied {skill} Projects"
        ])

        scored = []
        for idx, title in enumerate(raw_courses):
            badge = "⭐ Highly Recommended" if idx == 0 else ("Beginner Friendly" if idx == 1 else "Project Based")
            scored.append({
                'id': f"c_{skill}_{idx}",
                'title': title,
                'provider': 'Coursera' if idx == 0 else ('Udemy' if idx == 1 else 'NPTEL'),
                'badge': badge,
                'difficulty': 'Beginner' if idx < 2 else 'Intermediate',
                'url': f"https://www.google.com/search?q={title.replace(' ', '+')}",
                'why_recommended': f"Selected because it directly addresses your missing {skill} skill for {target_role} and builds essential foundation."
            })
        return scored

    def _estimate_skill_duration(self, skill: str, priority: str) -> str:
        """Provide realistic estimated completion time"""
        heavy_skills = ['data structures', 'algorithms', 'machine learning', 'deep learning', 'kubernetes', 'system design']
        if skill.lower() in heavy_skills:
            return "3-5 weeks"
        return "2-3 weeks" if priority == 'High' else "1-2 weeks"

    def _get_project_recommendation(self, skill: str, target_role: str) -> Dict[str, Any]:
        """Generate mini-project idea tailored to skill"""
        projects_map = {
            'SQL': {
                'title': 'Student Placement & Performance Database System',
                'description': 'Design relational tables, write complex JOIN queries, index fields, and optimize query speed.',
                'difficulty': 'Intermediate',
                'estimated_time': '6-10 Hours',
                'learnings': ['SQL Joins & Indexing', 'Schema Design', 'Data Aggregation']
            },
            'Data Structures': {
                'title': 'High-Performance Contact & Task Management System',
                'description': 'Build a CLI/web task scheduler utilizing HashMaps, Trees, and Priority Queues for O(1) lookups.',
                'difficulty': 'Beginner to Intermediate',
                'estimated_time': '8-12 Hours',
                'learnings': ['Binary Search Trees', 'HashMap Optimization', 'Time Complexity']
            },
            'Algorithms': {
                'title': 'Optimal Route & Logistics Planner',
                'description': 'Implement Dijkstra algorithm and Dynamic Programming to solve shortest path and knapsack problems.',
                'difficulty': 'Intermediate',
                'estimated_time': '10-15 Hours',
                'learnings': ['Graph Algorithms', 'Dynamic Programming', 'Big-O Analysis']
            }
        }
        fallback = {
            'title': f"Real-World {skill} Application",
            'description': f"Build a practical module demonstrating core concepts of {skill} for your {target_role} portfolio.",
            'difficulty': 'Intermediate',
            'estimated_time': '6-8 Hours',
            'learnings': [f"{skill} Architecture", "API Integration", "Clean Code Best Practices"]
        }
        return projects_map.get(skill, fallback)

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
        # General fallback practice question
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
            }
        ]

    def _build_daily_plan(self, active_skill: Dict[str, Any], target_role: str) -> Dict[str, Any]:
        """Build Today's Goal widget data"""
        skill_name = active_skill['skill_name']
        stage = active_skill['stage']

        stage_tasks = {
            'learn': f"Watch 1 core video tutorial on {skill_name} fundamentals.",
            'practice': f"Solve 2 interactive practice questions for {skill_name}.",
            'build': f"Set up repository & complete Step 1 of {skill_name} mini-project.",
            'assess': f"Complete the 5-question {skill_name} readiness quiz."
        }

        return {
            'skill_name': skill_name,
            'goal_title': f"Mastering {skill_name} — {stage.capitalize()} Phase",
            'estimated_minutes': 30,
            'task_description': stage_tasks.get(stage, f"Spend 30 minutes practicing {skill_name}."),
            'stage': stage,
            'target_role': target_role
        }

    def _build_continue_learning(self, active_skill: Dict[str, Any]) -> Dict[str, Any]:
        """Build Continue Learning widget data"""
        return {
            'skill_name': active_skill['skill_name'],
            'stage': active_skill['stage'],
            'progress_percent': active_skill['progress_percent'],
            'priority': active_skill['priority']
        }
