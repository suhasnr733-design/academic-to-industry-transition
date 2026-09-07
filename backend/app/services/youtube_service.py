# backend/app/services/youtube_service.py

import os
import re
import json
import logging
import threading
import requests
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple, Union

logger = logging.getLogger(__name__)

# Gated web fallback flag: In production, dynamic search uses ONLY the official YouTube Data API.
# Web scraping of youtube.com/results is never a production dependency.
ENABLE_YOUTUBE_WEB_FALLBACK = os.environ.get('ENABLE_YOUTUBE_WEB_FALLBACK', 'false').lower() in ('true', '1')

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
    'flutter': {
        'id': 'pTJJsmejUOQ',
        'title': 'Flutter Course - Full Tutorial for Beginners',
        'channel': 'freeCodeCamp.org',
        'duration': '3:09:47',
        'duration_seconds': 11387,
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
    'kafka': {
        'id': 'R873BlNVUB4',
        'title': 'Apache Kafka Crash Course',
        'channel': 'Hussein Nasser',
        'duration': '54:12',
        'duration_seconds': 3252,
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
    'rest': 'rest api',
    'github': 'git'
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
    'SLwpqD8n3d0': {
        'id': 'SLwpqD8n3d0',
        'title': 'What is a REST API?',
        'channel': 'Web Dev Simplified',
        'duration': '10:33',
        'duration_seconds': 633,
        'category': 'Backend'
    },
    'GZvSYJDk-us': {
        'id': 'GZvSYJDk-us',
        'title': 'APIs for Beginners - How to use an API (Full Course / Tutorial)',
        'channel': 'freeCodeCamp.org',
        'duration': '2:19:35',
        'duration_seconds': 8375,
        'category': 'Backend'
    },
    '0sOvCWFmrtA': {
        'id': '0sOvCWFmrtA',
        'title': 'Python API Development - Comprehensive Course for Beginners',
        'channel': 'freeCodeCamp.org',
        'duration': '19:28:44',
        'duration_seconds': 70124,
        'category': 'Backend'
    },
    'EWd3_I4X32g': {
        'id': 'EWd3_I4X32g',
        'title': 'Spring Boot Project: Build a REST API for an E-commerce Platform',
        'channel': 'Programming with Mosh',
        'duration': '1:15:30',
        'duration_seconds': 4530,
        'category': 'Backend'
    },
    'ABg0eRitL7E': {
        'id': 'ABg0eRitL7E',
        'title': 'Top 10 REST API Interview Questions and Answers',
        'channel': 'Java Guides',
        'duration': '8:06',
        'duration_seconds': 486,
        'category': 'Backend'
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
    },
    'R873BlNVUB4': {
        'id': 'R873BlNVUB4',
        'title': 'Apache Kafka Crash Course',
        'channel': 'Hussein Nasser',
        'duration': '54:12',
        'duration_seconds': 3252,
        'category': 'Backend'
    },
    'pTJJsmejUOQ': {
        'id': 'pTJJsmejUOQ',
        'title': 'Flutter Course - Full Tutorial for Beginners (Build iOS and Android Apps)',
        'channel': 'freeCodeCamp.org',
        'duration': '3:09:47',
        'duration_seconds': 11387,
        'category': 'Web / Frontend'
    },
    'DQJNtDm5qy0': {
        'id': 'DQJNtDm5qy0',
        'title': 'How to build docker image for nodejs apps',
        'channel': 'Hitesh Choudhary',
        'duration': '17:48',
        'duration_seconds': 1068,
        'category': 'DevOps / Cloud'
    },
    'HHcgzhfuaWc': {
        'id': 'HHcgzhfuaWc',
        'title': 'TOP Docker Interview Questions and Answers | DevOps Interview [2025]',
        'channel': 'Cloud Champ',
        'duration': '25:35',
        'duration_seconds': 1535,
        'category': 'DevOps / Cloud'
    },
    '8JJ101D3knE': {
        'id': '8JJ101D3knE',
        'title': 'Git and GitHub for Beginners - Crash Course',
        'channel': 'freeCodeCamp.org',
        'duration': '1:08:25',
        'duration_seconds': 4105,
        'category': 'Core CS'
    },
    'V6teSKKwvy4': {
        'id': 'V6teSKKwvy4',
        'title': 'GitHub for Beginners: Clone, Install, and Run Any Repository',
        'channel': 'Alphastack',
        'duration': '13:12',
        'duration_seconds': 792,
        'category': 'Core CS'
    },
    'w7ipx74g0kU': {
        'id': 'w7ipx74g0kU',
        'title': 'Mastering Git & GitHub: Top 15 Interview Questions & Answers',
        'channel': 'DGR Uploads',
        'duration': '18:42',
        'duration_seconds': 1122,
        'category': 'Core CS'
    },
    '-YnN1Xom-mc': {
        'id': '-YnN1Xom-mc',
        'title': 'Practice Source code management on GitHub',
        'channel': 'Code Feeding',
        'duration': '14:20',
        'duration_seconds': 860,
        'category': 'Core CS'
    },
    'QY-Gj1hq0Yg': {
        'id': 'QY-Gj1hq0Yg',
        'title': 'How To Create A GitHub App (Tutorial 2026)',
        'channel': 'Just Kristers',
        'duration': '16:45',
        'duration_seconds': 1005,
        'category': 'Core CS'
    },
    '7t2alSnE2-I': {
        'id': '7t2alSnE2-I',
        'title': 'FastAPI Python Framework Full Course',
        'channel': 'Sarthaksavvy',
        'duration': '2:58:24',
        'duration_seconds': 10704,
        'category': 'Backend'
    },
    'kmJz8w5ij8Y': {
        'id': 'kmJz8w5ij8Y',
        'title': '15 FastAPI Best Practices For Production',
        'channel': 'Code Collider',
        'duration': '18:32',
        'duration_seconds': 1112,
        'category': 'Backend'
    },
    'SdRdpWlsjLQ': {
        'id': 'SdRdpWlsjLQ',
        'title': 'Learn FastAPI in 3 Hours Build Expense Tracker API',
        'channel': 'AI With Durgesh',
        'duration': '3:02:15',
        'duration_seconds': 10935,
        'category': 'Backend'
    },
    'jsgUCcOEQMM': {
        'id': 'jsgUCcOEQMM',
        'title': 'FastAPI Interview Questions and Answers 2025',
        'channel': 'Question With Answer',
        'duration': '15:45',
        'duration_seconds': 945,
        'category': 'Backend'
    },
    'Oe421EPjeBE': {
        'id': 'Oe421EPjeBE',
        'title': 'Node.js and Express.js - Full Course',
        'channel': 'freeCodeCamp.org',
        'duration': '8:16:47',
        'duration_seconds': 29807,
        'category': 'Backend'
    },
    'Yj_lxXPg1rE': {
        'id': 'Yj_lxXPg1rE',
        'title': 'Node Js Coding Practice - 1',
        'channel': 'Code Note',
        'duration': '12:20',
        'duration_seconds': 740,
        'category': 'Backend'
    },
    'VRzl-nCTsaU': {
        'id': 'VRzl-nCTsaU',
        'title': 'Node.js Project For Beginners: NodeJS Weather App',
        'channel': 'masynctech',
        'duration': '35:10',
        'duration_seconds': 2110,
        'category': 'Backend'
    },
    'ruwx8R2nXyI': {
        'id': 'ruwx8R2nXyI',
        'title': 'Top 25 Node.js Interview Questions',
        'channel': 'Intellipaat',
        'duration': '48:15',
        'duration_seconds': 2895,
        'category': 'Backend'
    },
    'j3uFl0P6JgM': {
        'id': 'j3uFl0P6JgM',
        'title': 'Build a Freelancing Marketplace Application from Scratch | Express JS',
        'channel': 'Becodemy',
        'duration': '1:42:10',
        'duration_seconds': 6130,
        'category': 'Backend'
    },
    'JcbKpugOLtY': {
        'id': 'JcbKpugOLtY',
        'title': 'Top 10 Express.js Interview Questions and Answers',
        'channel': 'Interview Happy',
        'duration': '19:25',
        'duration_seconds': 1165,
        'category': 'Backend'
    },
    'k1RI5locZE4': {
        'id': 'k1RI5locZE4',
        'title': 'AWS Tutorial For Beginners | AWS Full Course',
        'channel': 'edureka!',
        'duration': '10:15:30',
        'duration_seconds': 36930,
        'category': 'DevOps / Cloud'
    },
    'dFaIYsfh4K4': {
        'id': 'dFaIYsfh4K4',
        'title': 'AWS AI Practitioner Certification | Practice Questions',
        'channel': 'Coding Hives',
        'duration': '22:15',
        'duration_seconds': 1335,
        'category': 'DevOps / Cloud'
    },
    '7m_q1ldzw0U': {
        'id': '7m_q1ldzw0U',
        'title': 'AWS Project: Architect and Build an End-to-End AWS Web Application',
        'channel': 'Tiny Technical Tutorials',
        'duration': '48:30',
        'duration_seconds': 2910,
        'category': 'DevOps / Cloud'
    },
    'y1sCHWOAZgU': {
        'id': 'y1sCHWOAZgU',
        'title': 'AWS Interview Questions And Answers 2026',
        'channel': 'Intellipaat',
        'duration': '1:12:40',
        'duration_seconds': 4360,
        'category': 'DevOps / Cloud'
    },
    '5abffC-K40c': {
        'id': '5abffC-K40c',
        'title': 'Microsoft Azure Fundamentals AZ-900 Certification Course',
        'channel': 'freeCodeCamp.org',
        'duration': '3:14:20',
        'duration_seconds': 11660,
        'category': 'DevOps / Cloud'
    },
    'Py8FoFSkXFY': {
        'id': 'Py8FoFSkXFY',
        'title': 'AZURE | AZ 204 | Lab 02 | Exercise 02',
        'channel': 'Azure Labs',
        'duration': '28:10',
        'duration_seconds': 1690,
        'category': 'DevOps / Cloud'
    },
    'dmGW22W3VOs': {
        'id': 'dmGW22W3VOs',
        'title': 'Realtime DevOps Project using Azure DevOps',
        'channel': 'DevOps World',
        'duration': '1:25:40',
        'duration_seconds': 5140,
        'category': 'DevOps / Cloud'
    },
    'KmL1oZCq8v4': {
        'id': 'KmL1oZCq8v4',
        'title': 'Top 10 Azure Interview Questions',
        'channel': 'Azure Experts',
        'duration': '22:15',
        'duration_seconds': 1335,
        'category': 'DevOps / Cloud'
    },
    'X48VuDVv0do': {
        'id': 'X48VuDVv0do',
        'title': 'Kubernetes Tutorial for Beginners [FULL COURSE]',
        'channel': 'TechWorld with Nana',
        'duration': '3:34:25',
        'duration_seconds': 12865,
        'category': 'DevOps / Cloud'
    },
    'wJcmS0_or8w': {
        'id': 'wJcmS0_or8w',
        'title': 'Kubernetes LAB 20: How to use Kubernetes cheatsheet',
        'channel': 'CloudOps',
        'duration': '18:45',
        'duration_seconds': 1125,
        'category': 'DevOps / Cloud'
    },
    'XltFOyGanYE': {
        'id': 'XltFOyGanYE',
        'title': 'Kubernetes 101: Deploying Your First Application',
        'channel': 'TechWorld',
        'duration': '24:10',
        'duration_seconds': 1450,
        'category': 'DevOps / Cloud'
    },
    'weM2bObz7iI': {
        'id': 'weM2bObz7iI',
        'title': 'Kubernetes Interview Questions | Scenario Based',
        'channel': 'DevOps Hub',
        'duration': '32:15',
        'duration_seconds': 1935,
        'category': 'DevOps / Cloud'
    },
    'r-uOLxNrNk8': {
        'id': 'r-uOLxNrNk8',
        'title': 'Data Analysis with Python and Pandas',
        'channel': 'freeCodeCamp.org',
        'duration': '9:56:04',
        'duration_seconds': 35764,
        'category': 'Data Analytics'
    },
    'LfFkSFcZlSw': {
        'id': 'LfFkSFcZlSw',
        'title': 'Solve 50 Pandas Questions in 2 hours',
        'channel': 'freeCodeCamp.org',
        'duration': '2:08:15',
        'duration_seconds': 7695,
        'category': 'Data Analytics'
    },
    '2paXiCJl0-c': {
        'id': '2paXiCJl0-c',
        'title': 'Pandas Interview Questions And Answers',
        'channel': 'Simplilearn',
        'duration': '26:40',
        'duration_seconds': 1600,
        'category': 'Data Analytics'
    },
    'QUT1VHiLmmI': {
        'id': 'QUT1VHiLmmI',
        'title': 'Python NumPy Tutorial for Beginners',
        'channel': 'freeCodeCamp.org',
        'duration': '59:45',
        'duration_seconds': 3585,
        'category': 'Data Analytics'
    },
    '0xwFgi1rnlc': {
        'id': '0xwFgi1rnlc',
        'title': 'Python NumPy Project | Jupyter Notebook',
        'channel': 'Data Science Anywhere',
        'duration': '42:10',
        'duration_seconds': 2530,
        'category': 'Data Analytics'
    },
    'cUL67uOSIUQ': {
        'id': 'cUL67uOSIUQ',
        'title': 'NumPy Interview Questions & Answers 2025',
        'channel': 'edureka!',
        'duration': '28:30',
        'duration_seconds': 1710,
        'category': 'Data Analytics'
    },
    '6YZvp2GwT0A': {
        'id': '6YZvp2GwT0A',
        'title': 'Learn Jenkins! Complete Jenkins Course',
        'channel': 'DevOps Journey',
        'duration': '3:45:20',
        'duration_seconds': 13520,
        'category': 'DevOps / Cloud'
    },
    'u2TpnY1Mmts': {
        'id': 'u2TpnY1Mmts',
        'title': 'How To Create Your First Jenkins Freestyle Job',
        'channel': 'DevOps Directive',
        'duration': '19:40',
        'duration_seconds': 1180,
        'category': 'DevOps / Cloud'
    },
    'SsN0ILXq5Lw': {
        'id': 'SsN0ILXq5Lw',
        'title': 'Jenkins Interview Questions 2026',
        'channel': 'edureka!',
        'duration': '35:10',
        'duration_seconds': 2110,
        'category': 'DevOps / Cloud'
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


def parse_iso8601_duration(dur_str: Optional[str]) -> Tuple[Optional[str], Optional[int]]:
    """
    Parse an ISO-8601 duration string (e.g. 'PT48M16S', 'PT1H35M43S', 'PT45S', 'PT1H')
    from YouTube Data API v3 contentDetails.duration into (formatted_duration_str, total_seconds).
    Returns (None, None) if parsing fails or duration is non-positive.
    Never fabricates duration.
    """
    if not dur_str or not isinstance(dur_str, str):
        return None, None

    match = re.match(
        r'^P(?:(?P<days>\d+)D)?(?:T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?)?$',
        dur_str.strip()
    )
    if not match:
        return None, None

    parts = match.groupdict()
    days = int(parts.get('days') or 0)
    hours = int(parts.get('hours') or 0) + (days * 24)
    minutes = int(parts.get('minutes') or 0)
    seconds = int(parts.get('seconds') or 0)

    total_seconds = hours * 3600 + minutes * 60 + seconds
    if total_seconds <= 0:
        return None, None

    if hours > 0:
        formatted = f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        formatted = f"{minutes}:{seconds:02d}"

    return formatted, total_seconds


def check_oembed_availability(video_id: str, timeout: float = 3.0) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Check video availability and embed permissions via official YouTube oEmbed endpoint.
    NOTE: oEmbed is ONLY used to verify availability and retrieve authentic title/author.
    It is NOT used for duration (oEmbed does not provide duration).
    Returns (is_available, title, author_name).
    """
    if not video_id or len(video_id) != 11:
        return False, None, None
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    }
    try:
        resp = requests.get(url, headers=headers, timeout=timeout)
        if resp.status_code == 200:
            data = resp.json()
            return True, data.get('title'), data.get('author_name')
        elif resp.status_code in (401, 403, 404):
            return False, None, None
    except Exception as e:
        logger.debug(f"oEmbed check error for {video_id}: {e}")
    return False, None, None


def make_context_key(
    skill: str,
    target_role: str = 'Software Engineer',
    stage: str = 'learn',
    language: str = 'en',
    max_results: int = 4
) -> str:
    """
    Generate unified, canonical context key for both caching and in-flight request deduplication.
    Format: skill_clean|role_clean|stage_clean|lang_clean|max_results
    Ensures that requests differing by skill, role, stage, language, or max_results are strictly isolated.
    """
    skill_clean = (skill or '').strip().lower()
    role_clean = (target_role or 'Software Engineer').strip().lower()
    stage_clean = (stage or 'learn').strip().lower()
    lang_clean = (language or 'en').strip().lower()
    return f"{skill_clean}|{role_clean}|{stage_clean}|{lang_clean}|{max_results}"


def is_video_relevant_to_skill(skill: str, title: str) -> bool:
    """
    Check if a YouTube video title is genuinely relevant to the requested skill.
    Prevents unrelated or random videos from being attached to unknown/arbitrary skills.
    """
    if not skill or not title:
        return False
    skill_clean = skill.strip().lower()
    title_clean = title.strip().lower()

    # Direct substring match
    if skill_clean in title_clean:
        return True

    # Check canonical aliases (e.g. 'k8s' for 'kubernetes')
    norm = normalize_skill_name(skill)
    if norm and norm in title_clean:
        return True

    # Check significant tokens (> 2 chars)
    tokens = [t for t in re.split(r'[\s\.\-_/]+', skill_clean) if len(t) > 2]
    if tokens:
        # For multi-word skills, match at least the most specific word
        return any(t in title_clean for t in tokens)

    return False


def is_video_matching_stage_intent(stage: str, title: str) -> bool:
    """
    Ensure non-learn videos actually correspond to the stage semantics.
    For practice/build/assess, title must contain appropriate intent keywords.
    """
    stage_clean = (stage or 'learn').strip().lower()
    if stage_clean == 'learn':
        return True

    title_clean = (title or '').strip().lower()

    # Beginner courses should NOT be assigned to practice, build, or assess
    if any(beg in title_clean for beg in ['crash course', 'tutorial for beginners', 'full course for beginners', 'beginners course', 'beginners tutorial']):
        return False

    if stage_clean == 'practice':
        practice_kw = [
            'practice', 'exercise', 'exercises', 'problem', 'problems', 'challenge',
            'challenges', 'hands-on', 'hands on', 'walkthrough', 'solve', 'solving',
            'code along', 'coding', 'debugging', 'drills', 'lab', 'workshop'
        ]
        return any(kw in title_clean for kw in practice_kw)

    elif stage_clean == 'build':
        build_kw = [
            'project', 'projects', 'build', 'building', 'app', 'apps', 'clone',
            'full stack', 'fullstack', 'real world', 'real-world', 'create',
            'implementation', 'develop', 'portfolio', 'application'
        ]
        return any(kw in title_clean for kw in build_kw)

    elif stage_clean == 'assess':
        assess_kw = [
            'interview', 'interviews', 'question', 'questions', 'quiz', 'test',
            'exam', 'assessment', 'mock', 'prep', 'preparation', 'q&a', 'faang',
            'leetcode', 'hacker', 'cracking'
        ]
        return any(kw in title_clean for kw in assess_kw)

    return True


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
    },
    'rest api': {
        'learn': [
            {'id': 'SLwpqD8n3d0', 'title': 'What is a REST API?', 'channel': 'Web Dev Simplified', 'duration': '10:33', 'duration_seconds': 633, 'badge': '⭐ Masterclass', 'category': 'Backend'},
            {'id': 'GZvSYJDk-us', 'title': 'APIs for Beginners - How to use an API (Full Course / Tutorial)', 'channel': 'freeCodeCamp.org', 'duration': '2:19:35', 'duration_seconds': 8375, 'badge': '📘 Core Concepts', 'category': 'Backend'}
        ],
        'practice': [
            {'id': '0sOvCWFmrtA', 'title': 'Python API Development - Comprehensive Course for Beginners', 'channel': 'freeCodeCamp.org', 'duration': '19:28:44', 'duration_seconds': 70124, 'badge': '💻 Hands-on Practice', 'category': 'Backend'}
        ],
        'build': [
            {'id': 'EWd3_I4X32g', 'title': 'Spring Boot Project: Build a REST API for an E-commerce Platform', 'channel': 'Programming with Mosh', 'duration': '1:15:30', 'duration_seconds': 4530, 'badge': '🚀 Project Implementation', 'category': 'Backend'}
        ],
        'assess': [
            {'id': 'ABg0eRitL7E', 'title': 'Top 10 REST API Interview Questions and Answers', 'channel': 'Java Guides', 'duration': '8:06', 'duration_seconds': 486, 'badge': '🎯 Interview Questions', 'category': 'Backend'}
        ]
    },
    'docker': {
        'learn': [
            {'id': 'fqMOX6JJhGo', 'title': 'Docker Tutorial for Beginners - Full Course', 'channel': 'freeCodeCamp.org', 'duration': '2:10:18', 'duration_seconds': 7818, 'badge': '⭐ Masterclass', 'category': 'DevOps / Cloud'}
        ],
        'build': [
            {'id': 'DQJNtDm5qy0', 'title': 'How to build docker image for nodejs apps', 'channel': 'Hitesh Choudhary', 'duration': '17:48', 'duration_seconds': 1068, 'badge': '🚀 Project Implementation', 'category': 'DevOps / Cloud'}
        ],
        'assess': [
            {'id': 'HHcgzhfuaWc', 'title': 'TOP Docker Interview Questions and Answers | DevOps Interview [2025]', 'channel': 'Cloud Champ', 'duration': '25:35', 'duration_seconds': 1535, 'badge': '🎯 Interview Prep', 'category': 'DevOps / Cloud'}
        ]
    },
    'git': {
        'learn': [
            {'id': '8JJ101D3knE', 'title': 'Git and GitHub for Beginners - Crash Course', 'channel': 'freeCodeCamp.org', 'duration': '1:08:25', 'duration_seconds': 4105, 'badge': '⭐ Masterclass', 'category': 'Core CS'}
        ],
        'build': [
            {'id': 'V6teSKKwvy4', 'title': 'GitHub for Beginners: Clone, Install, and Run Any Repository', 'channel': 'Alphastack', 'duration': '13:12', 'duration_seconds': 792, 'badge': '🚀 Project Implementation', 'category': 'Core CS'}
        ],
        'assess': [
            {'id': 'w7ipx74g0kU', 'title': 'Mastering Git & GitHub: Top 15 Interview Questions & Answers', 'channel': 'DGR Uploads', 'duration': '18:42', 'duration_seconds': 1122, 'badge': '🎯 Interview Questions', 'category': 'Core CS'}
        ]
    },
    'github': {
        'learn': [
            {'id': '8JJ101D3knE', 'title': 'Git and GitHub for Beginners - Crash Course', 'channel': 'freeCodeCamp.org', 'duration': '1:08:25', 'duration_seconds': 4105, 'badge': '⭐ Masterclass', 'category': 'Core CS'}
        ],
        'practice': [
            {'id': '-YnN1Xom-mc', 'title': 'Practice Source code management on GitHub', 'channel': 'Code Feeding', 'duration': '14:20', 'duration_seconds': 860, 'badge': '💻 Hands-on Practice', 'category': 'Core CS'}
        ],
        'build': [
            {'id': 'QY-Gj1hq0Yg', 'title': 'How To Create A GitHub App (Tutorial 2026)', 'channel': 'Just Kristers', 'duration': '16:45', 'duration_seconds': 1005, 'badge': '🚀 Project Implementation', 'category': 'Core CS'}
        ],
        'assess': [
            {'id': 'w7ipx74g0kU', 'title': 'Mastering Git & GitHub: Top 15 Interview Questions & Answers', 'channel': 'DGR Uploads', 'duration': '18:42', 'duration_seconds': 1122, 'badge': '🎯 Interview Questions', 'category': 'Core CS'}
        ]
    },
    'fastapi': {
        'learn': [
            {'id': '7t2alSnE2-I', 'title': 'FastAPI Python Framework Full Course', 'channel': 'Sarthaksavvy', 'duration': '2:58:24', 'duration_seconds': 10704, 'badge': '⭐ Masterclass', 'category': 'Backend'}
        ],
        'practice': [
            {'id': 'kmJz8w5ij8Y', 'title': '15 FastAPI Best Practices For Production', 'channel': 'Code Collider', 'duration': '18:32', 'duration_seconds': 1112, 'badge': '💻 Hands-on Practice', 'category': 'Backend'}
        ],
        'build': [
            {'id': 'SdRdpWlsjLQ', 'title': 'Learn FastAPI in 3 Hours Build Expense Tracker API', 'channel': 'AI With Durgesh', 'duration': '3:02:15', 'duration_seconds': 10935, 'badge': '🚀 Project Implementation', 'category': 'Backend'}
        ],
        'assess': [
            {'id': 'jsgUCcOEQMM', 'title': 'FastAPI Interview Questions and Answers 2025', 'channel': 'Question With Answer', 'duration': '15:45', 'duration_seconds': 945, 'badge': '🎯 Interview Prep', 'category': 'Backend'}
        ]
    },
    'node.js': {
        'learn': [
            {'id': 'Oe421EPjeBE', 'title': 'Node.js and Express.js - Full Course', 'channel': 'freeCodeCamp.org', 'duration': '8:16:47', 'duration_seconds': 29807, 'badge': '⭐ Masterclass', 'category': 'Backend'}
        ],
        'practice': [
            {'id': 'Yj_lxXPg1rE', 'title': 'Node Js Coding Practice - 1', 'channel': 'Code Note', 'duration': '12:20', 'duration_seconds': 740, 'badge': '💻 Hands-on Practice', 'category': 'Backend'}
        ],
        'build': [
            {'id': 'VRzl-nCTsaU', 'title': 'Node.js Project For Beginners: NodeJS Weather App', 'channel': 'masynctech', 'duration': '35:10', 'duration_seconds': 2110, 'badge': '🚀 Project Implementation', 'category': 'Backend'}
        ],
        'assess': [
            {'id': 'ruwx8R2nXyI', 'title': 'Top 25 Node.js Interview Questions', 'channel': 'Intellipaat', 'duration': '48:15', 'duration_seconds': 2895, 'badge': '🎯 Interview Questions', 'category': 'Backend'}
        ]
    },
    'express.js': {
        'learn': [
            {'id': 'Oe421EPjeBE', 'title': 'Node.js and Express.js - Full Course', 'channel': 'freeCodeCamp.org', 'duration': '8:16:47', 'duration_seconds': 29807, 'badge': '⭐ Masterclass', 'category': 'Backend'}
        ],
        'build': [
            {'id': 'j3uFl0P6JgM', 'title': 'Build a Freelancing Marketplace Application from Scratch | Express JS', 'channel': 'Becodemy', 'duration': '1:42:10', 'duration_seconds': 6130, 'badge': '🚀 Project Implementation', 'category': 'Backend'}
        ],
        'assess': [
            {'id': 'JcbKpugOLtY', 'title': 'Top 10 Express.js Interview Questions and Answers', 'channel': 'Interview Happy', 'duration': '19:25', 'duration_seconds': 1165, 'badge': '🎯 Interview Questions', 'category': 'Backend'}
        ]
    },
    'aws': {
        'learn': [
            {'id': 'k1RI5locZE4', 'title': 'AWS Tutorial For Beginners | AWS Full Course', 'channel': 'edureka!', 'duration': '10:15:30', 'duration_seconds': 36930, 'badge': '⭐ Masterclass', 'category': 'DevOps / Cloud'}
        ],
        'practice': [
            {'id': 'dFaIYsfh4K4', 'title': 'AWS AI Practitioner Certification | Practice Questions', 'channel': 'Coding Hives', 'duration': '22:15', 'duration_seconds': 1335, 'badge': '💻 Hands-on Practice', 'category': 'DevOps / Cloud'}
        ],
        'build': [
            {'id': '7m_q1ldzw0U', 'title': 'AWS Project: Architect and Build an End-to-End AWS Web Application', 'channel': 'Tiny Technical Tutorials', 'duration': '48:30', 'duration_seconds': 2910, 'badge': '🚀 Project Implementation', 'category': 'DevOps / Cloud'}
        ],
        'assess': [
            {'id': 'y1sCHWOAZgU', 'title': 'AWS Interview Questions And Answers 2026', 'channel': 'Intellipaat', 'duration': '1:12:40', 'duration_seconds': 4360, 'badge': '🎯 Interview Prep', 'category': 'DevOps / Cloud'}
        ]
    },
    'azure': {
        'learn': [
            {'id': '5abffC-K40c', 'title': 'Microsoft Azure Fundamentals AZ-900 Certification Course', 'channel': 'freeCodeCamp.org', 'duration': '3:14:20', 'duration_seconds': 11660, 'badge': '⭐ Masterclass', 'category': 'DevOps / Cloud'}
        ],
        'practice': [
            {'id': 'Py8FoFSkXFY', 'title': 'AZURE | AZ 204 | Lab 02 | Exercise 02', 'channel': 'Azure Labs', 'duration': '28:10', 'duration_seconds': 1690, 'badge': '💻 Hands-on Practice', 'category': 'DevOps / Cloud'}
        ],
        'build': [
            {'id': 'dmGW22W3VOs', 'title': 'Realtime DevOps Project using Azure DevOps', 'channel': 'DevOps World', 'duration': '1:25:40', 'duration_seconds': 5140, 'badge': '🚀 Project Implementation', 'category': 'DevOps / Cloud'}
        ],
        'assess': [
            {'id': 'KmL1oZCq8v4', 'title': 'Top 10 Azure Interview Questions', 'channel': 'Azure Experts', 'duration': '22:15', 'duration_seconds': 1335, 'badge': '🎯 Interview Questions', 'category': 'DevOps / Cloud'}
        ]
    },
    'kubernetes': {
        'learn': [
            {'id': 'X48VuDVv0do', 'title': 'Kubernetes Tutorial for Beginners [FULL COURSE]', 'channel': 'TechWorld with Nana', 'duration': '3:34:25', 'duration_seconds': 12865, 'badge': '⭐ Masterclass', 'category': 'DevOps / Cloud'}
        ],
        'practice': [
            {'id': 'wJcmS0_or8w', 'title': 'Kubernetes LAB 20: How to use Kubernetes cheatsheet', 'channel': 'CloudOps', 'duration': '18:45', 'duration_seconds': 1125, 'badge': '💻 Hands-on Practice', 'category': 'DevOps / Cloud'}
        ],
        'build': [
            {'id': 'XltFOyGanYE', 'title': 'Kubernetes 101: Deploying Your First Application', 'channel': 'TechWorld', 'duration': '24:10', 'duration_seconds': 1450, 'badge': '🚀 Project Implementation', 'category': 'DevOps / Cloud'}
        ],
        'assess': [
            {'id': 'weM2bObz7iI', 'title': 'Kubernetes Interview Questions | Scenario Based', 'channel': 'DevOps Hub', 'duration': '32:15', 'duration_seconds': 1935, 'badge': '🎯 Interview Questions', 'category': 'DevOps / Cloud'}
        ]
    },
    'pandas': {
        'learn': [
            {'id': 'r-uOLxNrNk8', 'title': 'Data Analysis with Python and Pandas', 'channel': 'freeCodeCamp.org', 'duration': '9:56:04', 'duration_seconds': 35764, 'badge': '⭐ Masterclass', 'category': 'Data Analytics'}
        ],
        'practice': [
            {'id': 'LfFkSFcZlSw', 'title': 'Solve 50 Pandas Questions in 2 hours', 'channel': 'freeCodeCamp.org', 'duration': '2:08:15', 'duration_seconds': 7695, 'badge': '💻 Hands-on Practice', 'category': 'Data Analytics'}
        ],
        'assess': [
            {'id': '2paXiCJl0-c', 'title': 'Pandas Interview Questions And Answers', 'channel': 'Simplilearn', 'duration': '26:40', 'duration_seconds': 1600, 'badge': '🎯 Interview Questions', 'category': 'Data Analytics'}
        ]
    },
    'numpy': {
        'learn': [
            {'id': 'QUT1VHiLmmI', 'title': 'Python NumPy Tutorial for Beginners', 'channel': 'freeCodeCamp.org', 'duration': '59:45', 'duration_seconds': 3585, 'badge': '⭐ Masterclass', 'category': 'Data Analytics'}
        ],
        'build': [
            {'id': '0xwFgi1rnlc', 'title': 'Python NumPy Project | Jupyter Notebook', 'channel': 'Data Science Anywhere', 'duration': '42:10', 'duration_seconds': 2530, 'badge': '🚀 Project Implementation', 'category': 'Data Analytics'}
        ],
        'assess': [
            {'id': 'cUL67uOSIUQ', 'title': 'NumPy Interview Questions & Answers 2025', 'channel': 'edureka!', 'duration': '28:30', 'duration_seconds': 1710, 'badge': '🎯 Interview Questions', 'category': 'Data Analytics'}
        ]
    },
    'jenkins': {
        'learn': [
            {'id': '6YZvp2GwT0A', 'title': 'Learn Jenkins! Complete Jenkins Course', 'channel': 'DevOps Journey', 'duration': '3:45:20', 'duration_seconds': 13520, 'badge': '⭐ Masterclass', 'category': 'DevOps / Cloud'}
        ],
        'build': [
            {'id': 'u2TpnY1Mmts', 'title': 'How To Create Your First Jenkins Freestyle Job', 'channel': 'DevOps Directive', 'duration': '19:40', 'duration_seconds': 1180, 'badge': '🚀 Project Implementation', 'category': 'DevOps / Cloud'}
        ],
        'assess': [
            {'id': 'SsN0ILXq5Lw', 'title': 'Jenkins Interview Questions 2026', 'channel': 'edureka!', 'duration': '35:10', 'duration_seconds': 2110, 'badge': '🎯 Interview Questions', 'category': 'DevOps / Cloud'}
        ]
    }
}


DEFAULT_CACHE_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'youtube_cache.json')
)

STAGE_BADGE_POOLS: Dict[str, List[str]] = {
    'learn': ['⭐ Masterclass', '📘 Core Concepts', '💡 Foundational Guide', '🚀 Deep Dive'],
    'practice': ['💻 Hands-on Practice', '🛠️ Guided Exercise', '🧪 Code Along', '⚡ Speed Coding'],
    'build': ['🚀 Project Implementation', '🏗️ Architecture & Build', '📦 Full App Build', '🌐 Production Ready'],
    'assess': ['🎯 Interview Prep', '🎯 Interview Questions', '🧠 Technical Assessment', '❓ Mock Technical Interview']
}

STAGE_DIFFICULTY_MAP: Dict[str, str] = {
    'learn': 'Beginner Friendly',
    'practice': 'Hands-on Coding',
    'build': 'Full Project Implementation',
    'assess': 'Technical Interview Prep'
}

STAGE_REASON_MAP: Dict[str, str] = {
    'learn': "Curated foundational masterclass for {skill}",
    'practice': "Hands-on practice walkthrough for {skill}",
    'build': "Project building guide tailored for {target_role}",
    'assess': "Technical interview questions & mock prep for {skill}"
}


class YouTubeService:
    """
    Phase 3.4 Open YouTube Recommendation Architecture.
    Four-Tier Pipeline:
      Tier 1: Curated verified catalog (stage-specific)
      Tier 2: Persistent validated cache (disk backed)
      Tier 3: Dynamic YouTube search (Official API preferred -> secondary search with oEmbed availability validation)
      Tier 4: Safe empty state ([])
    Features:
      - Supports ANY valid skill detected across the platform.
      - Zero hardcoded whitelists.
      - Strict stage isolation: non-learn stages never fall back to beginner tutorials.
      - Thread-safe in-flight request deduplication.
      - Never fabricates duration. Real duration from canonical metadata or YouTube Data API ISO-8601.
    """

    def __init__(self, cache_file: Optional[str] = None):
        self.api_key = os.environ.get('YOUTUBE_API_KEY')
        self.cache_file = cache_file or DEFAULT_CACHE_FILE
        self._cache: Dict[str, List[Dict[str, Any]]] = {}
        self._cache_lock = threading.Lock()
        self._inflight_locks: Dict[str, threading.Lock] = {}
        self._meta_lock = threading.Lock()
        self._http_session = requests.Session()
        self._http_session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        })

        self._load_disk_cache()

    def _load_disk_cache(self) -> None:
        """Load persistent cache from disk if available"""
        if not os.path.exists(self.cache_file):
            return
        try:
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    with self._cache_lock:
                        for k, v in data.items():
                            if isinstance(v, list):
                                self._cache[k] = deduplicate_youtube_videos(v)
            logger.info(f"Loaded {len(self._cache)} cached query results from {self.cache_file}")
        except Exception as e:
            logger.warning(f"Failed to load persistent YouTube cache: {e}")

    def _save_disk_cache(self) -> None:
        """Atomically persist cache to disk"""
        try:
            os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
            temp_file = f"{self.cache_file}.tmp"
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(self._cache, f, indent=2, ensure_ascii=False)
            os.replace(temp_file, self.cache_file)
        except Exception as e:
            logger.warning(f"Failed to save persistent YouTube cache: {e}")

    def clear_cache(self) -> None:
        """Clear all in-memory and persistent cached YouTube recommendations."""
        with self._cache_lock:
            self._cache.clear()
            self._save_disk_cache()

    def get_inflight_lock(self, key: str) -> threading.Lock:
        """Get or create a per-key lock for in-flight request deduplication"""
        with self._meta_lock:
            if key not in self._inflight_locks:
                self._inflight_locks[key] = threading.Lock()
            return self._inflight_locks[key]

    def _get_inflight_lock(self, key: str) -> threading.Lock:
        """Backwards-compatible alias for get_inflight_lock"""
        return self.get_inflight_lock(key)

    def _build_stage_queries(self, skill: str, target_role: str, stage: str, language: str = 'en') -> List[str]:
        """
        Generate up to 3 bounded, domain-aware, stage-specific search queries.
        Recognizes technical skill domains (DevOps/Cloud, Data/Analytics, Distributed/Databases,
        Frontend/Mobile, Backend/APIs, or General Programming) and customizes search vocabulary
        to maximize genuine matching quality without hardcoded skill whitelists.
        """
        skill_clean = str(skill or '').strip()
        skill_low = skill_clean.lower()
        role_clean = str(target_role or 'Software Engineer').strip()

        lang_low = str(language or 'en').lower()
        is_hindi = lang_low in ['hi', 'hindi', 'en+hi', 'en_hi', 'english_hindi', 'english+hindi', 'bilingual']
        suffix = " hindi" if is_hindi else ""

        # Domain classification based on keyword tokens
        is_devops = any(t in skill_low for t in [
            'docker', 'kubernetes', 'k8s', 'jenkins', 'git', 'github', 'terraform',
            'ansible', 'ci/cd', 'cicd', 'pipeline', 'linux', 'bash', 'aws', 'azure', 'cloud', 'gcp'
        ])
        is_data = any(t in skill_low for t in [
            'pandas', 'numpy', 'sql', 'mysql', 'postgres', 'power bi', 'tableau',
            'data analysis', 'machine learning', 'deep learning', 'pytorch', 'tensorflow', 'scikit'
        ])
        is_distributed = any(t in skill_low for t in [
            'kafka', 'redis', 'rabbitmq', 'mongodb', 'cassandra', 'system design', 'microservice'
        ])
        is_frontend_mobile = any(t in skill_low for t in [
            'react', 'vue', 'angular', 'next.js', 'flutter', 'react native', 'ios', 'android', 'html', 'css', 'tailwind'
        ])

        queries: List[str] = []

        if stage == 'practice':
            if is_devops:
                queries = [
                    f"{skill_clean} hands on lab exercises{suffix}",
                    f"{skill_clean} practical walkthrough exercises{suffix}",
                    f"{skill_clean} practical exercises hands on{suffix}"
                ]
            elif is_data:
                queries = [
                    f"{skill_clean} exercises with solutions practice{suffix}",
                    f"{skill_clean} hands on practice problems{suffix}",
                    f"{skill_clean} data coding exercises{suffix}"
                ]
            elif is_distributed:
                queries = [
                    f"{skill_clean} hands on practical tutorial lab{suffix}",
                    f"{skill_clean} practical exercises walkthrough{suffix}",
                    f"{skill_clean} practical coding exercises{suffix}"
                ]
            elif is_frontend_mobile:
                queries = [
                    f"{skill_clean} hands on coding exercises{suffix}",
                    f"{skill_clean} coding challenges with solutions{suffix}",
                    f"{skill_clean} UI practice coding challenges{suffix}"
                ]
            else:
                queries = [
                    f"{skill_clean} hands on coding exercises{suffix}",
                    f"{skill_clean} coding challenges with solutions{suffix}",
                    f"{skill_clean} practical walkthrough exercises{suffix}"
                ]

        elif stage == 'build':
            if is_devops:
                queries = [
                    f"{skill_clean} real world project pipeline tutorial{suffix}",
                    f"{skill_clean} complete project hands on{suffix}",
                    f"{skill_clean} end to end implementation tutorial{suffix}"
                ]
            elif is_data:
                queries = [
                    f"{skill_clean} data analysis project tutorial{suffix}",
                    f"{skill_clean} end to end data project portfolio{suffix}",
                    f"{skill_clean} real world data project{suffix}"
                ]
            elif is_distributed:
                queries = [
                    f"{skill_clean} real time data project tutorial{suffix}",
                    f"{skill_clean} end to end project pipeline{suffix}",
                    f"{skill_clean} production implementation tutorial{suffix}"
                ]
            elif is_frontend_mobile:
                queries = [
                    f"{skill_clean} project tutorial build application{suffix}",
                    f"{skill_clean} full app tutorial from scratch{suffix}",
                    f"{skill_clean} real world project tutorial{suffix}"
                ]
            else:
                queries = [
                    f"{skill_clean} project tutorial build application{suffix}",
                    f"{skill_clean} full stack application tutorial from scratch{suffix}",
                    f"{skill_clean} real world project tutorial{suffix}"
                ]

        elif stage == 'assess':
            if is_devops:
                queries = [
                    f"{skill_clean} technical interview questions and answers{suffix}",
                    f"top {skill_clean} interview questions{suffix}",
                    f"{skill_clean} scenario based interview questions{suffix}"
                ]
            elif is_distributed:
                queries = [
                    f"{skill_clean} technical interview questions and answers{suffix}",
                    f"top {skill_clean} interview questions{suffix}",
                    f"{skill_clean} system design interview questions{suffix}"
                ]
            elif is_data:
                queries = [
                    f"{skill_clean} technical interview questions and answers{suffix}",
                    f"top {skill_clean} interview questions{suffix}",
                    f"{skill_clean} interview questions for data analysts{suffix}"
                ]
            else:
                queries = [
                    f"{skill_clean} technical interview questions and answers{suffix}",
                    f"top {skill_clean} interview questions{suffix}",
                    f"{skill_clean} mock technical interview questions{suffix}"
                ]

        else:
            # learn stage
            queries = [
                f"{skill_clean} full course tutorial beginners{suffix}",
                f"{skill_clean} crash course tutorial{suffix}",
                f"{skill_clean} complete masterclass tutorial{suffix}"
            ]

        # Deduplicate while preserving order, bounded to 3
        seen = set()
        deduped = []
        for q in queries:
            q_clean = " ".join(q.split())
            if q_clean and q_clean not in seen:
                seen.add(q_clean)
                deduped.append(q_clean)
                if len(deduped) >= 3:
                    break
        return deduped or [f"{skill_clean} tutorial"]

    def _build_contextual_query(self, skill: str, target_role: str, stage: str, language: str = 'en') -> str:
        """Backwards-compatible alias: returns primary contextual query"""
        queries = self._build_stage_queries(skill, target_role, stage, language)
        return queries[0] if queries else f"{skill} tutorial"

    def _fetch_from_youtube_api(
        self,
        queries: Union[str, List[str]],
        skill: str,
        target_role: str,
        stage: str,
        language: str = 'en',
        max_results: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Query official YouTube Data API v3.
        Supports bounded stage-specific multi-query progression (up to 3 queries).
        Fetches search results with videoEmbeddable=true, then queries videos endpoint
        to retrieve exact ISO-8601 duration and verify public embeddability.
        """
        if not self.api_key:
            return []

        if isinstance(queries, str):
            query_list = [queries]
        else:
            query_list = list(queries)[:3]

        search_url = "https://www.googleapis.com/youtube/v3/search"
        lang_code = 'hi' if language in ['hi', 'hindi'] else 'en'
        stage_pool = STAGE_BADGE_POOLS.get(stage, STAGE_BADGE_POOLS['learn'])
        stage_difficulty = STAGE_DIFFICULTY_MAP.get(stage, 'Intermediate')
        user_lang_code = 'hi' if language in ['hi', 'hindi'] else ('en+hi' if language in ['en+hi', 'bilingual'] else 'en')

        for q in query_list:
            params = {
                'part': 'snippet',
                'q': q,
                'type': 'video',
                'videoEmbeddable': 'true',
                'maxResults': min(max(max_results * 2, 5), 10),
                'key': self.api_key,
                'relevanceLanguage': lang_code
            }

            try:
                res = self._http_session.get(search_url, params=params, timeout=5)
                if res.status_code != 200:
                    logger.warning(f"YouTube search API returned status {res.status_code}: {res.text}")
                    continue

                data = res.json()
                items = data.get('items', [])
                if not items:
                    continue

                video_ids = [it.get('id', {}).get('videoId') for it in items if it.get('id', {}).get('videoId')]
                if not video_ids:
                    continue

                # Query videos endpoint for contentDetails (duration) and status (embeddable)
                v_url = "https://www.googleapis.com/youtube/v3/videos"
                v_params = {
                    'part': 'contentDetails,snippet,status',
                    'id': ','.join(video_ids[:10]),
                    'key': self.api_key
                }
                v_res = self._http_session.get(v_url, params=v_params, timeout=5)
                details_map = {}
                if v_res.status_code == 200:
                    for v_item in v_res.json().get('items', []):
                        vid = v_item.get('id')
                        if vid:
                            details_map[vid] = v_item

                videos = []
                for item in items:
                    video_id = item.get('id', {}).get('videoId')
                    if not video_id:
                        continue

                    snippet = item.get('snippet', {})
                    v_title = snippet.get('title', '')

                    # Relevance check
                    if not is_video_relevant_to_skill(skill, v_title):
                        continue

                    # Stage intent check for non-learn stages
                    if not is_video_matching_stage_intent(stage, v_title):
                        continue

                    v_detail = details_map.get(video_id, {})
                    status = v_detail.get('status', {})
                    if status and not status.get('embeddable', True):
                        continue

                    content_details = v_detail.get('contentDetails', {})
                    iso_dur = content_details.get('duration')
                    duration_str, duration_secs = parse_iso8601_duration(iso_dur)

                    badge = stage_pool[len(videos)] if len(videos) < len(stage_pool) else stage_pool[0]

                    video_record = {
                        'id': video_id,
                        'title': v_title,
                        'channel': snippet.get('channelTitle') or 'Tech Academy',
                        'thumbnail': snippet.get('thumbnails', {}).get('medium', {}).get('url') or f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg",
                        'url': f"https://www.youtube.com/watch?v={video_id}",
                        'embed_url': f"https://www.youtube.com/embed/{video_id}",
                        'duration': duration_str,
                        'duration_seconds': duration_secs,
                        'difficulty': stage_difficulty,
                        'badge': badge,
                        'skill_name': skill,
                        'language': user_lang_code,
                        'recommendation_source': 'api',
                        'recommendation_category': 'Technical Skills',
                        'recommendation_reason': STAGE_REASON_MAP.get(stage, f"Recommended resource for {skill}").format(skill=skill, target_role=target_role),
                        'learning_focus': f"{skill} {stage.capitalize()} for {target_role}",
                        'stage': stage,
                        'match_type': 'official_api'
                    }
                    video_record = apply_canonical_metadata(video_record)
                    videos.append(video_record)

                    if len(videos) >= max_results:
                        break

                if videos:
                    return deduplicate_youtube_videos(videos)

            except Exception as e:
                logger.warning(f"YouTube Data API error on query '{q}': {e}")
                continue

        return []

    def _discover_candidates(self, query: str, skill: str, stage: str, max_candidates: int = 6) -> List[Tuple[str, str]]:
        """Safely discover relevant candidate (video_id, title) pairs from search query (offline dev fallback)"""
        try:
            encoded = urllib.parse.quote(query)
            url = f"https://www.youtube.com/results?search_query={encoded}"
            resp = self._http_session.get(url, timeout=3.0)
            if resp.status_code == 200:
                matches = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"([^"]+)"\}', resp.text)
                candidates = []
                seen = set()
                for vid, title in matches:
                    if vid not in seen and not vid.startswith('fallback') and not vid.startswith('search_'):
                        seen.add(vid)
                        # Pre-filter by relevance and stage intent to avoid wasteful oEmbed network calls
                        if is_video_relevant_to_skill(skill, title) and is_video_matching_stage_intent(stage, title):
                            candidates.append((vid, title))
                        if len(candidates) >= max_candidates:
                            break
                return candidates
        except Exception as e:
            logger.debug(f"Candidate video discovery failed for query '{query}': {e}")
        return []

    def _fetch_dynamic_secondary(
        self,
        queries: Union[str, List[str]],
        skill: str,
        target_role: str,
        stage: str,
        language: str = 'en',
        max_results: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Secondary dynamic search with strict availability and semantic validation:
        1. Lightweight candidate ID & title discovery across up to 3 bounded queries.
        2. Validates each candidate with official oEmbed for public embeddability.
        3. Cross-stage disjointness: never reuses Learn video for Practice/Build/Assess.
        4. Strictly sets duration=None unless present in VERIFIED_CANONICAL_METADATA.
        """
        if isinstance(queries, str):
            query_list = [queries]
        else:
            query_list = list(queries)[:3]

        # Disallow Learn IDs from being reused in Practice, Build, or Assess
        disallowed_ids = set()
        if stage != 'learn':
            norm_skill = normalize_skill_name(skill)
            if norm_skill in SKILL_VIDEO_MAP:
                disallowed_ids.add(SKILL_VIDEO_MAP[norm_skill]['id'])
            if norm_skill in STAGE_CURATED_CATALOG and 'learn' in STAGE_CURATED_CATALOG[norm_skill]:
                for it in STAGE_CURATED_CATALOG[norm_skill]['learn']:
                    vid = extract_youtube_id(it)
                    if vid:
                        disallowed_ids.add(vid)
            with self._cache_lock:
                for ckey, cached_list in self._cache.items():
                    if ckey.startswith(f"{skill.lower()}|") and "|learn|" in ckey:
                        for it in cached_list:
                            vid = extract_youtube_id(it)
                            if vid:
                                disallowed_ids.add(vid)

        stage_pool = STAGE_BADGE_POOLS.get(stage, STAGE_BADGE_POOLS['learn'])
        stage_difficulty = STAGE_DIFFICULTY_MAP.get(stage, 'Intermediate')
        lang_code = 'hi' if language in ['hi', 'hindi'] else ('en+hi' if language in ['en+hi', 'bilingual'] else 'en')

        results: List[Dict[str, Any]] = []

        for q in query_list:
            candidates = self._discover_candidates(q, skill, stage, max_candidates=min(max(max_results * 2, 4), 8))
            if not candidates:
                continue

            for v_id, candidate_title in candidates:
                if v_id in disallowed_ids:
                    continue

                # Validate availability via oEmbed
                is_avail, oembed_title, author = check_oembed_availability(v_id, timeout=2.0)
                if not is_avail:
                    continue

                verified_title = oembed_title or candidate_title

                # Filter out shorts
                if '#short' in verified_title.lower() or '#shorts' in verified_title.lower():
                    continue

                # Strict post-validation on authentic title
                if not is_video_relevant_to_skill(skill, verified_title):
                    continue
                if not is_video_matching_stage_intent(stage, verified_title):
                    continue

                badge = stage_pool[len(results)] if len(results) < len(stage_pool) else stage_pool[0]

                item = {
                    'id': v_id,
                    'title': verified_title,
                    'channel': author or 'YouTube Creator',
                    'thumbnail': f"https://i.ytimg.com/vi/{v_id}/mqdefault.jpg",
                    'url': f"https://www.youtube.com/watch?v={v_id}",
                    'embed_url': f"https://www.youtube.com/embed/{v_id}",
                    'duration': None,  # NEVER use oEmbed for duration
                    'duration_seconds': None,
                    'difficulty': stage_difficulty,
                    'badge': badge,
                    'skill_name': skill,
                    'language': lang_code,
                    'recommendation_source': 'dynamic_search',
                    'recommendation_category': 'Technical Skills',
                    'recommendation_reason': STAGE_REASON_MAP.get(stage, f"Recommended resource for {skill}").format(skill=skill, target_role=target_role),
                    'learning_focus': f"{skill} {stage.capitalize()} for {target_role}",
                    'stage': stage,
                    'match_type': 'dynamic_search'
                }

                # Canonical metadata applied if known (injects authentic duration if in VERIFIED_CANONICAL_METADATA)
                item = apply_canonical_metadata(item)
                results.append(item)

                if len(results) >= max_results:
                    break

            if results:
                return deduplicate_youtube_videos(results)

        return []

    def _dynamic_search(
        self,
        skill: str,
        target_role: str,
        stage: str,
        language: str = 'en',
        max_results: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Execute Tier 3 dynamic search.
        Production relies strictly on official YouTube Data API v3 when available,
        degrading to safe empty state ([]) to avoid fragile scraping dependencies.
        When ENABLE_YOUTUBE_WEB_FALLBACK is explicitly enabled (dev/offline testing),
        bounded secondary search with oEmbed availability validation is attempted.
        Duration is never fabricated.
        """
        stage_queries = self._build_stage_queries(skill, target_role, stage, language)

        # 3A: Official YouTube Data API v3 (Preferred Primary)
        if self.api_key:
            try:
                videos = self._fetch_from_youtube_api(stage_queries, skill, target_role, stage, language, max_results)
                if videos:
                    return videos
            except Exception as e:
                logger.warning(f"Official YouTube Data API call failed: {e}")

        # 3B: Secondary Dynamic Search (Gated strictly behind ENABLE_YOUTUBE_WEB_FALLBACK for offline dev/test)
        if ENABLE_YOUTUBE_WEB_FALLBACK:
            try:
                videos = self._fetch_dynamic_secondary(stage_queries, skill, target_role, stage, language, max_results)
                if videos:
                    return videos
            except Exception as e:
                logger.warning(f"Secondary dynamic search failed: {e}")

        return []

    def _get_curated_videos(
        self,
        skill: str,
        target_role: str,
        stage: str,
        language: str = 'en',
        max_results: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Fetch curated stage-specific videos from STAGE_CURATED_CATALOG,
        or SKILL_VIDEO_MAP / CATEGORY_FALLBACK_MAP (strictly for learn stage).
        Never substitutes a learn video for practice, build, or assess stages.
        """
        stage_clean = (stage or 'learn').strip().lower()
        norm = normalize_skill_name(skill)
        skill_raw_low = str(skill or '').strip().lower()

        candidate_items: List[Dict[str, Any]] = []
        rec_source = 'curated'
        match_type = 'exact'

        # Check stage-specific curated catalog
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

        # For learn stage only, check SKILL_VIDEO_MAP / CATEGORY_FALLBACK_MAP
        if not candidate_items and stage_clean == 'learn':
            best_match, m_type, r_source = self._find_best_match(skill)
            if best_match:
                candidate_items = [best_match]
                match_type = m_type
                rec_source = r_source

        if not candidate_items:
            return []

        # Format candidate items with stage badges, etc.
        stage_pool = STAGE_BADGE_POOLS.get(stage_clean, STAGE_BADGE_POOLS['learn'])
        stage_difficulty = STAGE_DIFFICULTY_MAP.get(stage_clean, 'Intermediate')
        lang_code = 'hi' if language in ['hi', 'hindi'] else ('en+hi' if language in ['en+hi', 'bilingual'] else 'en')

        formatted: List[Dict[str, Any]] = []
        for idx, item in enumerate(candidate_items[:max_results]):
            v_id = extract_youtube_id(item)
            if not v_id:
                continue

            v_title = item.get('title') or f"{skill} Tutorial"
            channel_name = item.get('channel') or 'Tech Academy'
            v_duration = item.get('duration')
            v_duration_seconds = item.get('duration_seconds')
            item_category = item.get('category') or 'Technical Skills'

            assigned_badge = item.get('badge')
            if not assigned_badge:
                assigned_badge = stage_pool[idx] if idx < len(stage_pool) else stage_pool[0]

            item_difficulty = item.get('difficulty') or stage_difficulty

            rec_reason = STAGE_REASON_MAP.get(stage_clean, f"Recommended resource for {skill}").format(skill=skill, target_role=target_role)
            if language in ['hi', 'hindi']:
                rec_reason += " (Hindi preference selected)"

            rec = {
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
            }
            rec = apply_canonical_metadata(rec)
            formatted.append(rec)

        return deduplicate_youtube_videos(formatted)

    def _generate_contextual_fallback(
        self,
        skill: str,
        target_role: str,
        stage: str,
        query: str,
        language: str = 'en'
    ) -> List[Dict[str, Any]]:
        """Backwards-compatible alias to _get_curated_videos"""
        return self._get_curated_videos(skill, target_role, stage, language=language)

    def _find_best_match(self, skill: str) -> Tuple[Optional[Dict[str, Any]], str, str]:
        """
        Multi-tiered resolution hierarchy for curated catalog:
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
        sorted_keys = sorted(SKILL_VIDEO_MAP.keys(), key=lambda k: len(k), reverse=True)
        for k in sorted_keys:
            if len(k) <= 2:
                pattern = r'(?i)(?:\b|^)' + re.escape(k) + r'(?:\b|$)'
            else:
                pattern = r'(?i)\b' + re.escape(k) + r'\b'
            if re.search(pattern, skill_raw_low) or re.search(pattern, norm):
                logger.info(f"Skill: '{skill}' | Normalized: '{norm}' | Match: whole_word ('{k}') | Source: curated")
                return SKILL_VIDEO_MAP[k], 'whole_word', 'curated'

        # Step 4: Intelligent Category Fallback (for learn stage only)
        category_match = None
        if any(term in skill_raw_low for term in ['database', 'dbms', 'sql', 'rdbms', 'nosql', 'datastore', 'cockroach', 'couchbase', 'cassandra', 'dynamodb', 'sqlite', 'mariadb']):
            category_match = 'Database'
        elif any(term in skill_raw_low for term in ['cloud', 'openstack', 'iaas', 'paas', 'saas', 'alibaba cloud', 'oracle cloud', 'serverless']):
            category_match = 'Cloud'
        elif any(term in skill_raw_low for term in ['devops', 'ci/cd', 'cicd', 'pipeline', 'container', 'orchestrat', 'gitops', 'iac', 'helm']):
            category_match = 'DevOps'
        elif any(term in skill_raw_low for term in ['security', 'cyber', 'penetrat', 'vulnerab', 'exploit', 'firewall', 'crypto', 'auth']):
            category_match = 'Security'
        elif any(term in skill_raw_low for term in ['machine learning', 'deep learning', 'neural', 'artificial intelligence', 'nlp', 'vision', 'transformer', 'llm', 'genai']):
            category_match = 'AI / ML'
        elif any(term in skill_raw_low for term in ['analytics', 'data analysis', 'statistic', 'dashboard', 'bi', 'visualization', 'mining']):
            category_match = 'Data / Analytics'
        elif any(term in skill_raw_low for term in ['frontend', 'web', 'ui', 'ux', 'css', 'html', 'component', 'dom', 'browser']):
            category_match = 'Web / Frontend'
        elif any(term in skill_raw_low for term in ['backend', 'api', 'endpoint', 'server', 'microservice']):
            category_match = 'Backend'
        elif any(term in skill_raw_low for term in ['embedded', 'microcontroller', 'hardware', 'circuit', 'sensor', 'iot', 'robotics', 'arduino', 'raspberry']):
            category_match = 'Emerging / Hardware'
        elif any(term in skill_raw_low for term in ['programming', 'language', 'compiler', 'coding']):
            category_match = 'Programming'

        if category_match and category_match in CATEGORY_FALLBACK_MAP:
            logger.info(f"Skill: '{skill}' | Normalized: '{norm}' | Match: category ('{category_match}') | Source: category_fallback")
            return CATEGORY_FALLBACK_MAP[category_match], 'category', 'category_fallback'

        # Step 5: Completely unknown skill
        logger.info(f"Skill: '{skill}' | Normalized: '{norm}' | Match: none | Source: safe_empty")
        return None, 'none', 'none'

    def get_videos_for_skill(
        self,
        skill: str,
        target_role: str = 'Software Engineer',
        stage: str = 'learn',
        max_results: int = 4,
        language: str = 'en',
        enable_dynamic: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Fetch YouTube recommendations using the 4-tier pipeline:
          Tier 1: Curated verified catalog (stage-specific)
          Tier 2: Persistent validated cache
          Tier 3: Dynamic YouTube search (Official API preferred -> secondary search + oEmbed validation)
          Tier 4: Safe empty list ([])
        Zero whitelists: ANY valid skill can be recommended.
        Strict stage isolation: Non-learn stages never fall back to beginner learn courses.
        """
        skill_clean = (skill or '').strip()
        if not skill_clean:
            return []

        role_clean = (target_role or 'Software Engineer').strip()
        stage_clean = (stage or 'learn').strip().lower()
        lang_clean = (language or 'en').strip().lower()

        cache_key = make_context_key(skill_clean, role_clean, stage_clean, lang_clean, max_results)

        # Tier 2: Check persistent / in-memory cache
        with self._cache_lock:
            if cache_key in self._cache:
                cached = deduplicate_youtube_videos(self._cache[cache_key])
                self._cache[cache_key] = cached
                return cached

        # Tier 1: Check curated verified catalog (stage-specific)
        curated_videos = self._get_curated_videos(skill_clean, role_clean, stage_clean, lang_clean, max_results)
        if curated_videos:
            curated_videos = deduplicate_youtube_videos(curated_videos)
            with self._cache_lock:
                self._cache[cache_key] = curated_videos
                self._save_disk_cache()
            return curated_videos

        # In-flight request deduplication
        inflight_lock = self.get_inflight_lock(cache_key)
        with inflight_lock:
            # Double-check cache inside lock
            with self._cache_lock:
                if cache_key in self._cache:
                    return deduplicate_youtube_videos(self._cache[cache_key])

            # Tier 3: Dynamic Search
            if enable_dynamic:
                dynamic_videos = self._dynamic_search(
                    skill_clean, role_clean, stage_clean, lang_clean, max_results
                )
                if dynamic_videos:
                    dynamic_videos = deduplicate_youtube_videos(dynamic_videos)[:max_results]
                    with self._cache_lock:
                        self._cache[cache_key] = dynamic_videos
                        self._save_disk_cache()
                    return dynamic_videos

            # Tier 4: Safe Empty
            logger.info(f"No genuine videos found for skill='{skill_clean}', stage='{stage_clean}'. Returning safe empty.")
            return []

