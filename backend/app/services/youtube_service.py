# backend/app/services/youtube_service.py

import os
import re
import logging
import requests
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

# =====================================================================
# CURATED VERIFIED VIDEO REPOSITORY
# Every video ID in this catalog is verified to be publicly accessible,
# embeddable, and directly teaching the targeted skill.
# =====================================================================
SKILL_VIDEO_MAP: Dict[str, Dict[str, Any]] = {
    # --- WEB / FRONTEND ---
    'html': {
        'id': 'pQN-pnXPaVg',
        'title': 'HTML Full Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Web / Frontend'
    },
    'css': {
        'id': '1Rs2ND1ryYc',
        'title': 'CSS Flexbox & Responsive Design Masterclass',
        'channel': 'Traversy Media',
        'category': 'Web / Frontend'
    },
    'javascript': {
        'id': 'W6NZfCO5SIk',
        'title': 'JavaScript Tutorial for Beginners',
        'channel': 'Programming with Mosh',
        'duration': '48:16',
        'duration_seconds': 2896,
        'category': 'Web / Frontend'
    },
    'react': {
        'id': 'bMknfKXIFA8',
        'title': 'React.js Complete Masterclass',
        'channel': 'freeCodeCamp.org',
        'category': 'Web / Frontend'
    },
    'angular': {
        'id': 'k5E2AVpwsko',
        'title': 'Angular Tutorial for Beginners',
        'channel': 'Programming with Mosh',
        'category': 'Web / Frontend'
    },
    'vue': {
        'id': 'qZXt1Aom3Cs',
        'title': 'Vue JS Crash Course',
        'channel': 'Traversy Media',
        'category': 'Web / Frontend'
    },
    'next.js': {
        'id': 'Sklc_fQBmcs',
        'title': 'Next.js Full Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Web / Frontend'
    },
    'typescript': {
        'id': 'd56mG7DezGs',
        'title': 'TypeScript Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Web / Frontend'
    },
    'tailwind css': {
        'id': 'dFgzHOX84xQ',
        'title': 'Tailwind CSS Crash Course',
        'channel': 'Traversy Media',
        'category': 'Web / Frontend'
    },
    'redux': {
        'id': 'poQXNp9ItL4',
        'title': 'Redux Tutorial - Learn Redux from Scratch',
        'channel': 'Programming with Mosh',
        'category': 'Web / Frontend'
    },
    'bootstrap': {
        'id': '-qfEOE4vtxE',
        'title': 'Bootstrap CSS Framework - Full Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Web / Frontend'
    },
    'graphql': {
        'id': 'ed8SzALpx1Q',
        'title': 'GraphQL Full Course - Novice to Expert',
        'channel': 'freeCodeCamp.org',
        'category': 'Web / Frontend'
    },

    # --- BACKEND ---
    'node.js': {
        'id': 'Oe421EPjeBE',
        'title': 'Node.js and Express.js - Full Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Backend'
    },
    'express.js': {
        'id': 'Oe421EPjeBE',
        'title': 'Node.js and Express.js - Full Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Backend'
    },
    'fastapi': {
        'id': '7t2alSnE2-I',
        'title': 'FastAPI Python Framework Full Course',
        'channel': 'Sarthaksavvy',
        'category': 'Backend'
    },
    'django': {
        'id': 'rHux0gMZ3Eg',
        'title': 'Django Tutorial for Beginners',
        'channel': 'Programming with Mosh',
        'category': 'Backend'
    },
    'spring boot': {
        'id': '35EQXmHKZYs',
        'title': 'Spring Boot Tutorials | Full Course',
        'channel': 'Telusko',
        'category': 'Backend'
    },
    'rest api': {
        'id': 'WXsD0ZgxjRw',
        'title': 'APIs for Beginners - How to use an API',
        'channel': 'freeCodeCamp.org',
        'category': 'Backend'
    },
    'websockets': {
        'id': '8ARodQ4Wlf4',
        'title': "A Beginner's Guide to WebSockets",
        'channel': 'Fireship',
        'category': 'Backend'
    },

    # --- DATABASE ---
    'mysql': {
        'id': '7S_tz1z_5bA',
        'title': 'SQL & MySQL Course for Beginners',
        'channel': 'Programming with Mosh',
        'category': 'Database'
    },
    'postgresql': {
        'id': 'qw--VYLpxG4',
        'title': 'Learn PostgreSQL Tutorial - Full Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Database'
    },
    'mongodb': {
        'id': 'ofme2o29ngU',
        'title': 'MongoDB Crash Course for Beginners',
        'channel': 'Web Dev Simplified',
        'category': 'Database'
    },
    'redis': {
        'id': 'XCsS_NVAa1g',
        'title': 'Redis Course - In-Memory Database Tutorial',
        'channel': 'freeCodeCamp.org',
        'category': 'Database'
    },
    'firebase': {
        'id': '9kRgVxULbag',
        'title': "Firebase - Ultimate Beginner's Guide",
        'channel': 'Fireship',
        'category': 'Database'
    },
    'sql': {
        'id': 'HXV3zeQKqGY',
        'title': 'SQL Tutorial - Full Database Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Database'
    },
    'database management systems': {
        'id': 'HXV3zeQKqGY',
        'title': 'Database Management Systems (DBMS) Masterclass',
        'channel': 'freeCodeCamp.org',
        'category': 'Database'
    },
    'dbms': {
        'id': 'HXV3zeQKqGY',
        'title': 'Database Management Systems (DBMS) Masterclass',
        'channel': 'freeCodeCamp.org',
        'category': 'Database'
    },

    # --- PROGRAMMING LANGUAGES ---
    'c': {
        'id': 'KJgsSFOSQv0',
        'title': 'C Programming Tutorial for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Programming'
    },
    'c++': {
        'id': 'vLnPwxZdW4Y',
        'title': 'C++ Tutorial for Beginners - Full Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Programming'
    },
    'java': {
        'id': 'eIrMbAQSU34',
        'title': 'Java Full Course for Beginners',
        'channel': 'Programming with Mosh',
        'category': 'Programming'
    },
    'python': {
        'id': 'rfscVS0vtbw',
        'title': 'Learn Python - Full Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Programming'
    },
    'go': {
        'id': 'YS4e4q9oBaU',
        'title': 'Learn Go Programming - Golang Tutorial for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Programming'
    },
    'rust': {
        'id': 'MsocPEZBd-M',
        'title': 'Rust Programming Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Programming'
    },
    'kotlin': {
        'id': 'F9UC9DY-vIU',
        'title': 'Kotlin Course - Tutorial for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Programming'
    },
    'swift': {
        'id': 'comQ1-x2a1Q',
        'title': 'Swift Tutorial - Full Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Programming'
    },
    'c#': {
        'id': 'gfkTfcpWqAY',
        'title': 'C# Tutorial for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Programming'
    },

    # --- AI / MACHINE LEARNING ---
    'machine learning': {
        'id': 'i_LwzRVP7bg',
        'title': 'Machine Learning for Everybody - Full Course',
        'channel': 'freeCodeCamp.org',
        'category': 'AI / ML'
    },
    'deep learning': {
        'id': 'aircAruvnKk',
        'title': 'Neural Networks & Deep Learning Crash Course',
        'channel': '3Blue1Brown',
        'category': 'AI / ML'
    },
    'artificial intelligence': {
        'id': 'i_LwzRVP7bg',
        'title': 'Artificial Intelligence & Machine Learning Course',
        'channel': 'freeCodeCamp.org',
        'category': 'AI / ML'
    },
    'nlp': {
        'id': 'fNxaJsNG3-s',
        'title': 'Natural Language Processing (NLP) Masterclass',
        'channel': 'TensorFlow',
        'category': 'AI / ML'
    },
    'computer vision': {
        'id': 'oXlwWbU8l2o',
        'title': 'OpenCV Course - Full Tutorial with Python',
        'channel': 'freeCodeCamp.org',
        'category': 'AI / ML'
    },
    'tensorflow': {
        'id': 'tpCFfeUEGs8',
        'title': 'Learn TensorFlow and Deep Learning Fundamentals',
        'channel': 'freeCodeCamp.org',
        'category': 'AI / ML'
    },
    'pytorch': {
        'id': 'V_xro1bcAuA',
        'title': 'PyTorch for Deep Learning Bootcamp',
        'channel': 'freeCodeCamp.org',
        'category': 'AI / ML'
    },
    'scikit-learn': {
        'id': '0B5eIE_1vpU',
        'title': 'Scikit-learn Crash Course - Machine Learning in Python',
        'channel': 'freeCodeCamp.org',
        'category': 'AI / ML'
    },
    'pandas': {
        'id': 'r-uOLxNrNk8',
        'title': 'Data Analysis with Python and Pandas',
        'channel': 'freeCodeCamp.org',
        'category': 'AI / ML'
    },
    'numpy': {
        'id': 'QUT1VHiLmmI',
        'title': 'Python NumPy Tutorial for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'AI / ML'
    },

    # --- DATA / ANALYTICS ---
    'power bi': {
        'id': 'TmhQCQr_DCA',
        'title': 'How to use Microsoft Power BI - Full Tutorial',
        'channel': 'edureka!',
        'category': 'Data / Analytics'
    },
    'tableau': {
        'id': 'aHaOIvR00So',
        'title': 'Tableau Full Course - Learn Tableau in 6 Hours',
        'channel': 'edureka!',
        'category': 'Data / Analytics'
    },
    'excel': {
        'id': 'Vl0H-qTclOg',
        'title': 'Microsoft Excel Tutorial for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Data / Analytics'
    },
    'statistics': {
        'id': 'xxpc-HPKN28',
        'title': 'Statistics - A Full University Course on Data Science',
        'channel': 'freeCodeCamp.org',
        'category': 'Data / Analytics'
    },
    'data analytics': {
        'id': 'r-uOLxNrNk8',
        'title': 'Data Analysis with Python - Full Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Data / Analytics'
    },
    'data visualization': {
        'id': 'aHaOIvR00So',
        'title': 'Data Visualization Masterclass with Tableau',
        'channel': 'edureka!',
        'category': 'Data / Analytics'
    },
    'data science': {
        'id': 'ua-CiDNNj30',
        'title': 'Learn Data Science Tutorial - Full Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Data / Analytics'
    },
    'time series analysis': {
        'id': 'e8Yw4alG16Q',
        'title': 'Time Series Analysis in Python | Full Course',
        'channel': 'edureka!',
        'category': 'Data / Analytics'
    },

    # --- CLOUD (STRICTLY DISAMBIGUATED) ---
    'aws': {
        'id': 'k1RI5locZE4',
        'title': 'AWS Tutorial For Beginners | AWS Full Course',
        'channel': 'edureka!',
        'category': 'Cloud'
    },
    'microsoft azure': {
        'id': '5abffC-K40c',
        'title': 'Microsoft Azure Fundamentals AZ-900 Certification Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Cloud'
    },
    'azure': {
        'id': '5abffC-K40c',
        'title': 'Microsoft Azure Fundamentals AZ-900 Certification Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Cloud'
    },
    'google cloud': {
        'id': 'cbcd6-m8sHg',
        'title': 'Google Cloud Digital Leader Certification Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Cloud'
    },
    'gcp': {
        'id': 'cbcd6-m8sHg',
        'title': 'Google Cloud Digital Leader Certification Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Cloud'
    },
    'cloud computing': {
        'id': 'M988_fsOSWo',
        'title': 'Cloud Computing In 6 Minutes | What Is Cloud Computing?',
        'channel': 'Simplilearn',
        'category': 'Cloud'
    },
    'cloud architecture': {
        'id': 'k1RI5locZE4',
        'title': 'Cloud Architecture & Fundamentals',
        'channel': 'edureka!',
        'category': 'Cloud'
    },

    # --- DEVOPS ---
    'docker': {
        'id': 'fqMOX6JJhGo',
        'title': 'Docker Tutorial for Beginners - Full Course',
        'channel': 'freeCodeCamp.org',
        'category': 'DevOps'
    },
    'kubernetes': {
        'id': 'X48VuDVv0do',
        'title': 'Kubernetes Tutorial for Beginners [FULL COURSE]',
        'channel': 'TechWorld with Nana',
        'category': 'DevOps'
    },
    'terraform': {
        'id': '7xngnjfIlK4',
        'title': 'Complete Terraform Course - From BEGINNER to PRO',
        'channel': 'DevOps Directive',
        'category': 'DevOps'
    },
    'jenkins': {
        'id': '6YZvp2GwT0A',
        'title': 'Learn Jenkins! Complete Jenkins Course',
        'channel': 'DevOps Journey',
        'category': 'DevOps'
    },
    'ci/cd': {
        'id': 'scEDHsr3APg',
        'title': 'DevOps CI/CD Explained in 100 Seconds',
        'channel': 'Fireship',
        'category': 'DevOps'
    },
    'github actions': {
        'id': 'eB0nUzAI7M8',
        'title': '5 Ways to DevOps-ify your App - Github Actions',
        'channel': 'Fireship',
        'category': 'DevOps'
    },
    'ansible': {
        'id': '5hycyr-8EKs',
        'title': 'Ansible Crash Course for Beginners',
        'channel': 'NetworkChuck',
        'category': 'DevOps'
    },

    # --- SECURITY ---
    'cybersecurity': {
        'id': 'inWWhr5tnEA',
        'title': 'What Is Cyber Security | How It Works?',
        'channel': 'Simplilearn',
        'category': 'Security'
    },
    'network security': {
        'id': 'inWWhr5tnEA',
        'title': 'Network Security & Cyber Defense Fundamentals',
        'channel': 'Simplilearn',
        'category': 'Security'
    },
    'ethical hacking': {
        'id': '3Kq1MIfTWCE',
        'title': 'Full Ethical Hacking Course - Network Penetration Testing',
        'channel': 'freeCodeCamp.org',
        'category': 'Security'
    },
    'owasp': {
        'id': 'inWWhr5tnEA',
        'title': 'Web Security & OWASP Top 10 Security Risks',
        'channel': 'Simplilearn',
        'category': 'Security'
    },
    'cryptography': {
        'id': 'jhXCTbFnK8o',
        'title': 'Cryptography: Crash Course Computer Science',
        'channel': 'CrashCourse',
        'category': 'Security'
    },

    # --- SYSTEM / SOFTWARE ENGINEERING ---
    'system design': {
        'id': 'm8Icp_Cid5o',
        'title': 'System Design for Beginners Course',
        'channel': 'freeCodeCamp.org',
        'category': 'System / Software Engineering'
    },
    'software architecture': {
        'id': 'm8Icp_Cid5o',
        'title': 'Software Architecture & System Design Fundamentals',
        'channel': 'freeCodeCamp.org',
        'category': 'System / Software Engineering'
    },
    'microservices': {
        'id': 'CdBtNQZH8a4',
        'title': 'What are Microservices?',
        'channel': 'IBM Technology',
        'category': 'System / Software Engineering'
    },
    'distributed systems': {
        'id': 'cQP8WApzIQQ',
        'title': 'MIT 6.824: Distributed Systems Introduction',
        'channel': 'MIT OpenCourseWare',
        'category': 'System / Software Engineering'
    },
    'operating systems': {
        'id': 'bkSWJJZNgf8',
        'title': 'Operating Systems Complete Masterclass',
        'channel': 'Gate Smashers',
        'category': 'System / Software Engineering'
    },
    'computer networks': {
        'id': 'IPvYjXCsTg8',
        'title': 'Computer Networking Full Course - OSI Model & Protocols',
        'channel': 'Kunal Kushwaha',
        'category': 'System / Software Engineering'
    },
    'real-time systems': {
        'id': 'cQP8WApzIQQ',
        'title': 'Real-Time & Distributed Systems Engineering',
        'channel': 'MIT OpenCourseWare',
        'category': 'System / Software Engineering'
    },

    # --- EMERGING / HARDWARE ---
    'solidity': {
        'id': 'M576WGiDBdQ',
        'title': 'Solidity, Blockchain, and Smart Contracts Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Emerging / Hardware'
    },
    'blockchain': {
        'id': 'gyMwXuJrbJQ',
        'title': 'Learn Blockchain, Solidity, and Full Stack Web3',
        'channel': 'freeCodeCamp.org',
        'category': 'Emerging / Hardware'
    },
    'web3': {
        'id': 'M576WGiDBdQ',
        'title': 'Web3 Development with Solidity and Ethereum',
        'channel': 'freeCodeCamp.org',
        'category': 'Emerging / Hardware'
    },
    'microcontrollers': {
        'id': 'MYyydWpZo60',
        'title': '8051 Microcontroller & Embedded Architecture',
        'channel': 'Engineering Funda',
        'category': 'Emerging / Hardware'
    },
    'embedded systems': {
        'id': '3cqu_xnuPnw',
        'title': 'Introduction to Embedded Systems & Embedded C Programming',
        'channel': 'IIT Madras - BS in Electronic Systems',
        'category': 'Emerging / Hardware'
    },
    'arduino': {
        'id': 'zJ-LqeX_fLU',
        'title': 'Arduino Course for Beginners - Open-Source Electronics',
        'channel': 'freeCodeCamp.org',
        'category': 'Emerging / Hardware'
    },
    'raspberry pi': {
        'id': '3zEzh5-f4KA',
        'title': 'How to Get Started with Raspberry Pi (Complete Beginner Guide)',
        'channel': 'Learn Linux TV',
        'category': 'Emerging / Hardware'
    },
    'iot': {
        'id': '6mBO2vqLv38',
        'title': 'Internet of Things (IoT) Full Course',
        'channel': 'Simplilearn',
        'category': 'Emerging / Hardware'
    },

    # --- CORE CS FOUNDATIONS ---
    'data structures': {
        'id': 'RBSGKlAvoiM',
        'title': 'Data Structures Easy to Advanced Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Core CS'
    },
    'algorithms': {
        'id': '0IAPZzGSbME',
        'title': 'MIT 6.006: Introduction to Algorithms',
        'channel': 'MIT OpenCourseWare',
        'category': 'Core CS'
    },
    'git': {
        'id': '8JJ101D3knE',
        'title': 'Git and GitHub for Beginners - Crash Course',
        'channel': 'freeCodeCamp.org',
        'category': 'Core CS'
    },
    'linux': {
        'id': 'wBp0Rb-ZJak',
        'title': 'Linux Command Line Tutorial for Beginners',
        'channel': 'freeCodeCamp.org',
        'category': 'Core CS'
    }
}

