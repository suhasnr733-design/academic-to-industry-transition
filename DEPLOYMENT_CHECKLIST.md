# DEPLOYMENT CHECKLIST

Use this checklist to ensure all production deployment prerequisites are verified before launching to production.

- [x] **Git Repository Clean**: Unnecessary cache, build artifacts, test scripts, and local databases ignored via `.gitignore`.
- [x] **No Secrets Committed**: All secrets removed from tracked files; environment variables used.
- [x] **`.env.example` Complete**: Root, backend, and frontend `.env.example` templates created with placeholders.
- [x] **Frontend Build Passes**: `npm run build` succeeds (475 modules transformed, PWA precache, gzip/brotli compression active).
- [x] **Backend Tests Pass**: Pytest suite reports 38 passed, 2 skipped, 0 failed in 49.18s.
- [x] **ML Model Verified**: Real trained `StackingClassifier` model (`ensemble_model.pkl`, 75.50% accuracy, 0.80 F1) verified and deployed (< 6MB).
- [x] **Database Configured**: SQLAlchemy configured for SQLite (development) and PostgreSQL (production via `DATABASE_URL`).
- [x] **CORS Configured**: CORS supports configurable origin white-listing via `CORS_ORIGINS` / `FRONTEND_URL` environment variables.
- [x] **Backend Deployed**: Live on Render at `https://academic-to-industry-transition.onrender.com`.
- [x] **Backend Health Endpoint Verified**: `GET /api/v1/health` returns `{"status": "healthy", "database": "connected"}` (HTTP 200).
- [x] **Authentication Verified**: Live registration, login, JWT token issuance, and profile route verified on Render.
- [x] **Resume Processing & ML Verified**: Live resume upload, skill parsing (19 skills), and ML prediction (score 88.0%) verified on Render.
- [ ] **Frontend Deployed**: Pending Vercel account connection.
- [ ] **`VITE_API_URL` Configured**: Set `VITE_API_URL=https://academic-to-industry-transition.onrender.com/api/v1` in Vercel.
- [ ] **Frontend ↔ Backend Verified**: Full E2E user interaction verified from Vercel URL.
- [ ] **Production Smoke Test Passed**: Full user journey smoke test on live Vercel domain.
