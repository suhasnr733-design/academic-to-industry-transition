# backend/app/services/assessment_service.py

import random
from typing import List, Dict, Any

# Comprehensive Question Bank indexed by skill categories
SKILL_QUESTION_BANK: Dict[str, List[Dict[str, Any]]] = {
    'python': [
        {
            'id': 'py_1',
            'skill': 'Python',
            'question': 'Which of the following data structures in Python is immutable?',
            'options': ['List', 'Dictionary', 'Tuple', 'Set'],
            'correct_answer': 'Tuple',
            'explanation': 'Tuples are immutable sequences in Python, meaning their elements cannot be modified after creation.'
        },
        {
            'id': 'py_2',
            'skill': 'Python',
            'question': 'What does the `*args` syntax allow in a Python function definition?',
            'options': [
                'Passing keyword arguments',
                'Passing variable number of positional arguments',
                'Returning multiple values',
                'Creating a generator'
            ],
            'correct_answer': 'Passing variable number of positional arguments',
            'explanation': '`*args` allows a function to accept any number of positional arguments passed as a tuple.'
        },
        {
            'id': 'py_3',
            'skill': 'Python',
            'question': 'What is the purpose of Python’s `__init__` method in a class?',
            'options': [
                'To initialize class-level static variables only',
                'To act as a constructor that initializes a new instance of the class',
                'To delete an object from memory',
                'To import external modules'
            ],
            'correct_answer': 'To act as a constructor that initializes a new instance of the class',
            'explanation': 'The `__init__` method is the constructor in Python called automatically when a new instance of the class is created.'
        },
        {
            'id': 'py_4',
            'skill': 'Python',
            'question': 'What is the difference between `deepcopy` and `copy` in Python?',
            'options': [
                '`copy` recursively copies nested objects, while `deepcopy` does not',
                '`deepcopy` copies nested objects recursively, while shallow `copy` only copies the top-level container',
                '`deepcopy` converts objects to strings',
                'There is no difference'
            ],
            'correct_answer': '`deepcopy` copies nested objects recursively, while shallow `copy` only copies the top-level container',
            'explanation': 'A shallow copy constructs a new compound object and then inserts references into it. A deep copy recursively copies all child objects.'
        }
    ],
    'react': [
        {
            'id': 'react_1',
            'skill': 'React',
            'question': 'Which React hook should you use to perform side effects (such as data fetching or subscriptions)?',
            'options': ['useState', 'useContext', 'useEffect', 'useMemo'],
            'correct_answer': 'useEffect',
            'explanation': '`useEffect` lets you perform side effects in function components, replacing lifecycle methods like componentDidMount and componentDidUpdate.'
        },
        {
            'id': 'react_2',
            'skill': 'React',
            'question': 'Why is giving each element a unique `key` prop important when rendering lists in React?',
            'options': [
                'It improves CSS styling performance',
                'It helps React identify which items have changed, been added, or removed during Reconciliation',
                'It makes the element clickable',
                'It is required by standard HTML'
            ],
            'correct_answer': 'It helps React identify which items have changed, been added, or removed during Reconciliation',
            'explanation': 'Keys help React identify which items have changed, are added, or are removed, enabling efficient DOM diffing and updates.'
        },
        {
            'id': 'react_3',
            'skill': 'React',
            'question': 'What is the purpose of `useCallback` in React?',
            'options': [
                'To trigger an asynchronous API call',
                'To memoize a callback function instance between renders to prevent unnecessary re-renders',
                'To manage global application state',
                'To manipulate the DOM directly'
            ],
            'correct_answer': 'To memoize a callback function instance between renders to prevent unnecessary re-renders',
            'explanation': '`useCallback` caches a function definition between re-renders until one of its dependencies changes.'
        }
    ],
    'sql': [
        {
            'id': 'sql_1',
            'skill': 'SQL',
            'question': 'Which SQL clause is used to filter groups after an aggregation using `GROUP BY`?',
            'options': ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
            'correct_answer': 'HAVING',
            'explanation': '`HAVING` filters grouped rows after aggregation, whereas `WHERE` filters individual rows before grouping.'
        },
        {
            'id': 'sql_2',
            'skill': 'SQL',
            'question': 'What is the key characteristic of an `INNER JOIN` between two tables?',
            'options': [
                'Returns all rows from the left table and matched rows from the right table',
                'Returns only rows that have matching values in both tables',
                'Returns all rows from both tables regardless of match',
                'Deletes duplicate rows from both tables'
            ],
            'correct_answer': 'Returns only rows that have matching values in both tables',
            'explanation': 'An `INNER JOIN` selects records that have matching values in both tables.'
        },
        {
            'id': 'sql_3',
            'skill': 'SQL',
            'question': 'What is an SQL Index primarily used for?',
            'options': [
                'To encrypt confidential data',
                'To speed up data retrieval operations on a database table at the cost of additional write time',
                'To automatically backup table data',
                'To enforce foreign key relationships only'
            ],
            'correct_answer': 'To speed up data retrieval operations on a database table at the cost of additional write time',
            'explanation': 'Indexes are used to quickly locate data without having to search every row in a database table every time a table is accessed.'
        }
    ],
    'docker': [
        {
            'id': 'doc_1',
            'skill': 'Docker',
            'question': 'What is the fundamental difference between a Docker Image and a Docker Container?',
            'options': [
                'An image is a running instance of a container',
                'An image is an immutable template/blueprint, and a container is a running instance of an image',
                'An image contains hardware drivers, while containers contain only software',
                'There is no difference'
            ],
            'correct_answer': 'An image is an immutable template/blueprint, and a container is a running instance of an image',
            'explanation': 'A Docker image is a read-only template with instructions for creating a container. A container is a runnable instance of an image.'
        },
        {
            'id': 'doc_2',
            'skill': 'Docker',
            'question': 'Which Dockerfile instruction specifies the default command executed when running the container?',
            'options': ['FROM', 'COPY', 'CMD', 'WORKDIR'],
            'correct_answer': 'CMD',
            'explanation': '`CMD` sets default commands and/or parameters that will be executed when the container runs.'
        }
    ],
    'machine learning': [
        {
            'id': 'ml_1',
            'skill': 'Machine Learning',
            'question': 'What is the primary indicator of Overfitting in a machine learning model?',
            'options': [
                'High training loss and high validation loss',
                'Very low training error but high generalization/validation error',
                'The model trains too slowly',
                'The model uses linear regression instead of neural networks'
            ],
            'correct_answer': 'Very low training error but high generalization/validation error',
            'explanation': 'Overfitting occurs when a model learns the training data too well, including its noise, failing to generalize on unseen validation data.'
        },
        {
            'id': 'ml_2',
            'skill': 'Machine Learning',
            'question': 'Which metric is best suited for evaluating a classification model on an imbalanced dataset?',
            'options': ['Accuracy', 'F1-Score / PR-AUC', 'Mean Squared Error', 'R-Squared'],
            'correct_answer': 'F1-Score / PR-AUC',
            'explanation': 'For imbalanced datasets, F1-Score (harmonic mean of Precision and Recall) or PR-AUC provides a much more realistic measure than raw accuracy.'
        },
        {
            'id': 'ml_3',
            'skill': 'Machine Learning',
            'question': 'What is the role of the Activation Function in artificial neural networks?',
            'options': [
                'To initialize network weights to zero',
                'To introduce non-linearity, allowing the network to learn complex patterns',
                'To reduce memory consumption during backpropagation',
                'To format the input images'
            ],
            'correct_answer': 'To introduce non-linearity, allowing the network to learn complex patterns',
            'explanation': 'Activation functions introduce non-linear properties to the system, enabling neural networks to learn and approximate complex non-linear functions.'
        }
    ],
    'nlp': [
        {
            'id': 'nlp_1',
            'skill': 'NLP',
            'question': 'What is the purpose of Tokenization in Natural Language Processing?',
            'options': [
                'Translating text between languages',
                'Breaking down text into smaller units such as words, subwords, or characters',
                'Converting words into part-of-speech tags only',
                'Checking text grammar'
            ],
            'correct_answer': 'Breaking down text into smaller units such as words, subwords, or characters',
            'explanation': 'Tokenization is the process of segmenting running text into individual tokens (words, symbols, or subwords).'
        },
        {
            'id': 'nlp_2',
            'skill': 'NLP',
            'question': 'What key mechanism allows Transformer models (like BERT and GPT) to weigh the importance of different words in a sentence regardless of distance?',
            'options': ['Recurrent Gating', 'Self-Attention Mechanism', 'Max Pooling', 'Convolutional Kernels'],
            'correct_answer': 'Self-Attention Mechanism',
            'explanation': 'Self-attention calculates pairwise attention weights between all tokens in a sequence simultaneously, modeling long-range dependencies efficiently.'
        }
    ],
    'git': [
        {
            'id': 'git_1',
            'skill': 'Git',
            'question': 'What is the command to create a new Git branch and immediately switch to it?',
            'options': ['git branch -n <name>', 'git checkout -b <name>', 'git merge <name>', 'git pull -b <name>'],
            'correct_answer': 'git checkout -b <name>',
            'explanation': '`git checkout -b <branch_name>` (or `git switch -c <branch_name>`) creates a new branch and switches your working tree to it.'
        },
        {
            'id': 'git_2',
            'skill': 'Git',
            'question': 'What is the difference between `git fetch` and `git pull`?',
            'options': [
                '`git fetch` updates local code directly, while `git pull` only downloads metadata',
                '`git fetch` downloads remote commits without merging them into your branch, while `git pull` fetches and merges them',
                '`git fetch` deletes untracked files',
                'There is no difference'
            ],
            'correct_answer': '`git fetch` downloads remote commits without merging them into your branch, while `git pull` fetches and merges them',
            'explanation': '`git pull` is shorthand for running `git fetch` followed immediately by `git merge FETCH_HEAD`.'
        }
    ],
    'node.js': [
        {
            'id': 'node_1',
            'skill': 'Node.js',
            'question': 'What architectural pattern allows Node.js to handle thousands of concurrent requests on a single thread?',
            'options': [
                'Multi-threaded worker threads by default',
                'Non-blocking, event-driven I/O with the Event Loop',
                'Synchronous blocking system calls',
                'Hardware GPU acceleration'
            ],
            'correct_answer': 'Non-blocking, event-driven I/O with the Event Loop',
            'explanation': 'Node.js uses an event-driven, non-blocking I/O model powered by libuv event loop to handle concurrent operations efficiently on a single thread.'
        }
    ],
    'java': [
        {
            'id': 'java_1',
            'skill': 'Java',
            'question': 'Which of the following is NOT a pillar of Object-Oriented Programming (OOP) in Java?',
            'options': ['Inheritance', 'Encapsulation', 'Polymorphism', 'Compilation'],
            'correct_answer': 'Compilation',
            'explanation': 'The four main pillars of OOP are Encapsulation, Inheritance, Polymorphism, and Abstraction.'
        },
        {
            'id': 'java_2',
            'skill': 'Java',
            'question': 'What is the difference between `==` and `.equals()` when comparing two String objects in Java?',
            'options': [
                '`==` compares memory addresses (reference equality), while `.equals()` compares string content (value equality)',
                '`==` compares content, while `.equals()` compares addresses',
                'Both perform identical value comparisons in Java',
                '`.equals()` converts strings to lowercase'
            ],
            'correct_answer': '`==` compares memory addresses (reference equality), while `.equals()` compares string content (value equality)',
            'explanation': 'In Java, `==` tests whether both references point to the same memory location, while `.equals()` tests for actual character content equivalence.'
        }
    ],
    'devops': [
        {
            'id': 'devops_1',
            'skill': 'DevOps',
            'question': 'What is the primary benefit of Continuous Integration (CI)?',
            'options': [
                'Automating code building and automated testing on every commit to catch bugs early',
                'Deploying directly to production without testing',
                'Writing documentation automatically',
                'Managing cloud billing'
            ],
            'correct_answer': 'Automating code building and automated testing on every commit to catch bugs early',
            'explanation': 'CI automates building and testing of code every time a team member commits changes to version control.'
        }
    ],
    'aws': [
        {
            'id': 'aws_1',
            'skill': 'AWS',
            'question': 'Which AWS service provides serverless compute execution in response to events?',
            'options': ['AWS EC2', 'AWS Lambda', 'AWS S3', 'AWS RDS'],
            'correct_answer': 'AWS Lambda',
            'explanation': 'AWS Lambda is a serverless compute service that runs code in response to events and automatically manages the underlying compute resources.'
        }
    ],
    'linux': [
        {
            'id': 'linux_1',
            'skill': 'Linux',
            'question': 'Which Linux command is used to inspect running processes and system resource utilization interactively?',
            'options': ['grep', 'top / htop', 'chmod', 'curl'],
            'correct_answer': 'top / htop',
            'explanation': '`top` and `htop` display real-time Linux process information, CPU, and memory utilization.'
        }
    ],
    'problem solving': [
        {
            'id': 'core_1',
            'skill': 'Data Structures & Algorithms',
            'question': 'What is the average time complexity of searching an element in a Hash Map / Hash Table?',
            'options': ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
            'correct_answer': 'O(1)',
            'explanation': 'Hash maps provide constant O(1) average time complexity for lookups, insertions, and deletions due to direct hash indexing.'
        },
        {
            'id': 'core_2',
            'skill': 'System Design',
            'question': 'What technique is commonly used to distribute incoming network traffic across multiple backend servers to prevent overload?',
            'options': ['Load Balancing', 'Data Compression', 'Database Normalization', 'Thread Locking'],
            'correct_answer': 'Load Balancing',
            'explanation': 'Load balancers distribute incoming client requests across multiple backend compute instances to maximize throughput and reliability.'
        }
    ]
}

