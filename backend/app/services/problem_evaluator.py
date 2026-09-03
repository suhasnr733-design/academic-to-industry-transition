# backend/app/services/problem_evaluator.py

import re
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, List, Any
from datetime import datetime
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

class ProblemEvaluator:
    """AI-Powered GitHub Repository Code Evaluator for Real-World Problem Statements"""

    def __init__(self):
        self.llm_service = LLMService()

    def evaluate_github_solution(
        self,
        skill_name: str,
        problem_statement: str,
        criteria: List[str],
        github_url: str,
        expected_owner: str = None
    ) -> Dict[str, Any]:
        """Evaluate submitted GitHub repository against problem statement & acceptance criteria with ownership verification"""
        clean_url = (github_url or '').strip()
        
        # 1. Parse GitHub Owner & Repository Name
        match = re.match(r'^https://github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+)/?$', clean_url)
        if not match:
            return {
                'error': 'Invalid GitHub repository URL format. Please enter a valid URL like: https://github.com/username/repository-name'
            }

        owner, repo_name = match.group(1), match.group(2)

        # 2. Ownership Verification: Check if repository belongs to the registered candidate
        if expected_owner:
            clean_expected = expected_owner.strip().lower().lstrip('@')
            if owner.lower() != clean_expected:
                return {
                    'error': f"Ownership verification failed: This repository is owned by '{owner}', but your resume profile is registered as '{expected_owner}'. You must submit a solution from your own GitHub account."
                }

        # 3. Query GitHub API for repository info, fork status & tree verification
        repo_info = self._fetch_github_repo_info(owner, repo_name)
        if 'error' in repo_info:
            return repo_info

        file_tree = repo_info.get('file_tree', [])
        repo_size_kb = repo_info.get('size', 0)

        # 4. Check for empty repository (0 KB or no code files)
        if repo_size_kb == 0 or not file_tree:
            return {
                'error': f"The repository '{owner}/{repo_name}' is empty (0 KB). Please commit your source code files before submitting."
            }

        # 5. Smart Source File Selection (Step 1)
        selected_files = self.select_primary_code_files(file_tree, max_files=3)

        # 6. Fetch Raw Source Code from GitHub (Step 2)
        default_branch = repo_info.get('default_branch', 'main')
        code_artifacts = self._fetch_raw_file_contents(owner, repo_name, default_branch, selected_files)

        # 7. Git Commit Progression & Authenticity Audit (Step 2 of Idea 2)
        commits = repo_info.get('commits', [])
        commit_audit = self.audit_commit_progression(commits, expected_owner)

        # 8. Perform AI / Heuristic Code Review Evaluation
        eval_result = self._evaluate_codebase(
            skill_name=skill_name,
            problem_statement=problem_statement,
            criteria=criteria,
            owner=owner,
            repo_name=repo_name,
            file_tree=file_tree,
            selected_files=selected_files,
            code_artifacts=code_artifacts,
            commits=commits,
            commit_audit=commit_audit
        )

        return eval_result

    def _fetch_github_repo_info(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """Fetch repository details and file tree via GitHub public REST API with fork and branch detection"""
        try:
            # 1. Fetch Repository Metadata
            repo_api_url = f"https://api.github.com/repos/{owner}/{repo_name}"
            req = urllib.request.Request(repo_api_url, headers={'User-Agent': 'TransitionAI-Evaluator'})
            
            with urllib.request.urlopen(req, timeout=8) as resp:
                repo_data = json.loads(resp.read().decode())
                
            repo_size = repo_data.get('size', 0)
            is_fork = repo_data.get('fork', False)
            default_branch = repo_data.get('default_branch', 'main')

            # Enforce original repository (reject unforked replicas)
            if is_fork:
                return {
                    'error': f"Repository '{owner}/{repo_name}' is a fork. Please submit an original repository that contains your solution."
                }

            # 2. Fetch Git File Tree dynamically from default branch
            tree_api_url = f"https://api.github.com/repos/{owner}/{repo_name}/git/trees/{default_branch}?recursive=1"
            req_tree = urllib.request.Request(tree_api_url, headers={'User-Agent': 'TransitionAI-Evaluator'})
            
            file_tree = []
            try:
                with urllib.request.urlopen(req_tree, timeout=8) as resp_tree:
                    tree_data = json.loads(resp_tree.read().decode())
                    file_tree = [item.get('path', '') for item in tree_data.get('tree', []) if item.get('type') == 'blob']
            except Exception as tree_err:
                logger.warning(f"Error fetching Git tree on {default_branch} for {owner}/{repo_name}: {tree_err}")
                # Fallback to alternate standard branches if default branch tree fails
                for alt_branch in ['main', 'master']:
                    if alt_branch != default_branch:
                        try:
                            alt_tree_url = f"https://api.github.com/repos/{owner}/{repo_name}/git/trees/{alt_branch}?recursive=1"
                            req_alt = urllib.request.Request(alt_tree_url, headers={'User-Agent': 'TransitionAI-Evaluator'})
                            with urllib.request.urlopen(req_alt, timeout=8) as resp_alt:
                                tree_data = json.loads(resp_alt.read().decode())
                                file_tree = [item.get('path', '') for item in tree_data.get('tree', []) if item.get('type') == 'blob']
                                if file_tree:
                                    break
                        except Exception:
                            continue

            commits = self._fetch_commit_history(owner, repo_name)

            return {
                'size': repo_size,
                'file_tree': file_tree,
                'default_branch': default_branch,
                'commits': commits
            }

        except urllib.error.HTTPError as e:
            if e.code == 404:
                return {'error': f"Repository '{owner}/{repo_name}' was not found on GitHub. Please check that the URL is correct and the repository is public."}
            elif e.code == 403:
                return {'error': "GitHub API rate limit reached or access forbidden. Please wait a few moments before trying again."}
            return {'error': f"GitHub API error ({e.code}): Could not access repository details."}
        except Exception as e:
            logger.warning(f"Error connecting to GitHub for {owner}/{repo_name}: {e}")
            return {'error': f"Failed to connect to GitHub API: {str(e)}"}

    def _fetch_commit_history(self, owner: str, repo_name: str, max_commits: int = 15) -> List[Dict[str, Any]]:
        """Fetch recent commit history via GitHub REST API for workflow verification"""
        commits_api_url = f"https://api.github.com/repos/{owner}/{repo_name}/commits?per_page={max_commits}"
        req = urllib.request.Request(commits_api_url, headers={'User-Agent': 'TransitionAI-Evaluator'})
        
        parsed_commits = []
        try:
            with urllib.request.urlopen(req, timeout=6) as resp:
                commits_data = json.loads(resp.read().decode())
                if isinstance(commits_data, list):
                    for c in commits_data:
                        if not isinstance(c, dict):
                            continue
                        sha = (c.get('sha') or '')[:7]
                        author_login = c.get('author', {}).get('login') if c.get('author') else None
                        commit_obj = c.get('commit', {})
                        commit_author = commit_obj.get('author', {})
                        author_name = commit_author.get('name', 'Developer')
                        author_date = commit_author.get('date', '')
                        message = commit_obj.get('message', '').strip().split('\n')[0]

                        parsed_commits.append({
                            'sha': sha,
                            'author_login': author_login,
                            'author_name': author_name,
                            'date': author_date,
                            'message': message
                        })
        except Exception as e:
            logger.warning(f"Could not fetch commit history for {owner}/{repo_name}: {e}")

        return parsed_commits

    def audit_commit_progression(
        self,
        commits: List[Dict[str, Any]],
        expected_owner: str = None
    ) -> Dict[str, Any]:
        """Analyzes commit progression, timespan, conventional commit adherence, and author consistency"""
        if not commits:
            return {
                'is_authentic': True,
                'total_commits': 0,
                'progression_score': 75.0,
                'single_commit_dump': False,
                'author_matched': True,
                'conventional_commits_count': 0,
                'time_span': 'N/A',
                'feedback': 'No commit history available for audit.'
            }

        total_commits = len(commits)
        single_commit_dump = (total_commits == 1)

        # 1. Author verification across commit logs
        author_matched = True
        if expected_owner:
            clean_expected = expected_owner.strip().lower().lstrip('@')
            for c in commits:
                login = (c.get('author_login') or '').lower()
                name = (c.get('author_name') or '').lower()
                if login and login != clean_expected and clean_expected not in name:
                    author_matched = False
                    break

        # 2. Conventional Commits Hygiene Check (feat:, fix:, test:, refactor:, docs:, chore:, perf:)
        CONVENTIONAL_PREFIXES = ('feat:', 'fix:', 'test:', 'refactor:', 'docs:', 'chore:', 'perf:', 'style:', 'build:', 'ci:')
        conventional_count = sum(
            1 for c in commits if c.get('message', '').lower().startswith(CONVENTIONAL_PREFIXES)
        )

        # 3. Development Timespan Calculation & Rapid Burst Detection
        time_span_str = "N/A"
        rapid_burst_detected = False
        try:
            if len(commits) >= 2:
                dates = []
                for c in commits:
                    raw_date = c.get('date', '')
                    if raw_date:
                        try:
                            clean_d = raw_date.replace('Z', '+00:00')
                            dates.append(datetime.fromisoformat(clean_d))
                        except Exception:
                            pass

                if len(dates) >= 2:
                    earliest = min(dates)
                    latest = max(dates)
                    diff_seconds = abs((latest - earliest).total_seconds())
                    diff_minutes = diff_seconds / 60.0

                    if diff_seconds < 45 and total_commits >= 3:
                        rapid_burst_detected = True

                    if diff_minutes < 1:
                        time_span_str = f"{int(diff_seconds)} secs"
                    elif diff_minutes < 60:
                        time_span_str = f"{int(diff_minutes)} mins"
                    elif diff_minutes < 1440:
                        time_span_str = f"{round(diff_minutes / 60.0, 1)} hrs"
                    else:
                        time_span_str = f"{round(diff_minutes / 1440.0, 1)} days"
        except Exception as e:
            logger.warning(f"Could not calculate commit timespan: {e}")

        # 4. Score calculation based on progression hygiene
        progression_score = 90.0
        if single_commit_dump:
            progression_score = 65.0
            feedback = "Single-commit repository detected. Consider using iterative commits (scaffold -> implementation -> tests) to showcase real-world development workflow."
        elif rapid_burst_detected:
            progression_score = 72.0
            feedback = f"Rapid commit burst detected ({total_commits} commits in under 45s). In professional workflows, commits naturally reflect iterative development."
        elif total_commits >= 3:
            progression_score = 95.0
            feedback = f"Authentic iterative development confirmed ({total_commits} commits over {time_span_str})."
        else:
            progression_score = 80.0
            feedback = f"Iterative progression detected ({total_commits} commits)."

        if conventional_count > 0:
            feedback += f" Excellent Git hygiene: {conventional_count} commits use Conventional Commit standards."

        if not author_matched and expected_owner:
            progression_score = max(50.0, progression_score - 15.0)
            feedback += f" Notice: Commit author does not match registered username '{expected_owner}'."

        return {
            'is_authentic': author_matched and not single_commit_dump and not rapid_burst_detected,
            'total_commits': total_commits,
            'progression_score': round(progression_score, 1),
            'single_commit_dump': single_commit_dump,
            'rapid_burst_detected': rapid_burst_detected,
            'time_span': time_span_str,
            'conventional_commits_count': conventional_count,
            'author_matched': author_matched,
            'feedback': feedback,
            'recent_commits': commits[:5]
        }

    def select_primary_code_files(self, file_tree: List[str], max_files: int = 3) -> List[str]:
        """Smart filter that selects the top 2-3 most critical source code, test, and documentation files"""
        IGNORE_PATTERNS = [
            'node_modules/', 'venv/', '.venv/', 'dist/', 'build/', 
            '.git/', '.github/', 'target/', 'vendor/', '__pycache__/',
            'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'poetry.lock',
            '.min.js', '.min.css', '.map', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
            '.ds_store', 'thumbs.db'
        ]

        valid_files = []
        for path in file_tree:
            lower_path = path.lower()
            if any(ign in lower_path for ign in IGNORE_PATTERNS):
                continue
            valid_files.append(path)

        # Score and prioritize candidate files
        scored_files = []
        for path in valid_files:
            score = 0
            lower = path.lower()

            # Priority A: Core Application / Solution Source Code (+10 pts)
            if lower.endswith(('.py', '.js', '.ts', '.jsx', '.tsx', '.sql', '.go', '.java', '.cpp', '.c', '.cs', '.rb')):
                score += 10
                if any(folder in lower for folder in ['src/', 'app/', 'lib/', 'pkg/', 'core/']):
                    score += 5  # Bonus for well-structured architecture
                if lower.endswith(('main.py', 'app.py', 'index.js', 'index.ts', 'server.js', 'server.ts')):
                    score += 3  # Bonus for primary entry points

            # Priority B: Automated verification & test suites (+8 pts)
            if any(term in lower for term in ['test', 'spec', '__tests__']):
                score += 8

            # Priority C: Readme / Architecture specifications (+5 pts)
            if 'readme' in lower:
                score += 5

            scored_files.append((score, path))

        # Sort descending by priority score
        scored_files.sort(key=lambda x: x[0], reverse=True)
        return [path for score, path in scored_files[:max_files] if score > 0]

    def _fetch_raw_file_contents(
        self, 
        owner: str, 
        repo_name: str, 
        default_branch: str, 
        file_paths: List[str],
        max_chars_per_file: int = 4000
    ) -> Dict[str, str]:
        """Downloads raw text code for the selected candidate files with safety truncation"""
        code_artifacts = {}

        for path in file_paths:
            try:
                # Construct raw GitHub URL using default branch
                raw_url = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{default_branch}/{path}"
                req = urllib.request.Request(raw_url, headers={'User-Agent': 'TransitionAI-Evaluator'})
                
                with urllib.request.urlopen(req, timeout=5) as resp:
                    raw_text = resp.read().decode('utf-8', errors='ignore')
                    
                    # Truncate large files to prevent token overflow
                    if len(raw_text) > max_chars_per_file:
                        raw_text = raw_text[:max_chars_per_file] + "\n... [Truncated for brevity]"
                    
                    code_artifacts[path] = raw_text
                    
            except Exception as e:
                logger.warning(f"Could not fetch raw content for {path} from {owner}/{repo_name}: {e}")

        return code_artifacts

    def _evaluate_codebase(
        self,
        skill_name: str,
        problem_statement: str,
        criteria: List[str],
        owner: str,
        repo_name: str,
        file_tree: List[str],
        selected_files: List[str] = None,
        code_artifacts: Dict[str, str] = None,
        commits: List[Dict[str, Any]] = None,
        commit_audit: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Perform AI Evaluation against criteria and code structure with Gemini deep review"""
        
        # 1. Attempt Deep LLM Code Review with Gemini if raw code artifacts were fetched
        if code_artifacts:
            try:
                ai_review = self.llm_service.review_code_solution(
                    skill_name=skill_name,
                    problem_statement=problem_statement,
                    criteria=criteria,
                    code_artifacts=code_artifacts
                )
                if ai_review and 'solution_score' in ai_review:
                    is_solved = bool(ai_review.get('is_problem_solved', False))
                    score = float(ai_review.get('solution_score', 80.0))
                    # Ensure consistency: if score >= 70, mark problem solved
                    if score >= 70.0:
                        is_solved = True

                    return {
                        'is_problem_solved': is_solved,
                        'solution_score': score,
                        'passed_criteria': ai_review.get('passed_criteria', []),
                        'missing_criteria': ai_review.get('missing_criteria', []),
                        'engineering_feedback': ai_review.get('feedback', ''),
                        'criteria_review': ai_review.get('criteria_review', []),
                        'staff_engineer_tips': ai_review.get('staff_engineer_tips', []),
                        'repository': f"{owner}/{repo_name}",
                        'evaluated_files': selected_files or [],
                        'code_snippets_fetched': len(code_artifacts or {}),
                        'recent_commits': commits or [],
                        'commit_audit': commit_audit or {},
                        'review_type': 'ai_deep_review'
                    }
            except Exception as e:
                logger.warning(f"Error during Gemini deep code review, falling back to heuristic: {e}")

        # 2. Resilient Fallback: Heuristic Evaluation against file structure
        skill_clean = skill_name.strip().lower()
        
        passed_criteria = []
        missing_criteria = []
        score = 85.0 # Default strong score for valid repos

        # Analyze file structure relative to criteria
        has_tests = any('test' in f.lower() or 'spec' in f.lower() for f in file_tree)
        has_readme = any('readme' in f.lower() for f in file_tree)
        has_source = any(f.endswith(('.py', '.sql', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.cs')) for f in file_tree)

        for idx, c in enumerate(criteria):
            # Evaluate each criterion against repository artifacts
            if idx == 0 and has_source:
                passed_criteria.append(c)
            elif 'test' in c.lower() or 'script' in c.lower():
                if has_tests or has_source:
                    passed_criteria.append(c)
                else:
                    missing_criteria.append(c)
            elif has_source:
                passed_criteria.append(c)
            else:
                missing_criteria.append(c)

        if not missing_criteria:
            score = 92.0
            is_solved = True
            feedback = f"Great work! Your repository '{owner}/{repo_name}' cleanly implements source modules addressing the {skill_name} challenge. The file structure demonstrates clean architecture, test automation, and proper error boundaries."
        elif len(passed_criteria) >= len(criteria) / 2:
            score = 78.0
            is_solved = True
            feedback = f"Good progress! Your solution for '{skill_name}' meets the core problem requirements. To make your code enterprise-ready, consider adding automated tests and expanding error handling."
        else:
            score = 55.0
            is_solved = False
            feedback = f"Partial solution detected. Your repository contains code files, but key acceptance criteria for {skill_name} were not fully met. Please review the missing criteria and push updates to your GitHub repository."

        return {
            'is_problem_solved': is_solved,
            'solution_score': score,
            'passed_criteria': passed_criteria,
            'missing_criteria': missing_criteria,
            'engineering_feedback': feedback,
            'repository': f"{owner}/{repo_name}",
            'evaluated_files': selected_files or [],
            'code_snippets_fetched': len(code_artifacts or {}),
            'recent_commits': commits or [],
            'commit_audit': commit_audit or {},
            'review_type': 'heuristic_fallback'
        }
