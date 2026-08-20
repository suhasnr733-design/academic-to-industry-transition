# Frontend Data Visualization & Reporting Documentation (Week 19)

## 1. Overview
Week 19 introduces interactive data visualization architectures, dynamic charting widgets, custom multi-format data export capabilities, and an advanced analytics dashboard.

---

## 2. Interactive Dashboard Widgets (`frontend/src/components/dashboard/DashboardWidgets.jsx`)

### Components
1. **`WidgetContainer`**:
   - Card wrapper with Framer Motion hover elevation and entry transitions.
   - Integrated collapsible state toggle (`isExpanded`) and asynchronous data reload spinner.
2. **`InteractiveLineChart`**:
   - Multi-metric time series powered by Recharts (`ResponsiveContainer`, `LineChart`, `CartesianGrid`, `Tooltip`, `Legend`).
   - Interactive hover accentuation highlighting line paths dynamically.
3. **`InteractivePieChart`**:
   - Multi-segment status distribution visualization with custom palette color mapping.
   - Dynamic pie slice expansion (`outerRadius: 100`) on `onMouseEnter`.
4. **`InteractiveRadarChart`**:
   - Polar coordinate radar chart overlaying multiple skill datasets (e.g. Current Skill Level vs Target Industry Requirement).

---

## 3. Multi-Format Data Export (`frontend/src/components/common/DataExport.jsx` & `frontend/src/utils/export.js`)

### Supported Formats
| Format | Mechanism | Output Type |
|---|---|---|
| **CSV** | Character escaping, RFC 4180 delimiter generation | `text/csv` Blob |
| **JSON** | Formatted indent serialization (`JSON.stringify(data, null, 2)`) | `application/json` Blob |
| **PDF** | High-fidelity printable stylesheet via popup print window / HTML download fallback | Printable Document |
| **Excel** | Microsoft XML Spreadsheet structure (`urn:schemas-microsoft-com:office:spreadsheet`) | `.xls` Blob |

### UI Modal Features
- Dropdown menu with icons for each export format.
- Real-time spinners on active export triggers.
- Native `toast` notification event dispatch on success or error.

---

## 4. Advanced Analytics Dashboard (`frontend/src/pages/dashboard/AdvancedDashboard.jsx`)

### Architecture
- Aggregates user profile data from RTK Query (`useGetProfileQuery`).
- Dynamic chart widgets rendering:
  - Application trend timeline (Applications, Interviews, Offers)
  - Application status distribution (Applied, Interviewing, Offered, Rejected, Pending)
  - Skill competency vs industry gap radar
- Global export toolbar binding entire dataset to `DataExport`.
