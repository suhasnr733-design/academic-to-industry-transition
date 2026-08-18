# Frontend Performance & Advanced UI/UX Documentation (Week 18)

## 1. Overview
Week 18 focuses on maximizing user experience responsiveness, rendering performance under large data scale, robust form input validation, and continuous client-side telemetry.

---

## 2. Virtual Scrolling & Infinite Scroll (`frontend/src/components/common/VirtualList.jsx`)

### Components
1. **`VirtualList`**:
   - Built on `react-window` (`FixedSizeList`).
   - Renders only the active viewport items + overscan window, reducing DOM nodes from $O(N)$ to $O(1)$.
   - Handles dynamic pagination triggers via `handleItemsRendered` with threshold detection (`visibleStopIndex >= items.length - 5`).
2. **`InfiniteScroll`**:
   - Lightweight `IntersectionObserver` wrapper.
   - Attaches sentinel observer ref to the tail element to lazily trigger asynchronous `onLoadMore` data fetches.
   - Built-in loading spinner indicator and state protection against duplicate fetch execution.

---

## 3. Advanced Form Validation Engine (`frontend/src/hooks/useFormValidation.js`)

### Architecture
- **State Management**: Encapsulates `values`, `errors`, `touched`, `isSubmitting`, and `isValid`.
- **Validation Engine**: Powered by Yup schemas with support for asynchronous field-level checks on blur/change and whole-form validation on submit.
- **Preconfigured Schemas**:
  - `login`: Username and password constraints.
  - `register`: Username regex checking, RFC-compliant email, minimum length, password complexity (uppercase, lowercase, digits, symbols), password matching, department, and year of study ($1-4$).
  - `resume`: Validates skill sets, experience history, and educational qualifications.

---

## 4. Performance Monitoring & Web Vitals (`frontend/src/utils/performance.js`)

### Capabilities
- **`performanceMonitor.startMeasure(name)`**: High-resolution timer (`performance.now()`) returning an end closure.
- **Latency Threshold Warnings**: Automatically flags and logs warnings when operations exceed $1000\text{ ms}$.
- **Method Decorator / Wrapper**: `trackRender(componentName)` for lifecycle and component render cost profiling.
- **API Latency Tracking**: `trackAPI(apiName, apiCall)` wraps async network invocations and records latency history.
- **Long Task & Web Vitals Observer**: Native `PerformanceObserver` tracking `longtask`, `layout-shift` (CLS), and `largest-contentful-paint` (LCP).