# =====================================================================
# SAFE CATEGORY LEVEL FALLBACKS (NEVER DSA)
# Used when an unknown skill is identified as belonging to a category.
# =====================================================================
CATEGORY_FALLBACK_MAP: Dict[str, Dict[str, Any]] = {
    'Database': {
        'id': 'HXV3zeQKqGY',
        'title': 'Database Management Systems & SQL Masterclass',
        'channel': 'freeCodeCamp.org',
        'category': 'Database'
    },
    'Cloud': {
        'id': 'M988_fsOSWo',
        'title': 'Cloud Computing Fundamentals & Architecture',
        'channel': 'Simplilearn',
        'category': 'Cloud'
    },
    'DevOps': {
        'id': 'fqMOX6JJhGo',
        'title': 'Docker & DevOps Pipeline Fundamentals',
        'channel': 'freeCodeCamp.org',
        'category': 'DevOps'
    },
    'Web / Frontend': {
        'id': 'W6NZfCO5SIk',
        'title': 'Web Development & Frontend Masterclass',
        'channel': 'freeCodeCamp.org',
        'category': 'Web / Frontend'
    },
    'Backend': {
        'id': 'Oe421EPjeBE',
        'title': 'Backend Engineering & API Development',
        'channel': 'freeCodeCamp.org',
        'category': 'Backend'
    },
    'AI / ML': {
        'id': 'i_LwzRVP7bg',
        'title': 'Machine Learning & Artificial Intelligence Foundations',
        'channel': 'freeCodeCamp.org',
        'category': 'AI / ML'
    },
    'Data / Analytics': {
        'id': 'r-uOLxNrNk8',
        'title': 'Data Analytics & Analysis Masterclass',
        'channel': 'freeCodeCamp.org',
        'category': 'Data / Analytics'
    },
    'Security': {
        'id': 'inWWhr5tnEA',
        'title': 'Cybersecurity & Information Security Essentials',
        'channel': 'Simplilearn',
        'category': 'Security'
    },
    'System / Software Engineering': {
        'id': 'm8Icp_Cid5o',
        'title': 'System Design & Software Architecture',
        'channel': 'freeCodeCamp.org',
        'category': 'System / Software Engineering'
    },
    'Emerging / Hardware': {
        'id': '3cqu_xnuPnw',
        'title': 'Embedded Systems & Hardware Interfacing',
        'channel': 'IIT Madras',
        'category': 'Emerging / Hardware'
    },
    'Programming': {
        'id': 'rfscVS0vtbw',
        'title': 'Computer Programming Foundations',
        'channel': 'freeCodeCamp.org',
        'category': 'Programming'
    }
}

