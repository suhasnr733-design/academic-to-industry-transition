# Academic-to-Industry Transition Platform

An intelligent, production-ready platform designed to empower students transitioning from academia to industry. The system provides automated resume parsing, NLP skill extraction, machine-learning based employability prediction, personalized career gap analysis, and automated job/course recommendations.

---

## 🌟 Key Features

- **Automated Resume Parsing**: Extracts structured data (skills, experience, education, projects) from PDF, DOCX, and TXT resumes using regex, NLP keyword extraction, and PyPDF2/python-docx.
- **ML Employability Prediction**: Stacking Classifier ensemble (RandomForest + GradientBoosting + SVM with LogisticRegression meta-classifier) trained to predict placement readiness with high confidence (**75.50% accuracy**, **0.80 F1 Score**).
- **Offline Heavy NLP Resilience**: Offline-first design for HuggingFace Transformers and BERT models (`BERT` and `DistilBERT`), ensuring graceful keyword fallback without blocking network requests during test/offline execution.
- **JWT Authentication & Authorization**: Secure registration, login, token refresh, password hashing via Bcrypt, and route protection using Flask-JWT-Extended.
- **Job & Course Recommendation**: Automated role matching and course suggestions based on extracted student skills vs. market job requirements.
- **Modern Responsive Frontend**: React single-page application built with Vite, Tailwind CSS / Vanilla CSS, Redux Toolkit, PWA capabilities, and gzip/brotli compression assets.

---

## 🛠️ Architecture Overview

```
academic-to-industry-transition/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Modular API Blueprints (auth, resume, prediction, jobs)
│   │   ├── models/          # SQLAlchemy Database Models (User, Resume, Job)
│   │   ├── services/        # Core Business Logic & ML Predictors
│   │   ├── config.py        # Environment Configuration
│   │   └── __init__.py      # Flask App Factory & Extensions
│   ├── tests/               # Pytest Suite (38 passed, 2 skipped)
│   └── run.py               # Application Entry Point
├── frontend/                # Vite + React SPA
│   ├── src/                 # React Components, Hooks, State & API Client
│   └── package.json         # Node Dependencies & Build Scripts
├── data/
│   └── models/              # Trained ML Artifacts (.pkl files)
└── scripts/
    └── train_and_export_model.py # ML Pipeline Training Script
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.11+
- **Node.js**: 18+ & `npm`

### 1. Backend Setup

```bash
# Navigate to project root
cd backend

# Install dependencies
pip install -r requirements.txt

# Start backend server (defaults to http://localhost:5000)
python run.py
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🧪 Testing & Verification

### Running Complete Backend Tests

```bash
python -m pytest backend/tests -v --timeout=30
```
Expected output: **38 passed, 2 skipped, 0 failed**.

### Retraining the ML Model

If you need to reproduce the trained ensemble model:

```bash
python scripts/train_and_export_model.py
```

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

```env
FLASK_APP=run.py
FLASK_ENV=production
SECRET_KEY=your-secure-32-byte-secret-key
JWT_SECRET_KEY=your-secure-32-byte-jwt-secret-key
DATABASE_URL=sqlite:///instance/site.db
DEBUG=False
# RATELIMIT_STORAGE_URI=redis://localhost:6379/0
```

### Frontend Configuration (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 🔒 Security Hardening

- **JWT Secret**: Configured with 32+ byte HMAC keys to comply with SHA256 security guidelines.
- **SQLAlchemy 2.0 Preparedness**: All route model queries updated from legacy `.query.get()` to `db.session.get()`.
- **Rate Limiting**: Configured with Flask-Limiter (defaults to in-memory for dev, Redis supported for production).

---

## 📄 License

MIT License.
