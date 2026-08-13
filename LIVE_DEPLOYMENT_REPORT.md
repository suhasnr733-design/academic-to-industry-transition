# LIVE DEPLOYMENT REPORT

## Frontend

URL:
https://academic-to-industry-transition.vercel.app

Status:
LIVE

## Backend

URL:
https://academic-to-industry-transition.onrender.com

Status:
LIVE

## Database

PostgreSQL:
CONNECTED

## Health

HTTP:
200 OK (`{"database": "connected", "status": "healthy", "version": "1.0.0"}`)

## Authentication

Register:
PASS (`POST /api/v1/auth/register` -> HTTP 201)

Login:
PASS (`POST /api/v1/auth/login` -> HTTP 200, Username & Email identifiers supported)

JWT:
PASS (Token validation & profile access verified)

## Resume Processing

Upload:
PASS (`POST /api/v1/resume/upload` -> HTTP 201)

Processing:
PASS (Async background worker status verified)

Skills:
PASS (Technical skill extraction verified)

## Machine Learning

Model:
REAL PRODUCTION MODEL (`ensemble_model.pkl` Stacking Classifier)

Prediction:
PASS (`GET /api/v1/prediction/employability/1` -> HTTP 200, Score: 88.0%)

## Job Matching

Status:
PASS (Role match scores up to 92.0% & learning path recommendations returned)

## Frontend Integration

Vercel → Render:
PASS (`VITE_API_URL=https://academic-to-industry-transition.onrender.com/api/v1`)

## Security

Secrets:
PASS (Zero hardcoded secrets in repository)

CORS:
PASS (Configured origin whitelisting)

HTTPS:
PASS (Enforced on Render & Vercel)

## End-to-End

Register → Login → Resume Upload → ML → Jobs:
PASS

---

## Final Status

FULL STACK LIVE AND VERIFIED
