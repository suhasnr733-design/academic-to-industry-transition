# DEPLOYMENT CHECKLIST

Use this checklist to ensure all production deployment prerequisites are verified before launching to production.

- [x] **Git Repository Clean**: Unnecessary cache, build artifacts, test scripts, and local databases ignored via `.gitignore`.
- [x] **No Secrets Committed**: All secrets removed from tracked files; environment variables used.
- [x] **`.env.example` Complete**: Root, backend, and frontend `.env.example` templates created with placeholders.
- [x] **Frontend Build Passes**: `npm run build` succeeds (475 modules transformed, PWA precache, gzip/brotli compression active).
- [x] **Backend Tests Pass**: Pytest suite reports 38 passed, 2 skipped, 0 failed in 21.79s.
- [x] **ML Model Verified**: Real trained `StackingClassifier` model (`ensemble_model.pkl`, 75.50% accuracy, 0.80 F1) verified and committed (< 6MB).
- [x] **Database Configured**: SQLAlchemy configured for SQLite (development) and PostgreSQL/MySQL (production via `DATABASE_URL`).
- [x] **CORS Configured**: CORS supports configurable origin white-listing via `CORS_ORIGINS` / `FRONTEND_URL` environment variables.
- [ ] **Backend Deployed**: Backend hosted on platform like Render, Railway, or AWS App Runner.
- [ ] **Backend Health Endpoint Verified**: `GET /api/v1/health` returns `{"status": "healthy"}` on production domain.
- [ ] **Frontend Deployed**: Frontend hosted on platform like Vercel or Netlify.
- [ ] **`VITE_API_URL` Configured**: Frontend environment variable configured to target deployed backend URL.
- [ ] **Frontend ↔ Backend Verified**: Frontend successfully communicates with deployed backend API.
- [ ] **Resume Upload Verified**: Multipart resume upload works on production environment.
- [ ] **Resume Analysis Verified**: Async text extraction and skill parsing run without error.
- [ ] **Job Matching Verified**: Skill gap analysis and job recommendation endpoints operational.
- [ ] **Authentication Verified**: User registration, login, JWT token issuance, and protected route access verified.
- [ ] **Production Smoke Test Passed**: Full E2E user workflow verified on live production URLs.
