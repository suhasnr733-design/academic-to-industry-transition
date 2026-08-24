# backend/app/services/assessment_service.py

import random
from typing import List, Dict, Any

# Granular Question Bank per individual skill with progressive difficulty levels ('easy', 'medium', 'hard')
SKILL_QUESTION_BANK: Dict[str, List[Dict[str, Any]]] = {
    'python': [
        {
            'id': 'py_e1',
            'skill': 'Python',
            'difficulty': 'easy',
            'question': 'Which of the following data structures in Python is immutable?',
            'options': ['List', 'Dictionary', 'Tuple', 'Set'],
            'correct_answer': 'Tuple',
            'explanation': 'Tuples are immutable sequences in Python; their elements cannot be changed after creation.'
        },
        {
            'id': 'py_e2',
            'skill': 'Python',
            'difficulty': 'easy',
            'question': 'What is the default return value of a Python function without an explicit `return` statement?',
            'options': ['0', 'None', 'False', 'Undefined'],
            'correct_answer': 'None',
            'explanation': 'In Python, functions without a return statement implicitly return `None`.'
        },
        {
            'id': 'py_m1',
            'skill': 'Python',
            'difficulty': 'medium',
            'question': 'What is the difference between `deepcopy` and `copy` in Python’s `copy` module?',
            'options': [
                '`copy` creates a string representation, while `deepcopy` creates binary data',
                '`deepcopy` recursively duplicates nested objects, while shallow `copy` only copies references to child objects',
                '`copy` is thread-safe, while `deepcopy` is not',
                'There is no difference'
            ],
            'correct_answer': '`deepcopy` recursively duplicates nested objects, while shallow `copy` only copies references to child objects',
            'explanation': 'Shallow copy copies references to nested objects; deepcopy recursively copies all nested objects.'
        },
        {
            'id': 'py_h1',
            'skill': 'Python',
            'difficulty': 'hard',
            'question': 'How does Python’s Global Interpreter Lock (GIL) affect multi-threaded CPU-bound programs in CPython?',
            'options': [
                'It accelerates thread execution by auto-vectorizing loops',
                'It allows only one thread to execute Python bytecode at a time, limiting CPU-bound speedup across multiple cores',
                'It prevents memory leaks by disabling garbage collection',
                'It forces all threads to run asynchronously using async/await'
            ],
            'correct_answer': 'It allows only one thread to execute Python bytecode at a time, limiting CPU-bound speedup across multiple cores',
            'explanation': 'The GIL prevents multiple native threads from executing Python bytecodes concurrently in CPython.'
        }
    ],

    'javascript': [
        {
            'id': 'js_e1',
            'skill': 'JavaScript',
            'difficulty': 'easy',
            'question': 'Which keyword is used to declare a block-scoped reassignable variable in modern JavaScript (ES6+)?',
            'options': ['var', 'let', 'const', 'global'],
            'correct_answer': 'let',
            'explanation': '`let` declares block-scoped variables that can be reassigned.'
        },
        {
            'id': 'js_e2',
            'skill': 'JavaScript',
            'difficulty': 'easy',
            'question': 'What is the result of `typeof NaN` in JavaScript?',
            'options': ["'number'", "'nan'", "'undefined'", "'object'"],
            'correct_answer': "'number'",
            'explanation': 'In JavaScript, `NaN` (Not-a-Number) is technically a numeric data type value.'
        },
        {
            'id': 'js_m1',
            'skill': 'JavaScript',
            'difficulty': 'medium',
            'question': 'What is a Closure in JavaScript?',
            'options': [
                'A function that terminates the execution loop',
                'A function bundled together with references to its lexical environment, allowing access to outer scope variables even after the outer function has closed',
                'A method to close browser tabs programmatically',
                'An encryption protocol for JSON'
            ],
            'correct_answer': 'A function bundled together with references to its lexical environment, allowing access to outer scope variables even after the outer function has closed',
            'explanation': 'Closures give inner functions access to an outer enclosing function scope across asynchronous or subsequent invocations.'
        },
        {
            'id': 'js_h1',
            'skill': 'JavaScript',
            'difficulty': 'hard',
            'question': 'In the JavaScript event loop, what is the exact execution priority between Microtasks (Promises) and Macrotasks (setTimeout)?',
            'options': [
                'Macrotasks have higher priority than microtasks',
                'After executing one macrotask, the entire microtask queue is drained to completion before the next macrotask or render step runs',
                'Microtasks only execute when memory is full',
                'Promises run on a separate CPU thread'
            ],
            'correct_answer': 'After executing one macrotask, the entire microtask queue is drained to completion before the next macrotask or render step runs',
            'explanation': 'Microtasks (Promises, queueMicrotask) take strict priority and drain completely after every macrotask.'
        }
    ],

    'react': [
        {
            'id': 'react_e1',
            'skill': 'React',
            'difficulty': 'easy',
            'question': 'Which React hook is used to manage local state in a functional component?',
            'options': ['useContext', 'useState', 'useEffect', 'useReducer'],
            'correct_answer': 'useState',
            'explanation': '`useState` allows functional components to declare and update reactive state variables.'
        },
        {
            'id': 'react_m1',
            'skill': 'React',
            'difficulty': 'medium',
            'question': 'Why is assigning a stable, unique `key` prop essential when rendering dynamic lists in React?',
            'options': [
                'It improves CSS selector speed',
                'It enables React’s Reconciliation algorithm to accurately identify which items have changed, been added, or removed without re-rendering the entire list',
                'It sorts the list automatically in ascending order',
                'It is required by standard HTML5 validation'
            ],
            'correct_answer': 'It enables React’s Reconciliation algorithm to accurately identify which items have changed, been added, or removed without re-rendering the entire list',
            'explanation': 'Keys provide stable identities across renders for efficient Virtual DOM diffing.'
        },
        {
            'id': 'react_h1',
            'skill': 'React',
            'difficulty': 'hard',
            'question': 'What causes the "Stale Closure" problem in React hooks like `useEffect` or `useCallback`?',
            'options': [
                'Browser garbage collection deleting variables',
                'A callback capturing variables from a previous render because dependencies were omitted from the dependency array',
                'Importing components dynamically using React.lazy',
                'Rendering multiple root DOM elements'
            ],
            'correct_answer': 'A callback capturing variables from a previous render because dependencies were omitted from the dependency array',
            'explanation': 'Stale closures capture values from the render in which they were created if the dependency array is not kept up-to-date.'
        }
    ],

    'java': [
        {
            'id': 'java_e1',
            'skill': 'Java',
            'difficulty': 'easy',
            'question': 'Which keyword is used in Java to inherit a class?',
            'options': ['implements', 'extends', 'inherits', 'super'],
            'correct_answer': 'extends',
            'explanation': '`extends` is the Java keyword used to declare inheritance from a superclass.'
        },
        {
            'id': 'java_m1',
            'skill': 'Java',
            'difficulty': 'medium',
            'question': 'What is the difference between `==` and `.equals()` when comparing two String objects in Java?',
            'options': [
                '`==` compares memory references; `.equals()` compares character sequence values',
                '`.equals()` is only for numbers',
                '`==` compares String lengths',
                'They perform identical operations'
            ],
            'correct_answer': '`==` compares memory references; `.equals()` compares character sequence values',
            'explanation': '`==` checks if both references point to the exact same object in memory, whereas `.equals()` verifies content equality.'
        },
        {
            'id': 'java_h1',
            'skill': 'Java',
            'difficulty': 'hard',
            'question': 'In the JVM memory model, how does Java Heap memory differ fundamentally from Java Stack memory?',
            'options': [
                'Heap stores thread call frames; Stack stores global objects',
                'Stack stores thread-specific call frames, local primitives, and reference pointers; Heap stores all object instances and is shared across all threads',
                'Heap is allocated per-thread; Stack is global',
                'Stack memory is garbage collected by the JVM GC'
            ],
            'correct_answer': 'Stack stores thread-specific call frames, local primitives, and reference pointers; Heap stores all object instances and is shared across all threads',
            'explanation': 'Stack frames are allocated per thread and freed on method exit; Heap holds objects and is managed by Garbage Collection.'
        }
    ],

    'mongodb': [
        {
            'id': 'mongo_e1',
            'skill': 'MongoDB',
            'difficulty': 'easy',
            'question': 'In MongoDB, what is the basic unit of data and what format is used to store it physically?',
            'options': [
                'Rows stored as CSV',
                'Documents stored in BSON (Binary JSON) format',
                'Tables stored as XML',
                'Tuples stored in binary trees'
            ],
            'correct_answer': 'Documents stored in BSON (Binary JSON) format',
            'explanation': 'MongoDB is a document database that stores records as BSON documents inside collections.'
        },
        {
            'id': 'mongo_m1',
            'skill': 'MongoDB',
            'difficulty': 'medium',
            'question': 'Which MongoDB command/pipeline stage is used to perform multi-stage data aggregation and grouping similar to SQL GROUP BY?',
            'options': [
                'db.collection.aggregate([ { $group: { ... } } ])',
                'db.collection.filter([ { $combine: { ... } } ])',
                'db.collection.join([ { $group: { ... } } ])',
                'db.collection.find().groupBy()'
            ],
            'correct_answer': 'db.collection.aggregate([ { $group: { ... } } ])',
            'explanation': 'MongoDB aggregation pipelines process documents through stages such as `$match`, `$group`, `$project`, and `$sort`.'
        },
        {
            'id': 'mongo_h1',
            'skill': 'MongoDB',
            'difficulty': 'hard',
            'question': 'In a MongoDB Replica Set with Write Concern `w: "majority"`, what guarantee is provided to the client application?',
            'options': [
                'The write is committed only to the Primary node’s in-memory cache',
                'The write has been acknowledged and written to the journal of a majority of voting replica set members, preventing data rollback if the primary fails',
                'The write is broadcast to all secondary nodes without waiting for acknowledgement',
                'The write automatically shards the collection'
            ],
            'correct_answer': 'The write has been acknowledged and written to the journal of a majority of voting replica set members, preventing data rollback if the primary fails',
            'explanation': '`w: "majority"` ensures durability by requiring acknowledgment from a majority of nodes before confirming the write.'
        }
    ],

    'node.js': [
        {
            'id': 'node_e1',
            'skill': 'Node.js',
            'difficulty': 'easy',
            'question': 'What is Node.js fundamentally?',
            'options': [
                'A frontend JavaScript library',
                'An open-source, cross-platform JavaScript runtime environment built on Chrome’s V8 engine',
                'A relational database management tool',
                'A web browser'
            ],
            'correct_answer': 'An open-source, cross-platform JavaScript runtime environment built on Chrome’s V8 engine',
            'explanation': 'Node.js enables developers to execute JavaScript on servers outside the browser.'
        },
        {
            'id': 'node_m1',
            'skill': 'Node.js',
            'difficulty': 'medium',
            'question': 'How does Node.js handle non-blocking asynchronous I/O despite being single-threaded for JS execution?',
            'options': [
                'By compiling JavaScript into multi-threaded assembly',
                'Using an Event Loop backed by the libuv C library and background worker thread pools for blocking operations',
                'By spawning an operating system process for each incoming request',
                'By disabling garbage collection'
            ],
            'correct_answer': 'Using an Event Loop backed by the libuv C library and background worker thread pools for blocking operations',
            'explanation': 'libuv provides an event loop and thread pool that offloads file I/O, network tasks, and cryptography.'
        },
        {
            'id': 'node_h1',
            'skill': 'Node.js',
            'difficulty': 'hard',
            'question': 'In Node.js Streams architecture, what is "Backpressure" and how does the `.pipe()` method handle it?',
            'options': [
                'An error that terminates the server process',
                'A condition where data production exceeds consumption speed; `.pipe()` automatically pauses the readable stream until the writable stream drains',
                'A compression technique for HTTP requests',
                'A memory leak in the V8 heap'
            ],
            'correct_answer': 'A condition where data production exceeds consumption speed; `.pipe()` automatically pauses the readable stream until the writable stream drains',
            'explanation': 'Backpressure prevents memory exhaustion by throttling data production when the destination buffer is full.'
        }
    ],

    'postman': [
        {
            'id': 'postman_e1',
            'skill': 'Postman',
            'difficulty': 'easy',
            'question': 'What is the primary use case of Postman in software development?',
            'options': [
                'To design and test REST/GraphQL APIs and automate HTTP requests',
                'To edit video files',
                'To compile C++ programs',
                'To host physical databases'
            ],
            'correct_answer': 'To design and test REST/GraphQL APIs and automate HTTP requests',
            'explanation': 'Postman is an API platform used for building, testing, documenting, and automating APIs.'
        },
        {
            'id': 'postman_m1',
            'skill': 'Postman',
            'difficulty': 'medium',
            'question': 'In Postman, how can you extract a JWT token from a login response and save it to an Environment Variable for subsequent requests?',
            'options': [
                'Manually copy and paste after each run',
                'In the "Tests" tab, use `pm.environment.set("token", pm.response.json().token);`',
                'Configure a CSS selector in the headers',
                'Postman does not support variables'
            ],
            'correct_answer': 'In the "Tests" tab, use `pm.environment.set("token", pm.response.json().token);`',
            'explanation': 'Postman Test scripts execute after a response is received, allowing automated extraction and persistence of tokens.'
        },
        {
            'id': 'postman_h1',
            'skill': 'Postman',
            'difficulty': 'hard',
            'question': 'How can you run automated Postman Collection test suites directly in CI/CD pipelines (e.g. GitHub Actions, Jenkins)?',
            'options': [
                'By taking screenshots of the Postman desktop app',
                'Using the Newman CLI tool (`newman run collection.json -e env.json`)',
                'By opening Postman in headful mode on the server',
                'Postman collections cannot run in CI/CD'
            ],
            'correct_answer': 'Using the Newman CLI tool (`newman run collection.json -e env.json`)',
            'explanation': 'Newman is the official command-line collection runner for Postman that integrates directly with CI/CD systems.'
        }
    ],

    'sql': [
        {
            'id': 'sql_e1',
            'skill': 'SQL',
            'difficulty': 'easy',
            'question': 'Which SQL statement is used to retrieve data from a database table?',
            'options': ['GET', 'FETCH', 'SELECT', 'EXTRACT'],
            'correct_answer': 'SELECT',
            'explanation': '`SELECT` is the standard query command used to read records from database tables.'
        },
        {
            'id': 'sql_m1',
            'skill': 'SQL',
            'difficulty': 'medium',
            'question': 'What is the difference between `WHERE` and `HAVING` clauses in SQL?',
            'options': [
                '`WHERE` is for MySQL and `HAVING` is for PostgreSQL',
                '`WHERE` filters rows before aggregation; `HAVING` filters grouped rows after `GROUP BY` aggregation',
                '`WHERE` only works on primary keys',
                'There is no difference'
            ],
            'correct_answer': '`WHERE` filters rows before aggregation; `HAVING` filters grouped rows after `GROUP BY` aggregation',
            'explanation': '`WHERE` operates on individual rows prior to grouping, while `HAVING` filters group summaries.'
        },
        {
            'id': 'sql_h1',
            'skill': 'SQL',
            'difficulty': 'hard',
            'question': 'In database transactions, what does the "Isolation" property in ACID guarantee at the "Serializable" level?',
            'options': [
                'Transactions run without locks on memory',
                'Concurrent transactions yield results identical to executing sequentially one after another, eliminating dirty reads, non-repeatable reads, and phantom reads',
                'Transactions are stored in plain text files',
                'Transactions cannot be rolled back'
            ],
            'correct_answer': 'Concurrent transactions yield results identical to executing sequentially one after another, eliminating dirty reads, non-repeatable reads, and phantom reads',
            'explanation': 'Serializable is the highest isolation level, completely isolating concurrent transaction effects.'
        }
    ],

    'mysql': [
        {
            'id': 'mysql_e1',
            'skill': 'MySQL',
            'difficulty': 'easy',
            'question': 'What is the default transactional storage engine in modern MySQL versions (5.5+)?',
            'options': ['MyISAM', 'InnoDB', 'Memory', 'CSV'],
            'correct_answer': 'InnoDB',
            'explanation': 'InnoDB is MySQL’s default ACID-compliant storage engine featuring row-level locking and foreign key support.'
        },
        {
            'id': 'mysql_m1',
            'skill': 'MySQL',
            'difficulty': 'medium',
            'question': 'In MySQL query optimization, what does the `EXPLAIN` statement reveal about a query execution plan?',
            'options': [
                'It rewrites the SQL syntax into JavaScript',
                'It shows table scan types (ALL, ref, range, index), possible indexes considered, keys used, and rows examined',
                'It calculates the server CPU temperature',
                'It deletes slow queries automatically'
            ],
            'correct_answer': 'It shows table scan types (ALL, ref, range, index), possible indexes considered, keys used, and rows examined',
            'explanation': '`EXPLAIN` provides detailed insights into how MySQL’s optimizer plans to execute a statement.'
        },
        {
            'id': 'mysql_h1',
            'skill': 'MySQL',
            'difficulty': 'hard',
            'question': 'How does MySQL InnoDB implement Multi-Version Concurrency Control (MVCC) for non-locking consistent reads?',
            'options': [
                'By locking the entire database table on every read',
                'Using undo logs and hidden transaction ID (`DB_TRX_ID`) / roll pointer (`DB_ROLL_PTR`) columns to construct a point-in-time snapshot of data',
                'By storing separate database copies for each user',
                'By running all queries on a background thread'
            ],
            'correct_answer': 'Using undo logs and hidden transaction ID (`DB_TRX_ID`) / roll pointer (`DB_ROLL_PTR`) columns to construct a point-in-time snapshot of data',
            'explanation': 'InnoDB uses undo log history to provide transaction-consistent read snapshots without table-level read locks.'
        }
    ],

    'nlp': [
        {
            'id': 'nlp_e1',
            'skill': 'NLP',
            'difficulty': 'easy',
            'question': 'In Natural Language Processing (NLP), what is Tokenization?',
            'options': [
                'Encrypting user passwords',
                'The process of splitting raw text into individual words, subwords, or characters called tokens',
                'Translating text into binary machine code',
                'Removing punctuation from documents'
            ],
            'correct_answer': 'The process of splitting raw text into individual words, subwords, or characters called tokens',
            'explanation': 'Tokenization segments continuous text streams into discrete semantic units for model ingestion.'
        },
        {
            'id': 'nlp_m1',
            'skill': 'NLP',
            'difficulty': 'medium',
            'question': 'What is the purpose of Word Embeddings (e.g. Word2Vec, GloVe) in NLP compared to simple One-Hot Encoding?',
            'options': [
                'One-hot encoding is faster for deep learning',
                'Word embeddings map words to dense, low-dimensional continuous vectors capturing semantic and syntactic relationships',
                'Embeddings eliminate the need for training data',
                'Embeddings only work on numbers'
            ],
            'correct_answer': 'Word embeddings map words to dense, low-dimensional continuous vectors capturing semantic and syntactic relationships',
            'explanation': 'Embeddings project words into continuous vector spaces where semantically related words have high cosine similarity.'
        },
        {
            'id': 'nlp_h1',
            'skill': 'NLP',
            'difficulty': 'hard',
            'question': 'In modern Transformer models (e.g. BERT, RoBERTa), what is the primary role of the Self-Attention mechanism?',
            'options': [
                'To process words strictly from left to right using recurrent feedback loops',
                'To compute dynamic pairwise attention weights across all tokens in parallel, capturing long-range contextual relationships regardless of distance',
                'To compress vocabulary size to 100 words',
                'To generate synthetic audio files'
            ],
            'correct_answer': 'To compute dynamic pairwise attention weights across all tokens in parallel, capturing long-range contextual relationships regardless of distance',
            'explanation': 'Self-attention calculates token interactions across full sequence contexts simultaneously in O(1) path length.'
        }
    ],

    'git': [
        {
            'id': 'git_e1',
            'skill': 'Git',
            'difficulty': 'easy',
            'question': 'Which Git command stages all modified and newly created files in the current repository?',
            'options': ['git stage all', 'git add .', 'git commit -a', 'git save'],
            'correct_answer': 'git add .',
            'explanation': '`git add .` stages all changes in the current directory and subdirectories for the next commit.'
        },
        {
            'id': 'git_m1',
            'skill': 'Git',
            'difficulty': 'medium',
            'question': 'What is the difference between `git merge` and `git rebase`?',
            'options': [
                '`merge` deletes old commits; `rebase` preserves them',
                '`merge` combines branch histories with a dedicated merge commit; `rebase` creates a linear history by replaying commits on top of the target branch',
                '`rebase` can only be run on remote branches',
                'They perform identical operations'
            ],
            'correct_answer': '`merge` combines branch histories with a dedicated merge commit; `rebase` creates a linear history by replaying commits on top of the target branch',
            'explanation': 'Rebase produces a clean linear commit graph by re-applying commits, while merge preserves exact branch topology.'
        },
        {
            'id': 'git_h1',
            'skill': 'Git',
            'difficulty': 'hard',
            'question': 'If you accidentally ran `git reset --hard HEAD~3` and lost unpushed commits, how can you recover the orphaned commit hashes?',
            'options': [
                'Use `git reflog` to find the previous HEAD commits and reset to that hash',
                'Use `git fsck --clean` to delete the repo',
                'Commits are permanently deleted and impossible to recover',
                'Reinstall Git'
            ],
            'correct_answer': 'Use `git reflog` to find the previous HEAD commits and reset to that hash',
            'explanation': '`git reflog` logs every movement of HEAD, enabling recovery of orphaned or overwritten commits.'
        }
    ],

    'vs code': [
        {
            'id': 'vsc_e1',
            'skill': 'VS Code',
            'difficulty': 'easy',
            'question': 'In Visual Studio Code, which configuration file defines workspace debugging settings and launch profiles?',
            'options': ['settings.json', 'launch.json', 'tasks.json', 'extensions.json'],
            'correct_answer': 'launch.json',
            'explanation': '`.vscode/launch.json` stores debugging configurations, run targets, and environment variables.'
        },
        {
            'id': 'vsc_m1',
            'skill': 'VS Code',
            'difficulty': 'medium',
            'question': 'What is the default global keyboard shortcut to open the Command Palette in VS Code on Windows/Linux?',
            'options': ['Ctrl + Shift + P (or F1)', 'Ctrl + Alt + Delete', 'Ctrl + F4', 'Alt + Tab'],
            'correct_answer': 'Ctrl + Shift + P (or F1)',
            'explanation': '`Ctrl + Shift + P` opens the Command Palette to execute editor commands, install extensions, and configure settings.'
        },
        {
            'id': 'vsc_h1',
            'skill': 'VS Code',
            'difficulty': 'hard',
            'question': 'What architecture protocol does VS Code use to provide language features (autocompletion, go to definition, refactoring) across dozens of programming languages?',
            'options': [
                'Language Server Protocol (LSP)',
                'Direct JVM Bytecode Inspection',
                'REST API polling',
                'Custom binary sockets only'
            ],
            'correct_answer': 'Language Server Protocol (LSP)',
            'explanation': 'LSP defines a standardized JSON-RPC protocol between developer tools and language smartness servers.'
        }
    ],

    'docker': [
        {
            'id': 'doc_e1',
            'skill': 'Docker',
            'difficulty': 'easy',
            'question': 'Which Docker command lists all currently running containers?',
            'options': ['docker ps', 'docker list', 'docker status', 'docker show'],
            'correct_answer': 'docker ps',
            'explanation': '`docker ps` outputs active running containers.'
        },
        {
            'id': 'doc_m1',
            'skill': 'Docker',
            'difficulty': 'medium',
            'question': 'What is the benefit of Docker Multi-Stage builds in production?',
            'options': [
                'Runs multiple containers inside one image',
                'Separates the build environment from the minimal runtime image, reducing production image size and security surface',
                'Automatically deploys containers to Kubernetes',
                'Encrypts the host kernel'
            ],
            'correct_answer': 'Separates the build environment from the minimal runtime image, reducing production image size and security surface',
            'explanation': 'Multi-stage builds allow copying only compiled artifacts into a lightweight production container.'
        },
        {
            'id': 'doc_h1',
            'skill': 'Docker',
            'difficulty': 'hard',
            'question': 'Which Linux kernel mechanisms enable Docker container resource metering and process isolation?',
            'options': [
                'SELinux only',
                'Control Groups (cgroups) for resource limits; Namespaces for process and network isolation',
                'Hypervisor VT-x',
                'Systemd journal'
            ],
            'correct_answer': 'Control Groups (cgroups) for resource limits; Namespaces for process and network isolation',
            'explanation': 'Namespaces provide isolated views of resources; cgroups meter and enforce CPU/RAM resource quotas.'
        }
    ],

    'aws': [
        {
            'id': 'aws_e1',
            'skill': 'AWS',
            'difficulty': 'easy',
            'question': 'Which AWS service provides on-demand virtual compute servers?',
            'options': ['Amazon EC2', 'Amazon S3', 'AWS Lambda', 'Amazon RDS'],
            'correct_answer': 'Amazon EC2',
            'explanation': 'Amazon Elastic Compute Cloud (EC2) provides resizable compute capacity in the cloud.'
        },
        {
            'id': 'aws_m1',
            'skill': 'AWS',
            'difficulty': 'medium',
            'question': 'What is the primary characteristic of Serverless compute like AWS Lambda?',
            'options': [
                'Servers do not exist in the cloud',
                'Executes event-driven code without managing servers, scaling automatically with pay-per-execution billing',
                'Lambda runs for infinite continuous days',
                'Requires dedicated EC2 instances'
            ],
            'correct_answer': 'Executes event-driven code without managing servers, scaling automatically with pay-per-execution billing',
            'explanation': 'AWS Lambda runs code on high-availability infrastructure and performs all administration of compute resources.'
        },
        {
            'id': 'aws_h1',
            'skill': 'AWS',
            'difficulty': 'hard',
            'question': 'In AWS Virtual Private Cloud (VPC), how do Security Groups differ from Network Access Control Lists (NACLs)?',
            'options': [
                'Security Groups are stateless at subnet level; NACLs are stateful at instance level',
                'Security Groups operate at the instance/ENI level and are stateful; NACLs operate at the subnet level and are stateless',
                'They are identical in functionality',
                'NACLs only filter outbound traffic'
            ],
            'correct_answer': 'Security Groups operate at the instance/ENI level and are stateful; NACLs operate at the subnet level and are stateless',
            'explanation': 'Security groups track connection state at the ENI level, whereas NACLs evaluate ingress and egress rules statelessly at the subnet boundary.'
        }
    ]
}

