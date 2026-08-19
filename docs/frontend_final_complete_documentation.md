# Complete Frontend Documentation

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐     ┌──────────┐     ┌──────────┐   ┌───────────┐ │
│  │   Auth   │     │  Resume  │     │   Job    │   │ Dashboard │ │
│  │  Pages   │     │  Pages   │     │  Pages   │   │   Pages   │ │
│  └──────────┘     └──────────┘     └──────────┘   └───────────┘ │
│       │                │                │               │       │
│  ┌────┴────────────────┴────────────────┴───────────────┴────┐  │
│  │                     State Management                      │  │
│  │  ┌──────────────┐     ┌──────────────┐     ┌───────────┐  │  │
│  │  │    Redux     │     │   Zustand    │     │   Cache   │  │  │
│  │  │   Toolkit    │     │    Store     │     │  Service  │  │  │
│  │  └──────────────┘     └──────────────┘     └───────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User authentication & Social OAuth (Google / LinkedIn) |
| Register | `/register` | User account creation with student metadata |
| Dashboard | `/dashboard` | Student primary dashboard with KPIs and recommendations |
| Resume | `/resume` | Resume list, detail views, and multi-format parser upload |
| Jobs | `/jobs` | AI-matched job board and role exploration |
| Skills | `/skills` | Skill gap analysis and competency benchmarking |
| Learning | `/learning` | Curated course catalog and career path generation |
| Notifications | `/notifications` | Real-time WebSocket and persisted notification feed |
| Profile | `/profile` | User profile management |
| Settings | `/settings` | Application and security configuration |

## Components

### Common Components
- `Button` - Standard & accessible button variants
- `Input` - Form inputs with validation error states
- `AccessibleModal` - WCAG 2.1 AA focus-trapped dialogs
- `LoadingFallback` - Smooth spinner loading states
- `OptimizedImage` - Progressive lazy-loaded image component
- `VirtualList` - Virtualized scrolling for high-throughput lists

### Layout Components
- `Navbar` - Sticky navigation with profile dropdown and dark mode toggle
- `Sidebar` - Accessible collapsable sidebar navigation
- `Footer` - Application metadata and links
- `Layout` - Responsive layout grid wrapping main viewport

### Feature Components
- `ResumeUpload` - Multi-file drag-and-drop resume upload widget
- `JobList` - Filterable, searchable job list with bookmarking
- `SkillChart` - Interactive visual charts for gap benchmarking
- `DashboardWidgets` - Real-time statistics, metrics, and KPI widgets

## Deployment URLs
- **Frontend**: `https://academic-to-industry-transition.vercel.app`
- **API**: `https://academic-to-industry-transition.onrender.com/api/v1`
- **WebSocket**: `wss://academic-to-industry-transition.onrender.com/ws`

## Performance Metrics

| Metric | Value | Target |
|--------|-------|--------|
| First Contentful Paint | 1.2s | < 1.5s |
| Time to Interactive | 2.5s | < 3s |
| Bundle Size | 450KB | < 500KB |
| Lighthouse Score | 95 | > 90 |

## Maintenance Guide

### Daily Tasks
1. Check browser console logs and uncaught runtime errors.
2. Monitor API latency and WebSocket connectivity.
3. Review user feedback and real-time performance analytics.

### Weekly Tasks
1. Check and update minor dependency packages (`npm update`).
2. Run Lighthouse audits across primary desktop and mobile viewports.
3. Verify WCAG 2.1 AA accessibility standards (`npm run test:a11y`).

### Monthly Tasks
1. Analyze bundle distribution and optimize Rollup vendor chunks.
2. Fine-tune caching and PWA service worker asset rules.
3. Apply security patches and dependency vulnerability updates.

## Handover Checklist
- [x] All code committed and pushed to GitHub
- [x] Comprehensive documentation completed
- [x] End-to-end and accessibility test suites passing
- [x] Production build pipeline and containerization verified
- [x] Service health checks and monitoring configured