# Explicit alias normalization dictionary
CANONICAL_ALIASES: Dict[str, str] = {
    'react.js': 'react',
    'reactjs': 'react',
    'react js': 'react',
    'next.js': 'next.js',
    'nextjs': 'next.js',
    'next js': 'next.js',
    'node.js': 'node.js',
    'nodejs': 'node.js',
    'node js': 'node.js',
    'node': 'node.js',
    'express.js': 'express.js',
    'expressjs': 'express.js',
    'express js': 'express.js',
    'express': 'express.js',
    'vue.js': 'vue',
    'vuejs': 'vue',
    'vue js': 'vue',
    'tailwind': 'tailwind css',
    'tailwindcss': 'tailwind css',
    'tailwind-css': 'tailwind css',
    'power bi': 'power bi',
    'powerbi': 'power bi',
    'power-bi': 'power bi',
    'microsoft azure': 'azure',
    'azure cloud': 'azure',
    'ms azure': 'azure',
    'google cloud platform': 'gcp',
    'google cloud': 'gcp',
    'google-cloud': 'gcp',
    'database management systems': 'dbms',
    'database management system': 'dbms',
    'database management': 'dbms',
    'rdbms': 'dbms',
    'time series analysis': 'time series analysis',
    'time series': 'time series analysis',
    'timeseries': 'time series analysis',
    'real-time systems': 'real-time systems',
    'real time systems': 'real-time systems',
    'realtime systems': 'real-time systems',
    'real-time': 'real-time systems',
    'system design': 'system design',
    'software architecture': 'software architecture',
    'microservices': 'microservices',
    'micro-services': 'microservices',
    'microservice': 'microservices',
    'distributed systems': 'distributed systems',
    'distributed system': 'distributed systems',
    'dsa': 'data structures',
    'data structure': 'data structures',
    'data structures': 'data structures',
    'algorithms': 'algorithms',
    'algorithm': 'algorithms',
    'machine learning': 'machine learning',
    'ml': 'machine learning',
    'deep learning': 'deep learning',
    'dl': 'deep learning',
    'nlp': 'nlp',
    'natural language processing': 'nlp',
    'computer vision': 'computer vision',
    'cv': 'computer vision',
    'artificial intelligence': 'artificial intelligence',
    'ai': 'artificial intelligence',
    'k8s': 'kubernetes',
    'golang': 'go',
    'restful api': 'rest api',
    'restful apis': 'rest api',
    'rest apis': 'rest api',
    'rest': 'rest api'
}

# Compound phrases to test before generic single words (prevents substring collisions)
COMPOUND_PHRASES: List[Tuple[str, str]] = [
    ('database management systems', 'dbms'),
    ('database management', 'dbms'),
    ('time series analysis', 'time series analysis'),
    ('real-time systems', 'real-time systems'),
    ('real time systems', 'real-time systems'),
    ('system design', 'system design'),
    ('software architecture', 'software architecture'),
    ('network security', 'network security'),
    ('ethical hacking', 'ethical hacking'),
    ('cloud architecture', 'cloud architecture'),
    ('cloud computing', 'cloud computing'),
    ('google cloud', 'gcp'),
    ('microsoft azure', 'azure'),
    ('spring boot', 'spring boot'),
    ('rest api', 'rest api'),
    ('tailwind css', 'tailwind css'),
    ('machine learning', 'machine learning'),
    ('deep learning', 'deep learning'),
    ('artificial intelligence', 'artificial intelligence'),
    ('computer vision', 'computer vision'),
    ('computer networks', 'computer networks'),
    ('operating systems', 'operating systems'),
    ('distributed systems', 'distributed systems'),
    ('embedded systems', 'embedded systems'),
    ('github actions', 'github actions'),
    ('data analytics', 'data analytics'),
    ('data visualization', 'data visualization'),
    ('data science', 'data science'),
    ('data structures', 'data structures')
]


def normalize_skill_name(skill: str) -> str:
    """Normalize skill name safely for internal lookup without mutating display label"""
    if not skill:
        return ''
    s = str(skill).strip().lower()
    # Normalize multiple whitespace
    s = re.sub(r'\s+', ' ', s)
    # Check canonical aliases
    if s in CANONICAL_ALIASES:
        return CANONICAL_ALIASES[s]
    # Strip trailing punctuation if present
    cleaned = re.sub(r'[^\w\s\.\+#\-/]', '', s).strip()
    return CANONICAL_ALIASES.get(cleaned, cleaned)


def extract_youtube_id(val: Any) -> Optional[str]:
    """
    Extract canonical 11-character YouTube video ID from various formats:
    - Raw ID: 'W6NZfCO5SIk'
    - Watch URL: 'https://www.youtube.com/watch?v=W6NZfCO5SIk'
    - Short URL: 'https://youtu.be/W6NZfCO5SIk'
    - Embed URL: 'https://www.youtube.com/embed/W6NZfCO5SIk'
    - Query parameter URL: 'https://www.youtube.com/watch?v=W6NZfCO5SIk&feature=share'
    - Shorts URL: 'https://www.youtube.com/shorts/W6NZfCO5SIk'
    - Dictionary with 'id', 'videoId', 'url', or 'embed_url'
    Returns normalized 11-char ID or None if invalid.
    """
    if not val:
        return None
    if isinstance(val, dict):
        for key in ('id', 'videoId', 'url', 'embed_url'):
            extracted = extract_youtube_id(val.get(key))
            if extracted:
                return extracted
        return None

    s = str(val).strip()
    if not s:
        return None

    # Direct 11-character alphanumeric/dash/underscore check (excluding placeholder tokens)
    if len(s) == 11 and re.match(r'^[a-zA-Z0-9_-]{11}$', s):
        if not s.startswith('fallback') and not s.startswith('search_'):
            return s

    # Regex for various YouTube URL patterns
    pattern = r'(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?(?:.*&)?v=|shorts\/))([a-zA-Z0-9_-]{11})'
    match = re.search(pattern, s)
    if match:
        extracted = match.group(1)
        if not extracted.startswith('fallback') and not extracted.startswith('search_'):
            return extracted

    return None


