# Admin Dashboard Improvements — Design Spec

## Overview

Improve the Admin Dashboard with richer metrics, better table UX, inline Rx display, and a slide-out session detail panel. Client/Optum Dashboard remains unchanged.

## Scope

Admin Dashboard only (`src/pages/AdminDashboard.tsx` and related components).

---

## 1. Richer Metrics Cards

**Current:** 2 cards (Total AI Tests, Total Manual Rx Entries).

**New:** 5 cards in a responsive grid row.

| Card | Value | Color | Calculation |
|------|-------|-------|-------------|
| Total AI Tests | Count of all sessions | Blue | `rows.length` |
| Manual Rx Done | Count of sessions with manual Rx | Green | `rows.filter(r => r.manual_rx != null).length` |
| Pending Rx | Sessions without manual Rx | Amber | `rows.filter(r => r.manual_rx == null).length` |
| Avg Accuracy | Average accuracy across verified sessions | Green/Red based on value | Mean of per-session accuracy (only sessions with both AI and manual Rx) |
| High Deviation | Sessions with any red deviation | Red | Count sessions where any parameter exceeds threshold (sph/cyl/add > 0.25, axis > 10) |

**Layout:** `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` responsive grid.

**Component:** Update existing `MetricsSummary.tsx` with new props or create `AdminMetricsSummary.tsx` if changes are too large.

---

## 2. Better Table UX

### 2a. Sortable Columns

- Click column header to sort ascending, click again for descending, third click to clear.
- Visual indicator (arrow up/down) on sorted column header.
- Use TanStack Table's built-in sorting API (`getSortingRowModel`).

### 2b. Sticky Header

- Table header stays visible when scrolling down.
- CSS: `position: sticky; top: 0; z-index: 10` on `<thead>`.

### 2c. Date Filter

- **Preset buttons:** Today, This Week, This Month, All Time.
- **Custom date picker:** Two native `<input type="date">` fields (start → end).
- Filter is based on `session_start_time` field from session data.
- Preset buttons and custom picker are mutually exclusive — selecting a preset clears custom dates and vice versa.
- Place filter bar between metrics cards and table, alongside existing Manual Rx filter.

---

## 3. Inline Rx Quick View

**Current:** Manual Rx column shows only an "Edit" button that opens the editor.

**New:**
- When Rx is filled: show compact inline values `R: +1.25 / -0.50 / 90 / +1.00` and `L: ...` with a small edit icon.
- When Rx is empty: show "Pending — click to enter" in amber/yellow text.
- Clicking edit icon or "Pending" text opens the existing ManualRxEditor.

**Component:** Modify `ManualRxEditor.tsx` display mode to show values inline.

---

## 4. Session Detail Slide-out Panel

**Trigger:** Click arrow icon (`▶`) on any row, or click the row itself.

**Panel:** Slides in from the right side, width ~420px, with dark overlay on the table area behind.

**Content (top to bottom):**
1. **Header:** Customer name + close button (×)
2. **Session info:** Session ID, date, duration, steps count
3. **Self ET Power (AI):** Right and left eye values in a card
4. **Manual Rx:** Right and left eye values in a card (or "Not entered" prompt)
5. **Deviation:** |Manual - AI| per parameter, color-coded green/red with underline
6. **Summary cards:** Accuracy % with params count, Duration with steps

**Behavior:**
- Clicking outside the panel or pressing Escape closes it.
- Only one panel open at a time.
- Panel state is local (useState in AdminDashboard).

**Component:** New `SessionDetailPanel.tsx` component.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/AdminDashboard.tsx` | Major update — add date filter, sorting, detail panel state, new metrics |
| `src/components/dashboard/MetricsSummary.tsx` | Update to support 5 cards for admin (keep 2-card mode for client) |
| `src/components/dashboard/ManualRxEditor.tsx` | Add inline display mode for filled Rx |
| `src/components/dashboard/SessionDetailPanel.tsx` | **New** — slide-out panel |
| `src/components/dashboard/DateFilter.tsx` | **New** — date preset + custom picker |
| `src/components/dashboard/DataTable.tsx` | Add sorting + sticky header support |

## Out of Scope

- Client/Optum Dashboard changes
- Export/CSV functionality
- Status badges
- Visual polish/animations (can be done later)
