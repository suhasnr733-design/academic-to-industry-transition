# Frontend State Management & Real-time Documentation (Week 17)

## 1. Overview
Week 17 establishes an advanced state management and real-time communication foundation for the Academic-to-Industry Transition platform. The architecture unites:
1. **Redux Toolkit (RTK) Query**: Centralized, cache-managed, tag-invalidated server state management.
2. **Zustand Real-time Store**: Lightweight, reactive WebSocket state handling and event streams.
3. **Offline-First Resilience**: Automatic network status tracking, action queuing, and IndexedDB binary storage with automatic background replay on reconnection.

---

## 2. RTK Query API Service (`frontend/src/services/api.js`)

### Key Capabilities
- **Declarative Endpoints**: Defined endpoints for Authentication, Resumes, Job Opportunities, Predictive Analytics, and Notifications.
- **Automated Caching & Invalidation**: Managed via `tagTypes: ['User', 'Resume', 'Job', 'Notification', 'Prediction']`.
- **Dynamic Headers**: Injects Bearer tokens automatically from `localStorage`.
- **Generated React Hooks**: Exposes reactive query and mutation hooks for seamless UI integration.

### Endpoint Matrix
| Tag | Query/Mutation Hook | Endpoint / Operation | Invalidation / Cache Target |
|---|---|---|---|
| `User` | `useLoginMutation` | `POST /auth/login` | Invalidates `User` |
| `User` | `useRegisterMutation` | `POST /auth/register` | User onboarding |
| `User` | `useGetProfileQuery` | `GET /auth/profile` | Provides `User` |
| `User` | `useUpdateProfileMutation` | `PUT /auth/profile` | Invalidates `User` |
| `Resume` | `useUploadResumeMutation` | `POST /resume/upload` | Invalidates `Resume` |
| `Resume` | `useGetResumesQuery` | `GET /resume/list` | Provides `Resume` |
| `Resume` | `useGetResumeQuery` | `GET /resume/:id` | Provides `Resume` |
| `Resume` | `useProcessResumeMutation` | `POST /resume/:id/process` | Invalidates `Resume`, `Prediction` |
| `Resume` | `useDeleteResumeMutation` | `DELETE /resume/:id` | Invalidates `Resume` |
| `Job` | `useGetJobsQuery` | `GET /jobs` | Provides `Job` |
| `Job` | `useGetJobQuery` | `GET /jobs/:id` | Provides `Job` |
| `Job` | `useGetJobDomainsQuery` | `GET /jobs/domains` | Provides `Job` |
| `Job` | `useMatchJobsQuery` | `GET /jobs/match/:resumeId` | Provides `Job` |
| `Prediction` | `useGetEmployabilityQuery` | `GET /prediction/employability/:resumeId` | Provides `Prediction` |
| `Prediction` | `useGetSkillGapQuery` | `GET /prediction/gap/:resumeId` | Provides `Prediction` |
| `Prediction` | `useGetRecommendationsQuery` | `GET /prediction/recommendations/:resumeId`| Provides `Prediction` |
| `Notification` | `useGetNotificationsQuery` | `GET /notifications` | Provides `Notification` |
| `Notification` | `useMarkNotificationReadMutation` | `POST /notifications/:id/read` | Invalidates `Notification` |
| `Notification` | `useMarkAllNotificationsReadMutation` | `POST /notifications/mark-all-read` | Invalidates `Notification` |

---

## 3. Real-time WebSocket Architecture (`frontend/src/store/slices/websocketSlice.js`)

### Store Specifications
- **Framework**: Zustand `create` with socket.io-client.
- **Connection Management**: Automatic reconnection backoff with configurable maximum retry attempts and interval delay.
- **Event Listeners**:
  - `notification`: Ingests broadcasted system notifications into `useNotifications`.
  - `resume_update`: Dispatches resume parsing and analysis state updates.
  - `job_match`: Delivers real-time high-affinity job matching scores.
- **Room Support**: Built-in `joinRoom(room)` and `leaveRoom(room)` methods for collaborative sessions.

---

## 4. Offline-First Architecture (`frontend/src/services/offline.js`)

### Architectural Workflow
```
[User Action] ───► [Is Online?]
                         │
        ┌────────────────┴────────────────┐
        ▼ (Yes)                           ▼ (No)
[Execute Direct API Call]         [Queue in Pending Actions]
                                  [Store Binary in IndexedDB]
                                  [Dispatch Offline Toast]
                                           │
[Network Restored (online event)] ◄────────┘
        │
        ├──► Sync & Replay Pending Actions
        ├──► Reconnect WebSockets via Zustand
        └──► Show 'Back Online' Notification
```

### Features
1. **Network Detection**: Event-driven listeners on `window.online` and `window.offline`.
2. **Action Queuing**: Serialized storage in `localStorage.pendingActions` with unique IDs.
3. **IndexedDB Binary Storage**: Dedicated `offlineStorage` database with `files` object store for offline resume uploads.
4. **Reconnection Synchronization**: Deterministic FIFO execution and removal of successfully synchronized operations.