# Lookup map from question ID to question metadata
ALL_QUESTIONS_MAP: Dict[str, Dict[str, Any]] = {}
for skill_category, q_list in SKILL_QUESTION_BANK.items():
    for q in q_list:
        ALL_QUESTIONS_MAP[q['id']] = q

class AssessmentService:
    """Service to generate resume-tailored skill assessments and evaluate submissions."""

    @staticmethod
    def normalize_skill(skill_str: str) -> str:
        """Normalize skill string for matching against question bank keys."""
        s = str(skill_str).lower().strip()
        if 'python' in s:
            return 'python'
        if 'react' in s or 'javascript' in s or 'js' in s:
            return 'react'
        if 'sql' in s or 'database' in s or 'mysql' in s or 'postgres' in s or 'oracle' in s:
            return 'sql'
        if 'docker' in s or 'container' in s:
            return 'docker'
        if 'nlp' in s or 'natural language' in s:
            return 'nlp'
        if 'machine learning' in s or 'scikit' in s or 'ml' in s or 'deep learning' in s or 'ai' in s:
            return 'machine learning'
        if 'git' in s or 'github' in s:
            return 'git'
        if 'node' in s or 'express' in s:
            return 'node.js'
        if 'java' in s and 'javascript' not in s:
            return 'java'
        if 'devops' in s or 'ci/cd' in s:
            return 'devops'
        if 'aws' in s or 'gcp' in s or 'cloud' in s:
            return 'aws'
        if 'linux' in s or 'unix' in s:
            return 'linux'
        return 'problem solving'

    @classmethod
    def generate_assessment(cls, user_skills: List[str], total_questions: int = 6) -> Dict[str, Any]:
        """
        Generate a dynamic set of questions based on the extracted skills from the user's resume.
        """
        matched_categories = set()
        for skill in user_skills:
            norm = cls.normalize_skill(skill)
            if norm in SKILL_QUESTION_BANK:
                matched_categories.add(norm)

        selected_questions: List[Dict[str, Any]] = []
        tested_skills: List[str] = []

        # 1. Pick questions from matched resume skills
        for cat in list(matched_categories):
            available = SKILL_QUESTION_BANK.get(cat, [])
            if available:
                sampled = random.sample(available, min(len(available), 2))
                for q in sampled:
                    if q not in selected_questions:
                        selected_questions.append(q)
                        if q['skill'] not in tested_skills:
                            tested_skills.append(q['skill'])

        # 2. If not enough questions or no skills extracted, backfill from core problem solving & common skills
        fallback_pool = []
        for cat, q_list in SKILL_QUESTION_BANK.items():
            for q in q_list:
                if q not in selected_questions:
                    fallback_pool.append(q)

        random.shuffle(fallback_pool)
        while len(selected_questions) < total_questions and fallback_pool:
            q = fallback_pool.pop()
            selected_questions.append(q)
            if q['skill'] not in tested_skills:
                tested_skills.append(q['skill'])

        # Limit to requested total
        selected_questions = selected_questions[:total_questions]
        random.shuffle(selected_questions)

        # Mask correct answers before sending to client
        client_questions = []
        for idx, q in enumerate(selected_questions):
            # Shuffle options for variety
            options = list(q['options'])
            random.shuffle(options)
            client_questions.append({
                'id': q['id'],
                'index': idx + 1,
                'skill': q['skill'],
                'question': q['question'],
                'options': options
            })

        return {
            'session_id': f"assess_{random.randint(10000, 99999)}",
            'total_questions': len(client_questions),
            'tested_skills': tested_skills,
            'source': 'resume' if matched_categories else 'foundational',
            'questions': client_questions
        }

    @classmethod
    def evaluate_submission(cls, submitted_answers: Dict[str, str], time_taken_seconds: int = 0) -> Dict[str, Any]:
        """
        Evaluate user answers, compute overall percentage & skill breakdown.
        """
        total = len(submitted_answers) if submitted_answers else 0
        if total == 0:
            return {
                'score': 0,
                'total_questions': 0,
                'correct_answers': 0,
                'percentage': 0,
                'skill_breakdown': {},
                'review': []
            }

        correct_count = 0
        skill_stats: Dict[str, Dict[str, int]] = {}
        review_list = []

        for q_id, user_choice in submitted_answers.items():
            q_info = ALL_QUESTIONS_MAP.get(q_id)
            if not q_info:
                # Fallback if question was not in static map
                continue

            skill = q_info.get('skill', 'General')
            if skill not in skill_stats:
                skill_stats[skill] = {'total': 0, 'correct': 0}
            skill_stats[skill]['total'] += 1

            is_correct = (user_choice == q_info.get('correct_answer'))
            if is_correct:
                correct_count += 1
                skill_stats[skill]['correct'] += 1

            review_list.append({
                'id': q_id,
                'skill': skill,
                'question': q_info.get('question'),
                'user_answer': user_choice,
                'correct_answer': q_info.get('correct_answer'),
                'is_correct': is_correct,
                'explanation': q_info.get('explanation', '')
            })

        total_evaluated = len(review_list) or 1
        percentage = round((correct_count / total_evaluated) * 100, 1)

        # Compute per-skill proficiency
        skill_breakdown = {}
        for skill_name, stats in skill_stats.items():
            skill_breakdown[skill_name] = {
                'total': stats['total'],
                'correct': stats['correct'],
                'percentage': round((stats['correct'] / stats['total']) * 100, 1) if stats['total'] > 0 else 0
            }

        # Determine competency level
        if percentage >= 85:
            competency_level = 'Industry Ready (Advanced)'
            badge_color = 'emerald'
        elif percentage >= 65:
            competency_level = 'Competent (Intermediate)'
            badge_color = 'blue'
        elif percentage >= 40:
            competency_level = 'Developing (Foundational)'
            badge_color = 'amber'
        else:
            competency_level = 'Needs Improvement'
            badge_color = 'rose'

        return {
            'score': percentage,
            'percentage': percentage,
            'total_questions': total_evaluated,
            'correct_answers': correct_count,
            'time_taken': time_taken_seconds,
            'competency_level': competency_level,
            'badge_color': badge_color,
            'skill_breakdown': skill_breakdown,
            'review': review_list
        }