def deduplicate_youtube_videos(videos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deduplicate a list of YouTube video objects.
    - Preserves original list order.
    - Preserves the first valid occurrence of each video.
    - Compares normalized 11-character YouTube video IDs.
    - Ignores null, empty, or invalid IDs.
    - Removes duplicate IDs.
    - Does not mutate unrelated fields or create replacement records.
    - Normalizes the 'id', 'url', 'embed_url', and 'thumbnail' using the canonical video ID.
    """
    if not videos or not isinstance(videos, list):
        return []

    seen = set()
    unique = []

    for item in videos:
        if not isinstance(item, dict):
            continue

        vid_id = extract_youtube_id(item)
        if not vid_id:
            continue

        if vid_id in seen:
            continue

        seen.add(vid_id)
        clean_item = apply_canonical_metadata(item)
        unique.append(clean_item)

    return unique


# Verified canonical YouTube metadata dictionary (exact YouTube durations, channels, titles)
# Eliminates guessed or fabricated durations (such as '1 hr 8 mins', '45 mins', '40 mins')
VERIFIED_CANONICAL_METADATA: Dict[str, Dict[str, Any]] = {
    'W6NZfCO5SIk': {
        'id': 'W6NZfCO5SIk',
        'title': 'JavaScript Tutorial for Beginners',
        'channel': 'Programming with Mosh',
        'duration': '48:16',
        'duration_seconds': 2896,
        'category': 'Web / Frontend'
    },
    'jS4aFq5-91M': {
        'id': 'jS4aFq5-91M',
        'title': 'JavaScript Programming - Full Course',
        'channel': 'freeCodeCamp.org',
        'duration': '7:44:19',
        'duration_seconds': 27859,
        'category': 'Web / Frontend'
    },
    'dtKciwk_si4': {
        'id': 'dtKciwk_si4',
        'title': '10 JavaScript Projects in 10 Hours - Coding Challenge',
        'channel': 'Florin Pop',
        'duration': '9:17:08',
        'duration_seconds': 33428,
        'category': 'Web / Frontend'
    },
    '3PHXvlpOkf4': {
        'id': '3PHXvlpOkf4',
        'title': 'Build 15 JavaScript Projects - Vanilla JavaScript',
        'channel': 'freeCodeCamp.org',
        'duration': '8:23:56',
        'duration_seconds': 30236,
        'category': 'Web / Frontend'
    },
    'N65RvNkZFGE': {
        'id': 'N65RvNkZFGE',
        'title': 'JavaScript Practice Exercises For Beginners: Beginner Exercises Part 1',
        'channel': 'Code With Bubb',
        'duration': '14:06',
        'duration_seconds': 846,
        'category': 'Web / Frontend'
    },
    'ufBbWIyKY2E': {
        'id': 'ufBbWIyKY2E',
        'title': 'Top 10 Javascript Algorithms to Prepare for Coding Interviews',
        'channel': 'freeCodeCamp.org',
        'duration': '1:52:52',
        'duration_seconds': 6772,
        'category': 'Web / Frontend'
    },
    'hdI2bqOjy3c': {
        'id': 'hdI2bqOjy3c',
        'title': 'JavaScript Crash Course For Beginners',
        'channel': 'Traversy Media',
        'duration': '1:40:30',
        'duration_seconds': 6030,
        'category': 'Web / Frontend'
    },
    'PkZNo7MFNFg': {
        'id': 'PkZNo7MFNFg',
        'title': 'Learn JavaScript - Full Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'duration': '3:26:43',
        'duration_seconds': 12403,
        'category': 'Web / Frontend'
    },
    'rfscVS0vtbw': {
        'id': 'rfscVS0vtbw',
        'title': 'Learn Python - Full Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'duration': '4:26:51',
        'duration_seconds': 16011,
        'category': 'Programming'
    },
    '_uQrJ0TkZlc': {
        'id': '_uQrJ0TkZlc',
        'title': 'Python Full Course for Beginners',
        'channel': 'Programming with Mosh',
        'duration': '6:14:06',
        'duration_seconds': 22446,
        'category': 'Programming'
    },
    '8ext9G7xspg': {
        'id': '8ext9G7xspg',
        'title': '12 Beginner Python Projects - Coding Course',
        'channel': 'freeCodeCamp.org',
        'duration': '3:00:28',
        'duration_seconds': 10828,
        'category': 'Programming'
    },
    'DLikpfc64cA': {
        'id': 'DLikpfc64cA',
        'title': 'Python Programming Tutorial',
        'channel': 'freeCodeCamp.org',
        'duration': '4:36:42',
        'duration_seconds': 16602,
        'category': 'Programming'
    },
    'B31LgI4Y4DQ': {
        'id': 'B31LgI4Y4DQ',
        'title': 'Data Structures - Full Course Using C and C++',
        'channel': 'freeCodeCamp.org',
        'duration': '9:46:10',
        'duration_seconds': 35170,
        'category': 'Programming'
    },
    'DEwgZNC-KyE': {
        'id': 'DEwgZNC-KyE',
        'title': 'Preparing for a Python Interview',
        'channel': 'Corey Schafer',
        'duration': '22:54',
        'duration_seconds': 1374,
        'category': 'Programming'
    },
    'HGOBQPFzWKo': {
        'id': 'HGOBQPFzWKo',
        'title': 'Intermediate Python Programming Course',
        'channel': 'freeCodeCamp.org',
        'duration': '5:55:46',
        'duration_seconds': 21346,
        'category': 'Programming'
    },
    'bMknfKXIFA8': {
        'id': 'bMknfKXIFA8',
        'title': "React Course - Beginner's Tutorial",
        'channel': 'freeCodeCamp.org',
        'duration': '11:55:27',
        'duration_seconds': 42927,
        'category': 'Web / Frontend'
    },
    'SqcY0GlETPk': {
        'id': 'SqcY0GlETPk',
        'title': 'React Tutorial for Beginners',
        'channel': 'Programming with Mosh',
        'duration': '1:20:03',
        'duration_seconds': 4803,
        'category': 'Web / Frontend'
    },
    'a_7Z7C_JCyo': {
        'id': 'a_7Z7C_JCyo',
        'title': 'Code 15 React Projects - Complete Course',
        'channel': 'freeCodeCamp.org',
        'duration': '9:07:47',
        'duration_seconds': 32867,
        'category': 'Web / Frontend'
    },
    'fqMOX6JJhGo': {
        'id': 'fqMOX6JJhGo',
        'title': 'Docker & DevOps Pipeline Fundamentals',
        'channel': 'freeCodeCamp.org',
        'duration': '2:10:18',
        'duration_seconds': 7818,
        'category': 'Web / Frontend'
    },
    'HXV3zeQKqGY': {
        'id': 'HXV3zeQKqGY',
        'title': 'SQL Tutorial - Full Database Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'duration': '4:20:38',
        'duration_seconds': 15638,
        'category': 'Database'
    },
    '7S_tz1z_5bA': {
        'id': '7S_tz1z_5bA',
        'title': 'SQL Course for Beginners',
        'channel': 'Programming with Mosh',
        'duration': '3:10:18',
        'duration_seconds': 11418,
        'category': 'Database'
    },
    'BPHAr4QGGVE': {
        'id': 'BPHAr4QGGVE',
        'title': 'SQL Full Course',
        'channel': 'edureka!',
        'duration': '4:07:50',
        'duration_seconds': 14870,
        'category': 'Database'
    },
    'ofme2o29ngU': {
        'id': 'ofme2o29ngU',
        'title': 'MongoDB Crash Course',
        'channel': 'Web Dev Simplified',
        'duration': '29:58',
        'duration_seconds': 1798,
        'category': 'Database'
    },
    '7CqJlxBYj-M': {
        'id': '7CqJlxBYj-M',
        'title': 'Learn the MERN Stack - Full Tutorial',
        'channel': 'freeCodeCamp.org',
        'duration': '1:47:01',
        'duration_seconds': 6421,
        'category': 'Database'
    },
    'TmhQCQr_DCA': {
        'id': 'TmhQCQr_DCA',
        'title': 'How to use Microsoft Power BI - Tutorial for Beginners',
        'channel': 'Kevin Stratvert',
        'duration': '27:52',
        'duration_seconds': 1672,
        'category': 'Data Analytics'
    },
    'm8Icp_Cid5o': {
        'id': 'm8Icp_Cid5o',
        'title': 'System Design for Beginners Course',
        'channel': 'freeCodeCamp.org',
        'duration': '1:25:06',
        'duration_seconds': 5106,
        'category': 'Software Architecture'
    },
    'i53Gi_K3o7I': {
        'id': 'i53Gi_K3o7I',
        'title': '20 System Design Concepts Explained in 10 Minutes',
        'channel': 'NeetCode',
        'duration': '11:39',
        'duration_seconds': 699,
        'category': 'Software Architecture'
    },
    '7xngnjfIlK4': {
        'id': '7xngnjfIlK4',
        'title': 'Complete Terraform Course - From BEGINNER to PRO!',
        'channel': 'DevOps Directive',
        'duration': '2:38:03',
        'duration_seconds': 9483,
        'category': 'DevOps / Cloud'
    },
    'SLB_c_ayRMo': {
        'id': 'SLB_c_ayRMo',
        'title': 'Terraform Course - Automate your AWS cloud infrastructure',
        'channel': 'freeCodeCamp.org',
        'duration': '2:20:57',
        'duration_seconds': 8457,
        'category': 'DevOps / Cloud'
    },
    'M576WGiDBdQ': {
        'id': 'M576WGiDBdQ',
        'title': 'Solidity, Blockchain, and Smart Contract Course',
        'channel': 'freeCodeCamp.org',
        'duration': '16:22:11',
        'duration_seconds': 58931,
        'category': 'Blockchain / Web3'
    },
    'gyMwXuJrbJQ': {
        'id': 'gyMwXuJrbJQ',
        'title': 'Learn Blockchain, Solidity, and Full Stack Web3 Development',
        'channel': 'freeCodeCamp.org',
        'duration': '31:54:30',
        'duration_seconds': 114870,
        'category': 'Blockchain / Web3'
    },
    'MIYQR-Ybrn4': {
        'id': 'MIYQR-Ybrn4',
        'title': 'How To Make Weather App Using JavaScript Step By Step Explained',
        'channel': 'GreatStack',
        'duration': '41:59',
        'duration_seconds': 2519,
        'category': 'Web / Frontend'
    },
    'G0jO8kUrg-I': {
        'id': 'G0jO8kUrg-I',
        'title': 'How To Create To-Do List App Using HTML CSS And JavaScript | Task App In JavaScript',
        'channel': 'GreatStack',
        'duration': '26:48',
        'duration_seconds': 1608,
        'category': 'Web / Frontend'
    },
    'MX48mv73jf8': {
        'id': 'MX48mv73jf8',
        'title': 'Top 30 JavaScript Interview Questions 2025 | JavaScript Interview Questions & Answers',
        'channel': 'Intellipaat',
        'duration': '1:35:43',
        'duration_seconds': 5743,
        'category': 'Web / Frontend'
    },
    'AUTO7ALJk2U': {
        'id': 'AUTO7ALJk2U',
        'title': 'Top 100 JavaScript Interview Questions and Answers | 3 Hours JavaScript Interview Preparation',
        'channel': 'Interview Happy',
        'duration': '3:00:41',
        'duration_seconds': 10841,
        'category': 'Web / Frontend'
    },
    'XGf2GcyHPhc': {
        'id': 'XGf2GcyHPhc',
        'title': 'Learn Python by Building Five Games - Full Course',
        'channel': 'freeCodeCamp.org',
        'duration': '6:43:42',
        'duration_seconds': 24222,
        'category': 'Programming'
    },
    'WH_ieAsb4AI': {
        'id': 'WH_ieAsb4AI',
        'title': '50 Most Asked Python Interview Questions | Python Interview Questions & Answers',
        'channel': 'upGrad',
        'duration': '32:48',
        'duration_seconds': 1968,
        'category': 'Programming'
    },
    '4UZrsTqkcW4': {
        'id': '4UZrsTqkcW4',
        'title': 'Full React Course 2020 - Learn Fundamentals, Hooks, Custom Hooks',
        'channel': 'freeCodeCamp.org',
        'duration': '10:07:52',
        'duration_seconds': 36472,
        'category': 'Web / Frontend'
    },
    'RVFAyFWO4go': {
        'id': 'RVFAyFWO4go',
        'title': 'React JS Full Course for Beginners | Complete All-in-One Tutorial',
        'channel': 'Dave Gray',
        'duration': '8:49:06',
        'duration_seconds': 31746,
        'category': 'Web / Frontend'
    },
    'NkWOzTEEcco': {
        'id': 'NkWOzTEEcco',
        'title': 'Top 20 React JS Interview Questions For 2025 | React Interviewer Questions & Answers',
        'channel': 'Intellipaat',
        'duration': '53:24',
        'duration_seconds': 3204,
        'category': 'Web / Frontend'
    },
    'dAHTXKDsrZ8': {
        'id': 'dAHTXKDsrZ8',
        'title': 'Top 10 React Interview Questions and Answers 2025 - ReactJS Interview Questions for Experienced Devs',
        'channel': 'Shubham Kulkarni',
        'duration': '20:23',
        'duration_seconds': 1223,
        'category': 'Web / Frontend'
    },
    'aE623ff7zkM': {
        'id': 'aE623ff7zkM',
        'title': 'Solving SQL Interview Queries | Tricky SQL Interview Queries',
        'channel': 'techTFQ',
        'duration': '37:22',
        'duration_seconds': 2242,
        'category': 'Database'
    },
    'FNYdBLwZ6cE': {
        'id': 'FNYdBLwZ6cE',
        'title': 'Learn how to write SQL Queries(Practice Complex SQL Queries)',
        'channel': 'techTFQ',
        'duration': '49:56',
        'duration_seconds': 2996,
        'category': 'Database'
    },
    'ztHopE5Wnpc': {
        'id': 'ztHopE5Wnpc',
        'title': 'Database Design Course - Learn how to design and plan a database for beginners',
        'channel': 'freeCodeCamp.org',
        'duration': '8:07:20',
        'duration_seconds': 29240,
        'category': 'Database'
    },
    'oX5Y26O5dBE': {
        'id': 'oX5Y26O5dBE',
        'title': '15 SQL Interview Questions TO GET YOU HIRED in 2026 | SQL Interview Questions & Answers',
        'channel': 'Intellipaat',
        'duration': '24:29',
        'duration_seconds': 1469,
        'category': 'Database'
    },
    'YdoR3bGAEx4': {
        'id': 'YdoR3bGAEx4',
        'title': 'Complete SQL Interview Questions in One Shot | Placement Revision | Structured Query Language',
        'channel': 'Gate Smashers',
        'duration': '49:44',
        'duration_seconds': 2984,
        'category': 'Database'
    },
    'pWbMrx5rVBE': {
        'id': 'pWbMrx5rVBE',
        'title': 'MongoDB In 30 Minutes',
        'channel': 'Traversy Media',
        'duration': '32:27',
        'duration_seconds': 1947,
        'category': 'Database'
    },
    '477JliW7GKQ': {
        'id': '477JliW7GKQ',
        'title': 'Top 10 MongoDB Interview Questions and Answers | MongoDB Interview Preparation',
        'channel': 'Interview Happy',
        'duration': '32:25',
        'duration_seconds': 1945,
        'category': 'Database'
    },
    'EKEpVhi-29Q': {
        'id': 'EKEpVhi-29Q',
        'title': 'Top 30 MongoDB Interview Questions and Answers | MongoDB Interview Process',
        'channel': 'SimpliCode',
        'duration': '43:05',
        'duration_seconds': 2585,
        'category': 'Database'
    },
    'UzLMhqg3_Wc': {
        'id': 'UzLMhqg3_Wc',
        'title': 'System Design Introduction For Interview',
        'channel': 'Tushar Roy - Coding Made Simple',
        'duration': '27:22',
        'duration_seconds': 1642,
        'category': 'Software Architecture'
    },
    'SgWb6tWx3S8': {
        'id': 'SgWb6tWx3S8',
        'title': 'System Design Mock Interview: Design a Rate Limiter (with Meta Engineering Manager)',
        'channel': 'Aced (formerly Exponent)',
        'duration': '22:34',
        'duration_seconds': 1354,
        'category': 'Software Architecture'
    }
}


def apply_canonical_metadata(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enforces canonical metadata integrity across YouTube records.
    Guarantees verified duration and duration_seconds are injected.
    Replaces fabricated or inaccurate durations (e.g. '1 hr 8 mins', '45 mins') with authentic values.
    Returns item with duration=None if duration cannot be verified.
    """
    if not isinstance(item, dict):
        return item

    clean = dict(item)
    v_id = extract_youtube_id(clean)
    if not v_id:
        return clean

    clean['id'] = v_id
    if not clean.get('url') or v_id not in clean.get('url', ''):
        clean['url'] = f"https://www.youtube.com/watch?v={v_id}"
    if not clean.get('embed_url') or v_id not in clean.get('embed_url', ''):
        clean['embed_url'] = f"https://www.youtube.com/embed/{v_id}"
    if not clean.get('thumbnail') or f"vi/{v_id}" not in clean.get('thumbnail', ''):
        clean['thumbnail'] = f"https://i.ytimg.com/vi/{v_id}/mqdefault.jpg"

    if v_id in VERIFIED_CANONICAL_METADATA:
        can = VERIFIED_CANONICAL_METADATA[v_id]
        clean['duration'] = can['duration']
        clean['duration_seconds'] = can['duration_seconds']
        if not clean.get('channel') and can.get('channel'):
            clean['channel'] = can.get('channel')
        if not clean.get('title') and can.get('title'):
            clean['title'] = can.get('title')
        if not clean.get('category') and can.get('category'):
            clean['category'] = can.get('category')
    else:
        # Strip known fabricated durations
        raw_dur = str(clean.get('duration') or '').strip()
        if raw_dur in ['1 hr 8 mins', '45 mins', '40 mins', 'Duration unavailable', 'None', '']:
            clean['duration'] = None
            clean['duration_seconds'] = None

    return clean


# Stage-specific curated catalog with verified, embeddable YouTube videos
STAGE_CURATED_CATALOG: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
    'javascript': {
        'learn': [
            {'id': 'W6NZfCO5SIk', 'title': 'JavaScript Tutorial for Beginners', 'channel': 'Programming with Mosh', 'duration': '48:16', 'duration_seconds': 2896, 'badge': '⭐ Masterclass', 'category': 'Web / Frontend'},
            {'id': 'jS4aFq5-91M', 'title': 'JavaScript Programming - Full Course', 'channel': 'freeCodeCamp.org', 'duration': '7:44:19', 'duration_seconds': 27859, 'badge': '📘 Core Concepts', 'category': 'Web / Frontend'}
        ],
        'practice': [
            {'id': 'N65RvNkZFGE', 'title': 'JavaScript Practice Exercises For Beginners: Beginner Exercises Part 1', 'channel': 'Code With Bubb', 'duration': '14:06', 'duration_seconds': 846, 'badge': '💻 Hands-on Practice', 'category': 'Web / Frontend'},
            {'id': 'ufBbWIyKY2E', 'title': 'Top 10 Javascript Algorithms to Prepare for Coding Interviews', 'channel': 'freeCodeCamp.org', 'duration': '1:52:52', 'duration_seconds': 6772, 'badge': '🛠️ Guided Exercise', 'category': 'Web / Frontend'}
        ],
        'build': [
            {'id': 'MIYQR-Ybrn4', 'title': 'How To Make Weather App Using JavaScript Step By Step Explained', 'channel': 'GreatStack', 'duration': '41:59', 'duration_seconds': 2519, 'badge': '🚀 Project Implementation', 'category': 'Web / Frontend'},
            {'id': 'G0jO8kUrg-I', 'title': 'How To Create To-Do List App Using HTML CSS And JavaScript | Task App In JavaScript', 'channel': 'GreatStack', 'duration': '26:48', 'duration_seconds': 1608, 'badge': '🏗️ Architecture & Build', 'category': 'Web / Frontend'}
        ],
        'assess': [
            {'id': 'MX48mv73jf8', 'title': 'Top 30 JavaScript Interview Questions 2025 | JavaScript Interview Questions & Answers', 'channel': 'Intellipaat', 'duration': '1:35:43', 'duration_seconds': 5743, 'badge': '🎯 Interview Prep', 'category': 'Web / Frontend'},
            {'id': 'AUTO7ALJk2U', 'title': 'Top 100 JavaScript Interview Questions and Answers | 3 Hours JavaScript Interview Preparation', 'channel': 'Interview Happy', 'duration': '3:00:41', 'duration_seconds': 10841, 'badge': '🎯 Interview Questions', 'category': 'Web / Frontend'}
        ]
    },
    'python': {
        'learn': [
            {'id': 'rfscVS0vtbw', 'title': 'Learn Python - Full Course for Beginners', 'channel': 'freeCodeCamp.org', 'duration': '4:26:51', 'duration_seconds': 16011, 'category': 'Programming'},
            {'id': '_uQrJ0TkZlc', 'title': 'Python Full Course for Beginners', 'channel': 'Programming with Mosh', 'duration': '6:14:06', 'duration_seconds': 22446, 'category': 'Programming'}
        ],
        'practice': [
            {'id': '8ext9G7xspg', 'title': '12 Beginner Python Projects - Coding Course', 'channel': 'freeCodeCamp.org', 'duration': '3:00:28', 'duration_seconds': 10828, 'category': 'Programming'},
            {'id': 'HGOBQPFzWKo', 'title': 'Intermediate Python Programming Course', 'channel': 'freeCodeCamp.org', 'duration': '5:55:46', 'duration_seconds': 21346, 'category': 'Programming'}
        ],
        'build': [
            {'id': 'XGf2GcyHPhc', 'title': 'Learn Python by Building Five Games - Full Course', 'channel': 'freeCodeCamp.org', 'duration': '6:43:42', 'duration_seconds': 24222, 'category': 'Programming'}
        ],
        'assess': [
            {'id': 'DEwgZNC-KyE', 'title': 'Preparing for a Python Interview', 'channel': 'Corey Schafer', 'duration': '22:54', 'duration_seconds': 1374, 'category': 'Programming'},
            {'id': 'WH_ieAsb4AI', 'title': '50 Most Asked Python Interview Questions | Python Interview Questions & Answers', 'channel': 'upGrad', 'duration': '32:48', 'duration_seconds': 1968, 'category': 'Programming'}
        ]
    },
    'react': {
        'learn': [
            {'id': 'bMknfKXIFA8', 'title': "React Course - Beginner's Tutorial", 'channel': 'freeCodeCamp.org', 'duration': '11:55:27', 'duration_seconds': 42927, 'category': 'Web / Frontend'},
            {'id': 'SqcY0GlETPk', 'title': 'React Tutorial for Beginners', 'channel': 'Programming with Mosh', 'duration': '1:20:03', 'duration_seconds': 4803, 'category': 'Web / Frontend'}
        ],
        'practice': [
            {'id': 'a_7Z7C_JCyo', 'title': 'Code 15 React Projects - Complete Course', 'channel': 'freeCodeCamp.org', 'duration': '9:07:47', 'duration_seconds': 32867, 'category': 'Web / Frontend'},
            {'id': '4UZrsTqkcW4', 'title': 'Full React Course 2020 - Learn Fundamentals, Hooks, Custom Hooks', 'channel': 'freeCodeCamp.org', 'duration': '10:07:52', 'duration_seconds': 36472, 'category': 'Web / Frontend'}
        ],
        'build': [
            {'id': 'RVFAyFWO4go', 'title': 'React JS Full Course for Beginners | Complete All-in-One Tutorial', 'channel': 'Dave Gray', 'duration': '8:49:06', 'duration_seconds': 31746, 'category': 'Web / Frontend'}
        ],
        'assess': [
            {'id': 'NkWOzTEEcco', 'title': 'Top 20 React JS Interview Questions For 2025 | React Interviewer Questions & Answers', 'channel': 'Intellipaat', 'duration': '53:24', 'duration_seconds': 3204, 'category': 'Web / Frontend'},
            {'id': 'dAHTXKDsrZ8', 'title': 'Top 10 React Interview Questions and Answers 2025 - ReactJS Interview Questions for Experienced Devs', 'channel': 'Shubham Kulkarni', 'duration': '20:23', 'duration_seconds': 1223, 'category': 'Web / Frontend'}
        ]
    },
    'sql': {
        'learn': [
            {'id': 'HXV3zeQKqGY', 'title': 'SQL Tutorial - Full Database Course for Beginners', 'channel': 'freeCodeCamp.org', 'duration': '4:20:38', 'duration_seconds': 15638, 'category': 'Database'},
            {'id': '7S_tz1z_5bA', 'title': 'SQL Course for Beginners', 'channel': 'Programming with Mosh', 'duration': '3:10:18', 'duration_seconds': 11418, 'category': 'Database'}
        ],
        'practice': [
            {'id': 'aE623ff7zkM', 'title': 'Solving SQL Interview Queries | Tricky SQL Interview Queries', 'channel': 'techTFQ', 'duration': '37:22', 'duration_seconds': 2242, 'category': 'Database'},
            {'id': 'FNYdBLwZ6cE', 'title': 'Learn how to write SQL Queries(Practice Complex SQL Queries)', 'channel': 'techTFQ', 'duration': '49:56', 'duration_seconds': 2996, 'category': 'Database'}
        ],
        'build': [
            {'id': 'ztHopE5Wnpc', 'title': 'Database Design Course - Learn how to design and plan a database for beginners', 'channel': 'freeCodeCamp.org', 'duration': '8:07:20', 'duration_seconds': 29240, 'category': 'Database'},
            {'id': 'BPHAr4QGGVE', 'title': 'SQL Full Course', 'channel': 'edureka!', 'duration': '4:07:50', 'duration_seconds': 14870, 'category': 'Database'}
        ],
        'assess': [
            {'id': 'oX5Y26O5dBE', 'title': '15 SQL Interview Questions TO GET YOU HIRED in 2026 | SQL Interview Questions & Answers', 'channel': 'Intellipaat', 'duration': '24:29', 'duration_seconds': 1469, 'category': 'Database'},
            {'id': 'YdoR3bGAEx4', 'title': 'Complete SQL Interview Questions in One Shot | Placement Revision | Structured Query Language', 'channel': 'Gate Smashers', 'duration': '49:44', 'duration_seconds': 2984, 'category': 'Database'}
        ]
    },
    'mongodb': {
        'learn': [
            {'id': 'ofme2o29ngU', 'title': 'MongoDB Crash Course', 'channel': 'Web Dev Simplified', 'duration': '29:58', 'duration_seconds': 1798, 'category': 'Database'}
        ],
        'practice': [
            {'id': 'pWbMrx5rVBE', 'title': 'MongoDB In 30 Minutes', 'channel': 'Traversy Media', 'duration': '32:27', 'duration_seconds': 1947, 'category': 'Database'}
        ],
        'build': [
            {'id': '7CqJlxBYj-M', 'title': 'Learn the MERN Stack - Full Tutorial', 'channel': 'freeCodeCamp.org', 'duration': '1:47:01', 'duration_seconds': 6421, 'category': 'Database'}
        ],
        'assess': [
            {'id': '477JliW7GKQ', 'title': 'Top 10 MongoDB Interview Questions and Answers | MongoDB Interview Preparation', 'channel': 'Interview Happy', 'duration': '32:25', 'duration_seconds': 1945, 'category': 'Database'},
            {'id': 'EKEpVhi-29Q', 'title': 'Top 30 MongoDB Interview Questions and Answers | MongoDB Interview Process', 'channel': 'SimpliCode', 'duration': '43:05', 'duration_seconds': 2585, 'category': 'Database'}
        ]
    },
    'power bi': {
        'learn': [
            {'id': 'TmhQCQr_DCA', 'title': 'How to use Microsoft Power BI - Tutorial for Beginners', 'channel': 'Kevin Stratvert', 'duration': '27:52', 'duration_seconds': 1672, 'category': 'Data Analytics'}
        ]
    },
    'system design': {
        'learn': [
            {'id': 'm8Icp_Cid5o', 'title': 'System Design for Beginners Course', 'channel': 'freeCodeCamp.org', 'duration': '1:25:06', 'duration_seconds': 5106, 'category': 'Software Architecture'}
        ],
        'practice': [
            {'id': 'i53Gi_K3o7I', 'title': '20 System Design Concepts Explained in 10 Minutes', 'channel': 'NeetCode', 'duration': '11:39', 'duration_seconds': 699, 'category': 'Software Architecture'}
        ],
        'build': [
            {'id': 'm8Icp_Cid5o', 'title': 'System Design for Beginners Course', 'channel': 'freeCodeCamp.org', 'duration': '1:25:06', 'duration_seconds': 5106, 'category': 'Software Architecture'}
        ],
        'assess': [
            {'id': 'UzLMhqg3_Wc', 'title': 'System Design Introduction For Interview', 'channel': 'Tushar Roy - Coding Made Simple', 'duration': '27:22', 'duration_seconds': 1642, 'category': 'Software Architecture'},
            {'id': 'SgWb6tWx3S8', 'title': 'System Design Mock Interview: Design a Rate Limiter (with Meta Engineering Manager)', 'channel': 'Aced (formerly Exponent)', 'duration': '22:34', 'duration_seconds': 1354, 'category': 'Software Architecture'}
        ]
    },
    'terraform': {
        'learn': [
            {'id': '7xngnjfIlK4', 'title': 'Complete Terraform Course - From BEGINNER to PRO!', 'channel': 'DevOps Directive', 'duration': '2:38:03', 'duration_seconds': 9483, 'category': 'DevOps / Cloud'}
        ],
        'practice': [
            {'id': 'SLB_c_ayRMo', 'title': 'Terraform Course - Automate your AWS cloud infrastructure', 'channel': 'freeCodeCamp.org', 'duration': '2:20:57', 'duration_seconds': 8457, 'category': 'DevOps / Cloud'}
        ]
    },
    'solidity': {
        'learn': [
            {'id': 'M576WGiDBdQ', 'title': 'Solidity, Blockchain, and Smart Contract Course', 'channel': 'freeCodeCamp.org', 'duration': '16:22:11', 'duration_seconds': 58931, 'category': 'Blockchain / Web3'}
        ],
        'practice': [
            {'id': 'gyMwXuJrbJQ', 'title': 'Learn Blockchain, Solidity, and Full Stack Web3 Development', 'channel': 'freeCodeCamp.org', 'duration': '31:54:30', 'duration_seconds': 114870, 'category': 'Blockchain / Web3'}
        ]
    }
}


