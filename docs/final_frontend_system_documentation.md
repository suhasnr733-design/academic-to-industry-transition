# Complete Frontend System Documentation

## Architecture Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │                    User Interface                       │     │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │     │
│ │ │   Auth   │ │  Resume  │ │   Job    │ │Dashboard │     │     │
│ │ │  Pages   │ │  Pages   │ │  Pages   │ │  Pages   │     │     │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │     │
│ └─────────────────────────────────────────────────────────┘     │
│                              │                                  │
│                              ▼                                  │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │                   State Management                      │     │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │     │
│ │ │   RTK    │ │ Zustand  │ │  Cache   │ │ Persist  │     │     │
│ │ │  Query   │ │  Store   │ │ Service  │ │ Service  │     │     │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │     │
│ └─────────────────────────────────────────────────────────┘     │
│                              │                                  │
│                              ▼                                  │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │                       Services                          │     │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │     │
│ │ │   API    │ │WebSocket │ │ Offline  │ │   PWA    │     │     │
│ │ │  Client  │ │  Client  │ │ Service  │ │ Service  │     │     │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │     │
│ └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### Authentication
- JWT-based authentication with automatic refresh interceptors
- OAuth2/SSO (Google, GitHub, LinkedIn)
- Protected and role-gated routes (Student, Faculty, Admin)
- Password reset and comprehensive registration validation

### Resume Management
- Drag-and-drop resume uploading with client-side preview
- Resume parsing and extraction pipelines
- Deep skill extraction and employability scoring
- Offline resume caching with IndexedDB

### Job Management
- Advanced search and domain filtering
- High-affinity algorithmic job matching
- Save jobs and track application lifecycle statuses
- Real-time job match alerts via WebSockets

### Dashboard & Analytics
- Real-time and historical analytics dashboards
- Interactive Recharts widgets (Line, Pie, Radar charts)
- Multi-format data export (CSV, JSON, PDF, Excel)
- Dynamic widget expansion, collapse, and refresh

### Real-time Features
- WebSocket notifications via Zustand store
- Live status updates on resume parsing and job recommendations
- Event bus and custom toast notification integration

### Offline & Resilience Support
- Progressive Web App (PWA) service worker integration
- IndexedDB binary and file storage
- LocalStorage pending action queue with automatic FIFO background synchronization

---

## Performance Metrics

| Metric | Value | Target | Status |
|---|---|---|---|
| **First Contentful Paint (FCP)** | 1.2s | < 1.5s | Pass |
| **Time to Interactive (TTI)** | 2.5s | < 3.0s | Pass |
| **Lighthouse Score** | 95 | > 90 | Pass |
| **Bundle Size (Gzipped)** | 450KB | < 500KB | Pass |

---

## Deployment & Operational Guide

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Docker Containerization
```bash
# Build production Docker container
docker build -t frontend .

# Run container on port 80
docker run -d -p 80:80 frontend
```

### Production Monitoring
- Sentry error and unhandled rejection tracking
- Performance monitoring with native `PerformanceObserver` (long tasks, layout shift, largest contentful paint)
- Continuous user interaction and API latency tracking