# Lookup map from question ID to question metadata
ALL_QUESTIONS_MAP: Dict[str, Dict[str, Any]] = {}
for skill_key, q_list in SKILL_QUESTION_BANK.items():
    for q in q_list:
        ALL_QUESTIONS_MAP[q['id']] = q


class AssessmentService:
    """Service to generate resume-tailored skill assessments with progressive difficulty (Easy -> Medium -> Hard)."""

    @staticmethod
    def normalize_skill(skill_str: str) -> str:
        """Normalize skill string to its exact canonical question bank key."""
        s = str(skill_str).lower().strip()
        
        # Exact individual tools & databases
        if 'mongodb' in s or 'mongo' in s:
            return 'mongodb'
        if 'mysql' in s:
            return 'mysql'
        if 'postman' in s:
            return 'postman'
        if 'vs code' in s or 'vscode' in s or 'visual studio code' in s:
            return 'vs code'
        if 'node' in s or 'express' in s:
            return 'node.js'
        if 'react' in s:
            return 'react'
        if 'javascript' in s or s == 'js':
            return 'javascript'
        if 'nlp' in s or 'natural language' in s:
            return 'nlp'
        if 'python' in s or 'pandas' in s or 'numpy' in s:
            return 'python'
        if 'java' in s and 'javascript' not in s:
            return 'java'
        if 'sql' in s or 'database' in s or 'rdbms' in s:
            return 'sql'
        if 'git' in s or 'github' in s:
            return 'git'
        if 'docker' in s or 'container' in s or 'devops' in s:
            return 'docker'
        if 'aws' in s or 'cloud' in s or 'gcp' in s:
            return 'aws'

        return None

    @classmethod
    def generate_assessment(
        cls, 
        user_skills: List[str], 
        questions_per_tier: Dict[str, int] = None
    ) -> Dict[str, Any]:
        """
        Generate a dynamic 30-question assessment covering all extracted resume skills individually with progressive difficulty.
        """
        if not user_skills or len(user_skills) == 0:
            return {
                'success': False,
                'requires_resume': True,
                'error': 'No resume skills found. Please upload a resume before taking an assessment.',
                'questions': [],
                'total_questions': 0
            }

        if questions_per_tier is None:
            # 10 Easy, 10 Medium, 10 Hard (30 questions total)
            questions_per_tier = {'easy': 10, 'medium': 10, 'hard': 10}

        # 1. Identify matched individual skills directly from the latest resume
        matched_keys = []
        matched_display_names = []
        
        for raw_skill in user_skills:
            norm_key = cls.normalize_skill(raw_skill)
            if norm_key and norm_key in SKILL_QUESTION_BANK and norm_key not in matched_keys:
                matched_keys.append(norm_key)
                # Store exact matching display name
                display_name = raw_skill.strip()
                matched_display_names.append(display_name)

        # Fallback if unmapped skills
        if not matched_keys:
            matched_keys = ['python', 'javascript', 'sql']
            matched_display_names = ['Python', 'JavaScript', 'SQL']

        selected_questions: List[Dict[str, Any]] = []
        tested_skills_set = set()

        # 2. Progressive difficulty generation (10 Easy -> 10 Medium -> 10 Hard)
        # Continuous rotating round-robin across every individual matched skill
        current_skill_idx = 0
        for difficulty in ['easy', 'medium', 'hard']:
            count_needed = questions_per_tier.get(difficulty, 10)
            tier_pool: List[Dict[str, Any]] = []

            # Prepare question pools per individual skill
            skill_pool_map: Dict[str, List[Dict[str, Any]]] = {}
            for key in matched_keys:
                avail = [
                    q for q in SKILL_QUESTION_BANK.get(key, [])
                    if q.get('difficulty') == difficulty and q not in selected_questions
                ]
                random.shuffle(avail)
                skill_pool_map[key] = avail

            # Balanced round-robin sampling across individual skills continuing from current_skill_idx
            attempts = 0
            while len(tier_pool) < count_needed and attempts < len(matched_keys) * 3:
                key = matched_keys[current_skill_idx % len(matched_keys)]
                current_skill_idx += 1
                attempts += 1
                
                avail = skill_pool_map.get(key, [])
                if avail:
                    q = avail.pop(0)
                    tier_pool.append(q)
                    attempts = 0

            # If still needed, fill from any available in matched skills
            if len(tier_pool) < count_needed:
                for key in matched_keys:
                    all_avail = [
                        q for q in SKILL_QUESTION_BANK.get(key, [])
                        if q not in selected_questions and q not in tier_pool
                    ]
                    if all_avail:
                        tier_pool.append(all_avail[0])
                        if len(tier_pool) >= count_needed:
                            break

            for q in tier_pool:
                selected_questions.append(q)
                tested_skills_set.add(q.get('skill', 'General'))

        # 3. Format client questions with 1-based index and shuffled options
        client_questions = []
        for idx, q in enumerate(selected_questions):
            options = list(q['options'])
            random.shuffle(options)
            client_questions.append({
                'id': q['id'],
                'index': idx + 1,
                'skill': q.get('skill', 'General'),
                'difficulty': q.get('difficulty', 'easy'),
                'question': q['question'],
                'options': options
            })

        # Display skills in top banner
        banner_skills = list(tested_skills_set) if tested_skills_set else user_skills

        return {
            'success': True,
            'requires_resume': False,
            'session_id': f"assess_{random.randint(10000, 99999)}",
            'total_questions': len(client_questions),
            'tested_skills': sorted(banner_skills),
            'difficulty_tiers': ['easy', 'medium', 'hard'],
            'tier_counts': {
                'easy': len([q for q in client_questions if q['difficulty'] == 'easy']),
                'medium': len([q for q in client_questions if q['difficulty'] == 'medium']),
                'hard': len([q for q in client_questions if q['difficulty'] == 'hard']),
            },
            'source': 'resume_extracted',
            'questions': client_questions
        }

    @classmethod
    def evaluate_submission(cls, submitted_answers: Dict[str, str], time_taken_seconds: int = 0) -> Dict[str, Any]:
        """
        Evaluate user answers, compute overall percentage, difficulty breakdown, and per-skill breakdown.
        """
        total = len(submitted_answers) if submitted_answers else 0
        if total == 0:
            return {
                'score': 0,
                'percentage': 0,
                'total_questions': 0,
                'correct_answers': 0,
                'difficulty_breakdown': {
                    'easy': {'total': 0, 'correct': 0, 'percentage': 0},
                    'medium': {'total': 0, 'correct': 0, 'percentage': 0},
                    'hard': {'total': 0, 'correct': 0, 'percentage': 0}
                },
                'skill_breakdown': {},
                'review': []
            }

        correct_count = 0
        skill_stats: Dict[str, Dict[str, int]] = {}
        difficulty_stats = {
            'easy': {'total': 0, 'correct': 0},
            'medium': {'total': 0, 'correct': 0},
            'hard': {'total': 0, 'correct': 0}
        }
        review_list = []

        for q_id, user_choice in submitted_answers.items():
            q_info = ALL_QUESTIONS_MAP.get(q_id)
            if not q_info:
                continue

            skill = q_info.get('skill', 'General')
            diff = q_info.get('difficulty', 'easy').lower()

            if skill not in skill_stats:
                skill_stats[skill] = {'total': 0, 'correct': 0}
            skill_stats[skill]['total'] += 1

            if diff in difficulty_stats:
                difficulty_stats[diff]['total'] += 1

            is_correct = (user_choice == q_info.get('correct_answer'))
            if is_correct:
                correct_count += 1
                skill_stats[skill]['correct'] += 1
                if diff in difficulty_stats:
                    difficulty_stats[diff]['correct'] += 1

            review_list.append({
                'id': q_id,
                'skill': skill,
                'difficulty': diff,
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

        # Compute per-difficulty breakdown
        diff_breakdown = {}
        for diff_name, stats in difficulty_stats.items():
            diff_breakdown[diff_name] = {
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
            'difficulty_breakdown': diff_breakdown,
            'skill_breakdown': skill_breakdown,
            'review': review_list
        }