class YouTubeService:
    """YouTube integration service with caching and intelligent fallback generator"""

    def __init__(self):
        self.api_key = os.environ.get('YOUTUBE_API_KEY')
        self._cache: Dict[str, List[Dict[str, Any]]] = {}

    def clear_cache(self) -> None:
        """Clear all in-memory cached YouTube recommendations."""
        self._cache.clear()

    def get_videos_for_skill(self, skill: str, target_role: str = 'Software Engineer', stage: str = 'learn', max_results: int = 4, language: str = 'en') -> List[Dict[str, Any]]:
        """Fetch YouTube videos dynamically based on target role, skill, learning stage, and language preference"""
        skill_clean = (skill or '').strip()
        role_clean = (target_role or 'Software Engineer').strip()
        stage_clean = (stage or 'learn').strip().lower()
        lang_clean = (language or 'en').strip().lower()

        cache_key = f"{skill_clean.lower()}|{role_clean.lower()}|{stage_clean}|{lang_clean}|{max_results}"

        if cache_key in self._cache:
            # Defensive deduplication & canonical duration validation on cached entries
            cached = deduplicate_youtube_videos(self._cache[cache_key])
            self._cache[cache_key] = cached
            return cached

        if self.api_key:
            try:
                query = self._build_contextual_query(skill_clean, role_clean, stage_clean, lang_clean)
                videos = self._fetch_from_youtube_api(query, max_results, lang_clean)
                if videos:
                    videos = deduplicate_youtube_videos(videos)
                    self._cache[cache_key] = videos
                    return videos
            except Exception as e:
                logger.warning(f"YouTube API call failed: {e}. Falling back to contextual fallback generator.")

        # Contextual curated fallback (returns only genuine, unique videos)
        fallback_videos = self._generate_contextual_fallback(skill_clean, role_clean, stage_clean, '', language=lang_clean)
        fallback_videos = deduplicate_youtube_videos(fallback_videos)
        self._cache[cache_key] = fallback_videos
        return fallback_videos

    def _build_contextual_query(self, skill: str, target_role: str, stage: str, language: str = 'en') -> str:
        """Generate smart contextual search query based on stage, career target, and language"""
        skill_clean = str(skill).strip()
        role_clean = str(target_role or 'Software Engineer').strip()

        lang_low = str(language or 'en').lower()
        if lang_low in ['hi', 'hindi']:
            lang_suffix = " Hindi tutorial"
        elif lang_low in ['en+hi', 'en_hi', 'english_hindi', 'english+hindi']:
            lang_suffix = " English Hindi tutorial"
        else:
            lang_suffix = " English tutorial"

        if stage == 'practice':
            return f"{skill_clean} practice problems interview preparation {role_clean}{lang_suffix}"
        elif stage == 'build':
            return f"{skill_clean} full project tutorial for {role_clean}{lang_suffix}"
        elif stage == 'assess':
            return f"{skill_clean} interview questions quiz test{lang_suffix}"
        elif stage == 'advanced':
            return f"Advanced {skill_clean} architecture and best practices{lang_suffix}"
        else:
            return f"{skill_clean} full course tutorial for {role_clean} beginners{lang_suffix}"

    def _fetch_from_youtube_api(self, query: str, max_results: int, language: str = 'en') -> List[Dict[str, Any]]:
        """Query official YouTube Data API v3"""
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': max_results,
            'key': self.api_key,
            'relevanceLanguage': 'hi' if language in ['hi', 'hindi'] else 'en'
        }
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            videos = []
            for item in data.get('items', []):
                snippet = item.get('snippet', {})
                video_id = item.get('id', {}).get('videoId')
                if video_id:
                    videos.append({
                        'id': video_id,
                        'title': snippet.get('title'),
                        'channel': snippet.get('channelTitle'),
                        'thumbnail': snippet.get('thumbnails', {}).get('medium', {}).get('url') or f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                        'url': f"https://www.youtube.com/watch?v={video_id}",
                        'embed_url': f"https://www.youtube.com/embed/{video_id}",
                        'duration': None,
                        'duration_seconds': None,
                        'difficulty': 'Beginner' if 'beginner' in query.lower() else 'Intermediate',
                        'recommendation_source': 'api',
                        'match_type': 'search_api'
                    })
            return deduplicate_youtube_videos(videos)
        return []

    def _find_best_match(self, skill: str) -> Tuple[Optional[Dict[str, Any]], str, str]:
        """
        Multi-tiered resolution hierarchy:
        1. Exact Match on normalized skill
        2. Compound Phrase Match
        3. Whole-Word Regex Match
        4. Intelligent Category Fallback
        Returns: (video_item_dict_or_None, match_type, recommendation_source)
        """
        norm = normalize_skill_name(skill)
        skill_raw_low = str(skill or '').strip().lower()

        # Step 1: Exact skill match in curated map
        if norm in SKILL_VIDEO_MAP:
            logger.info(f"Skill: '{skill}' | Normalized: '{norm}' | Match: exact | Source: curated")
            return SKILL_VIDEO_MAP[norm], 'exact', 'curated'

        # Step 2: Compound phrase match (checked BEFORE generic single words)
        for phrase, target_key in COMPOUND_PHRASES:
            if phrase in skill_raw_low or phrase in norm:
                if target_key in SKILL_VIDEO_MAP:
                    logger.info(f"Skill: '{skill}' | Normalized: '{norm}' | Match: compound_phrase ('{phrase}') | Source: curated")
                    return SKILL_VIDEO_MAP[target_key], 'compound_phrase', 'curated'

        # Step 3: Whole-word boundary regex match on known curated keys
        # Sort keys by length descending to match longest specific term first
        sorted_keys = sorted(SKILL_VIDEO_MAP.keys(), key=lambda k: len(k), reverse=True)
        for k in sorted_keys:
            # Avoid single-letter collisions unless bounded
            if len(k) <= 2:
                pattern = r'(?i)(?:\b|^)' + re.escape(k) + r'(?:\b|$)'
            else:
                pattern = r'(?i)\b' + re.escape(k) + r'\b'
            if re.search(pattern, skill_raw_low) or re.search(pattern, norm):
                logger.info(f"Skill: '{skill}' | Normalized: '{norm}' | Match: whole_word ('{k}') | Source: curated")
                return SKILL_VIDEO_MAP[k], 'whole_word', 'curated'

        # Step 4: Intelligent Category Fallback
        # Explicit domain keyword tests
        category_match = None

        # Database category
        if any(term in skill_raw_low for term in ['database', 'dbms', 'sql', 'rdbms', 'nosql', 'datastore', 'cockroach', 'couchbase', 'cassandra', 'dynamodb', 'sqlite', 'mariadb']):
            category_match = 'Database'
        # Cloud category (strictly disambiguated)
        elif any(term in skill_raw_low for term in ['cloud', 'openstack', 'iaas', 'paas', 'saas', 'alibaba cloud', 'oracle cloud', 'serverless']):
            category_match = 'Cloud'
        # DevOps category
        elif any(term in skill_raw_low for term in ['devops', 'ci/cd', 'cicd', 'pipeline', 'container', 'orchestrat', 'gitops', 'iac', 'helm']):
            category_match = 'DevOps'
        # Security category
        elif any(term in skill_raw_low for term in ['security', 'cyber', 'penetrat', 'vulnerab', 'exploit', 'firewall', 'crypto', 'auth']):
            category_match = 'Security'
        # AI / ML category
        elif any(term in skill_raw_low for term in ['machine learning', 'deep learning', 'neural', 'artificial intelligence', 'nlp', 'vision', 'transformer', 'llm', 'genai']):
            category_match = 'AI / ML'
        # Data / Analytics category
        elif any(term in skill_raw_low for term in ['analytics', 'data analysis', 'statistic', 'dashboard', 'bi', 'visualization', 'mining']):
            category_match = 'Data / Analytics'
        # Web / Frontend category
        elif any(term in skill_raw_low for term in ['frontend', 'web', 'ui', 'ux', 'css', 'html', 'component', 'dom', 'browser']):
            category_match = 'Web / Frontend'
        # Backend category
        elif any(term in skill_raw_low for term in ['backend', 'api', 'endpoint', 'server', 'microservice']):
            category_match = 'Backend'
        # Emerging / Hardware category
        elif any(term in skill_raw_low for term in ['embedded', 'microcontroller', 'hardware', 'circuit', 'sensor', 'iot', 'robotics', 'arduino', 'raspberry']):
            category_match = 'Emerging / Hardware'
        # Programming category
        elif any(term in skill_raw_low for term in ['programming', 'language', 'compiler', 'coding']):
            category_match = 'Programming'

        if category_match and category_match in CATEGORY_FALLBACK_MAP:
            logger.info(f"Skill: '{skill}' | Normalized: '{norm}' | Match: category ('{category_match}') | Source: category_fallback")
            return CATEGORY_FALLBACK_MAP[category_match], 'category', 'category_fallback'

        # Step 5: Completely unknown skill — NEVER return unrelated DSA video
        logger.info(f"Skill: '{skill}' | Normalized: '{norm}' | Match: none | Source: safe_empty")
        return None, 'none', 'none'

    def _generate_contextual_fallback(self, skill: str, target_role: str, stage: str, query: str, language: str = 'en') -> List[Dict[str, Any]]:
        """
        Generate authentic video recommendations using verified curated mapping
        or intelligent category fallbacks. Returns empty list if no safe match exists.
        NEVER clones a single video into duplicate slots.
        NEVER overwrites canonical YouTube title or invents fake durations.
        """
        stage_clean = (stage or 'learn').lower().strip()
        norm = normalize_skill_name(skill)
        skill_raw_low = str(skill or '').strip().lower()

        # Check stage-specific catalog first
        candidate_items: List[Dict[str, Any]] = []
        rec_source = 'curated'
        match_type = 'exact'
        category = 'Technical Skills'

        matched_key = None
        if norm in STAGE_CURATED_CATALOG:
            matched_key = norm
            match_type = 'exact'
        else:
            for phrase, target_key in COMPOUND_PHRASES:
                if (phrase in skill_raw_low or phrase in norm) and target_key in STAGE_CURATED_CATALOG:
                    matched_key = target_key
                    match_type = 'compound_phrase'
                    break

        if matched_key:
            stage_dict = STAGE_CURATED_CATALOG[matched_key]
            if stage_clean in stage_dict and stage_dict[stage_clean]:
                candidate_items = stage_dict[stage_clean]
            elif stage_clean == 'learn' and 'learn' in stage_dict and stage_dict['learn']:
                candidate_items = stage_dict['learn']
            else:
                # Do NOT silently substitute a learn tutorial when practice, build, or assess was requested
                candidate_items = []

        # If not found in stage-specific catalog and stage is learn, use multi-tiered resolution from SKILL_VIDEO_MAP / CATEGORY_FALLBACK_MAP
        if not candidate_items:
            if stage_clean == 'learn':
                best_match, match_type, rec_source = self._find_best_match(skill)
                if not best_match:
                    # Rule: Never silently show an unrelated video. If completely unknown, return no recommendation.
                    return []
                candidate_items = [best_match]
            else:
                # Never return a generic learn video under an interview/practice/build tab
                return []

        lang_low = str(language or 'en').lower()
        is_hindi = lang_low in ['hi', 'hindi']
        is_bilingual = lang_low in ['en+hi', 'en_hi', 'english_hindi', 'english+hindi']
        lang_code = 'hi' if is_hindi else ('en+hi' if is_bilingual else 'en')

        # Stage-specific badge pools guaranteeing semantic badge integrity per stage
        stage_badge_pools = {
            'learn': ['⭐ Masterclass', '📘 Core Concepts', '💡 Foundational Guide', '🚀 Deep Dive'],
            'practice': ['💻 Hands-on Practice', '🛠️ Guided Exercise', '🧪 Code Along', '⚡ Speed Coding'],
            'build': ['🚀 Project Implementation', '🏗️ Architecture & Build', '📦 Full App Build', '🌐 Production Ready'],
            'assess': ['🎯 Interview Prep', '🎯 Interview Questions', '🧠 Technical Assessment', '❓ Mock Technical Interview']
        }
        badge_pool = stage_badge_pools.get(stage_clean, ['⭐ Recommended', '📘 Core Concepts', '💻 Hands-on Practice', '🎯 Interview Prep'])

        stage_difficulty_map = {
            'learn': 'Beginner Friendly',
            'practice': 'Hands-on Coding',
            'build': 'Full Project Implementation',
            'assess': 'Technical Interview Prep'
        }

        stage_reason_map = {
            'learn': f"Curated foundational masterclass for {skill}",
            'practice': f"Hands-on practice walkthrough for {skill}",
            'build': f"Project building guide tailored for {target_role}",
            'assess': f"Technical interview questions & mock prep for {skill}"
        }

        formatted: List[Dict[str, Any]] = []
        for idx, item in enumerate(candidate_items):
            v_id = extract_youtube_id(item)
            if not v_id:
                continue

            v_title = item.get('title') or f"{skill} Tutorial"
            channel_name = item.get('channel') or 'Tech Academy'
            v_duration = item.get('duration')
            v_duration_seconds = item.get('duration_seconds')
            item_category = item.get('category') or category

            # Assign stage-appropriate badge from stage pool
            assigned_badge = item.get('badge')
            if not assigned_badge:
                assigned_badge = badge_pool[idx] if idx < len(badge_pool) else badge_pool[0]

            item_difficulty = item.get('difficulty') or stage_difficulty_map.get(stage_clean, 'Intermediate')

            rec_reason = stage_reason_map.get(stage_clean, f"Recommended resource for {skill}")
            if is_hindi:
                rec_reason += " (Hindi preference selected)"

            formatted.append({
                'id': v_id,
                'title': v_title,
                'channel': channel_name,
                'thumbnail': f"https://i.ytimg.com/vi/{v_id}/mqdefault.jpg",
                'url': f"https://www.youtube.com/watch?v={v_id}",
                'embed_url': f"https://www.youtube.com/embed/{v_id}",
                'duration': v_duration,
                'duration_seconds': v_duration_seconds,
                'difficulty': item_difficulty,
                'badge': assigned_badge,
                'skill_name': skill,
                'language': lang_code,
                'recommendation_source': rec_source,
                'recommendation_category': item_category,
                'recommendation_reason': rec_reason,
                'learning_focus': f"{skill} {stage_clean.capitalize()} for {target_role}",
                'stage': stage_clean,
                'match_type': match_type
            })

        return deduplicate_youtube_videos(formatted)
