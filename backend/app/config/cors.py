# backend/app/config/cors.py

CORS_CONFIG = {
    'origins': [
        'https://your-project.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allow_headers': ['Content-Type', 'Authorization'],
    'expose_headers': ['X-Total-Count'],
    'max_age': 86400,
    'supports_credentials': True
}