# backend/app/api/v1/learning/routes.py

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.api.v1.learning import learning_bp
from app.services.learning_service import LearningService
from app.models.learning import LearningBookmark, LearningProgress, LearningActivity
from app.models.resume import Resume
from app.services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)

learning_service = LearningService()

@learning_bp.route('/roadmap', methods=['GET'])
@jwt_required()
def get_roadmap():
    """Retrieve resume-specific learning roadmap and scored recommendations"""
    try:
        current_user_id = int(get_jwt_identity())
        resume_id_param = request.args.get('resume_id')
        resume_id = int(resume_id_param) if (resume_id_param and resume_id_param.isdigit()) else None
        language = request.args.get('language', 'en')
        target_date = request.args.get('target_date', None)

        roadmap = learning_service.get_roadmap_for_resume(user_id=current_user_id, resume_id=resume_id, language=language, target_date=target_date)
        return jsonify(roadmap), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/progress', methods=['POST'])
@jwt_required()
def update_progress():
    """Update skill stage progress bound to resume_id"""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}

        resume_id = data.get('resume_id')
        skill_name = data.get('skill_name')
        stage = data.get('stage', 'learn')
        is_completed = data.get('is_completed', True)

        if not resume_id or not skill_name:
            return jsonify({'error': 'resume_id and skill_name are required'}), 400

        result = learning_service.update_skill_progress(
            user_id=current_user_id,
            resume_id=int(resume_id),
            skill_name=skill_name,
            stage=stage,
            is_completed=is_completed
        )

        # Log activity
        activity = LearningActivity(
            user_id=current_user_id,
            resume_id=int(resume_id),
            skill_name=skill_name,
            activity_type=f"stage_{stage}_{'complete' if is_completed else 'updated'}",
            details=f"Updated {skill_name} stage {stage}"
        )
        db.session.add(activity)
        db.session.commit()

        return jsonify({
            'message': 'Progress updated successfully',
            'progress': result
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/bookmarks', methods=['GET'])
@jwt_required()
def get_bookmarks():
    """Get saved learning resources for active resume"""
    try:
        current_user_id = int(get_jwt_identity())
        resume_id_param = request.args.get('resume_id')

        query = LearningBookmark.query.filter_by(user_id=current_user_id)
        if resume_id_param and resume_id_param.isdigit():
            query = query.filter_by(resume_id=int(resume_id_param))

        bookmarks = query.order_by(LearningBookmark.created_at.desc()).all()
        return jsonify({
            'bookmarks': [b.to_dict() for b in bookmarks],
            'total': len(bookmarks)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/bookmarks', methods=['POST'])
@jwt_required()
def add_bookmark():
    """Bookmark a video, course, article, or project"""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}

        resume_id = data.get('resume_id')
        skill_name = data.get('skill_name')
        resource_type = data.get('resource_type', 'youtube')
        title = data.get('title')

        if not resume_id or not skill_name or not title:
            return jsonify({'error': 'resume_id, skill_name and title are required'}), 400

        # Check existing
        existing = LearningBookmark.query.filter_by(
            user_id=current_user_id,
            resume_id=int(resume_id),
            title=title
        ).first()

        if existing:
            return jsonify({'message': 'Bookmark already saved', 'bookmark': existing.to_dict()}), 200

        bookmark = LearningBookmark(
            user_id=current_user_id,
            resume_id=int(resume_id),
            skill_name=skill_name,
            resource_type=resource_type,
            title=title,
            url=data.get('url'),
            thumbnail=data.get('thumbnail'),
            provider=data.get('provider'),
            extra_data=data.get('extra_data', {})
        )
        db.session.add(bookmark)
        db.session.commit()

        return jsonify({
            'message': 'Bookmark saved successfully',
            'bookmark': bookmark.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/bookmarks/<int:bookmark_id>', methods=['DELETE'])
@jwt_required()
def delete_bookmark(bookmark_id):
    """Remove a saved bookmark"""
    try:
        current_user_id = int(get_jwt_identity())
        bookmark = LearningBookmark.query.filter_by(id=bookmark_id, user_id=current_user_id).first()
        if not bookmark:
            return jsonify({'error': 'Bookmark not found'}), 404

        db.session.delete(bookmark)
        db.session.commit()
        return jsonify({'message': 'Bookmark removed successfully', 'id': bookmark_id}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/projects/submit', methods=['POST'])
@jwt_required()
def submit_project():
    """Submit completed mini-project GitHub repository URL and complete build stage"""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}

        resume_id = data.get('resume_id')
        skill_name = data.get('skill_name')
        github_url = (data.get('github_url') or '').strip()

        if not resume_id or not skill_name or not github_url:
            return jsonify({'error': 'resume_id, skill_name, and github_url are required'}), 400

        if not github_url.startswith('http'):
            return jsonify({'error': 'Please provide a valid repository URL (e.g. https://github.com/username/repo)'}), 400

        # Mark project stage 'build' as completed
        result = learning_service.update_skill_progress(
            user_id=current_user_id,
            resume_id=int(resume_id),
            skill_name=skill_name,
            stage='build',
            is_completed=True
        )

        # Log activity
        activity = LearningActivity(
            user_id=current_user_id,
            resume_id=int(resume_id),
            skill_name=skill_name,
            activity_type='project_submitted',
            details=f"Submitted portfolio project repository: {github_url}"
        )
        db.session.add(activity)
        db.session.commit()

        return jsonify({
            'message': f'Portfolio project for {skill_name} submitted successfully!',
            'progress': result,
            'github_url': github_url
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/projects/regenerate-challenge', methods=['POST'])
@jwt_required(optional=True)
def regenerate_project_challenge():
    """Generates a fresh real-world crisis scenario for a given skill and resume context"""
    try:
        data = request.get_json() or {}
        skill_name = data.get('skill_name', 'AWS')
        target_role = data.get('target_role', 'Software Engineer')
        known_skills = data.get('known_skills', ['Python', 'SQL'])

        from app.services.llm_service import LLMService
        llm_service = LLMService()

        new_project = llm_service.generate_real_world_crisis_challenge(
            gap_skill=skill_name,
            known_skills=known_skills,
            target_role=target_role
        )

        return jsonify({'project': new_project}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/projects/evaluate-solution', methods=['POST'])
@jwt_required()
def evaluate_project_solution():
    """Evaluate GitHub repository against skill gap real-world problem statement"""
    try:
        from app.services.problem_evaluator import ProblemEvaluator
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}

        resume_id = data.get('resume_id')
        skill_name = data.get('skill_name')
        github_url = (data.get('github_url') or '').strip()
        problem_statement = data.get('problem_statement', '')
        criteria = data.get('criteria', [])

        if not resume_id or not skill_name or not github_url:
            return jsonify({'error': 'resume_id, skill_name, and github_url are required'}), 400

        # Retrieve candidate resume to enforce GitHub ownership verification
        import re
        expected_github_username = None
        resume = Resume.query.filter_by(id=int(resume_id), user_id=current_user_id).first()
        if not resume:
            resume = Resume.query.get(int(resume_id))

        if resume:
            links = resume.links or {}
            personal_info = resume.personal_info or {}
            raw_github = links.get('github') or personal_info.get('github')
            if raw_github:
                m = re.search(r'github\.com\/([a-zA-Z0-9_\-\.]+)', str(raw_github), re.IGNORECASE)
                if m:
                    expected_github_username = m.group(1).rstrip('/')
                else:
                    expected_github_username = str(raw_github).strip().lstrip('@')

        evaluator = ProblemEvaluator()
        result = evaluator.evaluate_github_solution(
            skill_name=skill_name,
            problem_statement=problem_statement,
            criteria=criteria,
            github_url=github_url,
            expected_owner=expected_github_username
        )

        if 'error' in result:
            return jsonify({'error': result['error']}), 400

        # If resume had no GitHub link attached, register this verified account for future checks
        if resume and not expected_github_username:
            repo_match = re.match(r'^https://github\.com/([a-zA-Z0-9_-]+)/', github_url)
            if repo_match:
                new_links = dict(resume.links or {})
                new_links['github'] = f"https://github.com/{repo_match.group(1)}"
                resume.links = new_links
                db.session.commit()

        is_solved = result.get('is_problem_solved', False)

        # If problem solved (score >= 70%), mark stage build as completed
        if is_solved:
            learning_service.update_skill_progress(
                user_id=current_user_id,
                resume_id=int(resume_id),
                skill_name=skill_name,
                stage='build',
                is_completed=True
            )

            # Log milestone activity with verified Git authenticity proof
            audit_info = result.get('commit_audit', {})
            recent_commits = audit_info.get('recent_commits', [])
            latest_sha = recent_commits[0].get('sha', 'HEAD') if recent_commits else 'HEAD'
            prog_score = audit_info.get('progression_score', 90)

            activity = LearningActivity(
                user_id=current_user_id,
                resume_id=int(resume_id),
                skill_name=skill_name,
                activity_type='problem_challenge_passed',
                details=f"Passed solution for {skill_name} | Score: {result.get('solution_score', 0)}% | Git SHA: {latest_sha} | Progression: {prog_score}%"
            )
            db.session.add(activity)
            db.session.commit()

        return jsonify({
            'success': True,
            'evaluation': result
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/projects/defense-questions', methods=['POST'])
@jwt_required()
def get_defense_questions():
    """Generates 2 architectural defense questions based on candidate's solution"""
    try:
        data = request.get_json() or {}
        skill_name = data.get('skill_name')
        problem_statement = data.get('problem_statement', '')
        
        if not skill_name:
            return jsonify({'error': 'skill_name is required'}), 400

        llm = LLMService()
        questions = llm.generate_architecture_defense_questions(
            skill_name=skill_name,
            problem_statement=problem_statement
        )

        return jsonify({
            'success': True,
            'questions': questions
        }), 200

    except Exception as e:
        logger.error(f"Error generating defense questions: {e}")
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/projects/submit-defense', methods=['POST'])
@jwt_required()
def submit_architecture_defense():
    """Evaluates candidate's written architectural defense and returns Bar Raiser score & coaching"""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        resume_id = data.get('resume_id')
        skill_name = data.get('skill_name')
        problem_statement = data.get('problem_statement', '')
        questions = data.get('questions', [])
        user_answers = data.get('user_answers', {})

        if not skill_name or not user_answers:
            return jsonify({'error': 'skill_name and user_answers are required'}), 400

        llm = LLMService()
        defense_result = llm.evaluate_architecture_defense(
            skill_name=skill_name,
            problem_statement=problem_statement,
            questions=questions,
            user_answers=user_answers
        )

        # Record verified Defense Interview milestone in LearningActivity
        if resume_id and current_user_id:
            score = defense_result.get('defense_score', 80)
            verdict = defense_result.get('verdict', 'Hire')
            activity = LearningActivity(
                user_id=current_user_id,
                resume_id=int(resume_id),
                skill_name=skill_name,
                activity_type='architecture_defense_passed',
                details=f"Defended architecture for {skill_name} | Score: {score}% | Verdict: {verdict}"
            )
            db.session.add(activity)
            db.session.commit()

        return jsonify({
            'success': True,
            'defense_result': defense_result
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error evaluating architecture defense: {e}")
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/youtube', methods=['GET'])
@jwt_required()
def get_youtube_resources():
    """Fetch contextual YouTube videos for a skill and stage"""
    try:
        skill = request.args.get('skill', 'SQL')
        target_role = request.args.get('target_role', 'Software Engineer')
        stage = request.args.get('stage', 'learn')
        language = request.args.get('language', 'en')

        videos = learning_service.youtube_service.get_videos_for_skill(skill=skill, target_role=target_role, stage=stage, language=language)
        return jsonify({
            'skill': skill,
            'target_role': target_role,
            'stage': stage,
            'language': language,
            'videos': videos
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/ai-assist', methods=['POST'])
@jwt_required(optional=True)
def ai_learning_assistant():
    """Contextual AI Learning Assistant endpoint powered by Gemini & adaptive engine"""
    try:
        from app.services.llm_service import LLMService
        llm_service = LLMService()

        data = request.get_json() or {}
        skill = data.get('skill', 'JavaScript')
        target_role = data.get('target_role', 'Full Stack Developer')
        prompt_type = data.get('prompt_type', 'explain')  # explain, practice, interview, project
        custom_prompt = data.get('custom_prompt')
        stage = data.get('stage', 'Intermediate')

        if custom_prompt and custom_prompt.strip():
            result = llm_service.ask_ai_question(
                skill=skill,
                question=custom_prompt.strip(),
                target_role=target_role,
                stage=stage
            )
            response_text = result.get('answer', '')
            source = result.get('source', 'gemini')
        else:
            prompts_map = {
                'explain': f"Explain core concepts and architectural significance of {skill} for a {target_role} in 2-3 clear paragraphs with key takeaways.",
                'practice': f"Provide 2 hands-on coding or algorithmic practice questions for {skill} suitable for a {target_role} candidate with hints and edge cases.",
                'interview': f"Provide 2 top technical interview questions and model answers asked by tech companies for {skill} ({target_role} path).",
                'project': f"Suggest a high-impact portfolio mini-project using {skill} for a {target_role} resume with core feature list and tech stack."
            }
            query = prompts_map.get(prompt_type, prompts_map['explain'])
            result = llm_service.ask_ai_question(
                skill=skill,
                question=query,
                target_role=target_role,
                stage=stage
            )
            response_text = result.get('answer', '')
            source = result.get('source', 'contextual_engine')

        return jsonify({
            'skill': skill,
            'target_role': target_role,
            'prompt_type': prompt_type,
            'response': response_text,
            'source': source
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
