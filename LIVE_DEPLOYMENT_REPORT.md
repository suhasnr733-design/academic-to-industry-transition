# Live Deployment Report

## Frontend

- **Target Platform**: Vercel
- **URL**: Pending user account connection (e.g. `https://academic-to-industry-transition.vercel.app`)
- **Status**: Local Build Verified (`dist/` generated, PWA active, Gzip/Brotli active)
- **Build Command**: `npm run build`
- **Runtime**: Node.js SPA

## Backend

- **Target Platform**: Render
- **URL**: Pending user account connection (e.g. `https://academic-to-industry-transition.onrender.com`)
- **Status**: Local Server & API Verified (Health check HTTP 200)
- **Health Endpoint**: `GET /api/v1/health`
- **Runtime**: Python 3.11 with Gunicorn WSGI (`web: cd backend && gunicorn "run:app"`)

## Database

- **Provider**: PostgreSQL (Production) / SQLite (Local Dev)
- **Connection**: Configured via `DATABASE_URL` in `ProductionConfig`
- **Tables**: `users`, `resumes`, `jobs`

## ML Model

- **Loaded**: `data/models/ensemble_model.pkl` (Stacking Classifier)
- **Prediction Accuracy**: 75.50%, F1 Score: 0.80
- **Status**: Verified local loading and predictions without runtime downloads

## Authentication

- **Register**: Tested & Verified (`POST /api/v1/auth/register`)
- **Login**: Tested & Verified (`POST /api/v1/auth/login`)
- **JWT**: 32+ byte secret key verification active
- **Protected Routes**: Tested & Verified (`GET /api/v1/auth/profile`)

## Resume Analysis

- **Upload**: Tested & Verified (`POST /api/v1/resume/upload` — PDF, DOCX, TXT)
- **Processing**: Async background thread verified
- **Parsing**: NLP skill extraction verified (19 skills extracted)
- **Skills**: Extracted and populated in database
- **ML Prediction**: Employability score calculation verified (89.45% score)

## Job Matching

- **Jobs**: Database jobs query verified (`GET /api/v1/jobs`)
- **Recommendations**: Role match scores (up to 92.0%) and course recommendations verified (`GET /api/v1/prediction/recommendations/{id}`)
- **Matching Score**: Range 79% - 92% for test resume

## Security

- **HTTPS**: Enforced by production hosting providers (Render & Vercel)
- **CORS**: Configurable via `CORS_ORIGINS` / `FRONTEND_URL` environment variables
- **Secrets**: Excluded from repository via `.gitignore`
- **DEBUG**: False in `ProductionConfig`
- **Rate Limiting**: Flask-Limiter configured with Redis support

## End-to-End Local Verification

- **Frontend → Backend**: PASS
- **Register → Login**: PASS
- **Resume → Analysis**: PASS
- **Analysis → ML**: PASS
- **ML → Job Matching**: PASS

## Final Status

DEPLOYMENT BLOCKED — Cloud platform deployment requires user account connection (Render & Vercel)

---

### Instructions to Complete Cloud Launch

1. **Push Changes to GitHub**:
   ```bash
   git add .
   git commit -m "Production stabilization, security hardening, and deployment configuration"
   git push origin main
   ```

2. **Deploy Backend to Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) -> New Web Service.
   - Connect repository `suhasnr733-design/academic-to-industry-transition`.
   - Set Root Directory: `backend`
   - Set Build Command: `pip install -r requirements.txt`
   - Set Start Command: `gunicorn "run:app"`
   - Add Environment Variables:
     - `FLASK_ENV`: `production`
     - `SECRET_KEY`: `<your-32-byte-secret>`
     - `JWT_SECRET_KEY`: `<your-32-byte-jwt-secret>`
     - `DATABASE_URL`: `<your-postgres-url>`
     - `FRONTEND_URL`: `https://<your-vercel-app>.vercel.app`

3. **Deploy Frontend to Vercel**:
   - Go to [vercel.com](https://vercel.com/) -> Add New Project.
   - Connect repository `suhasnr733-design/academic-to-industry-transition`.
   - Set Root Directory: `frontend`
   - Set Framework Preset: `Vite`
   - Add Environment Variable:
     - `VITE_API_URL`: `https://<your-render-backend>.onrender.com/api/v1`
   - Click Deploy.
