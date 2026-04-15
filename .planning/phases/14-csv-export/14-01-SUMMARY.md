---
phase: 14-csv-export
plan: "01"
subsystem: alerts, analytics
tags: [csv-export, date-filter, client-side, alerts, analytics]
dependency_graph:
  requires: []
  provides: [EXP-01, EXP-02, EXP-03]
  affects: [src/app/alerts/page.tsx, src/app/analytics/page.tsx]
tech_stack:
  added: []
  patterns: [client-side CSV generation, date range filter with Aplicar button, state promotion for export]
key_files:
  created: []
  modified:
    - src/app/alerts/page.tsx
    - src/app/analytics/page.tsx
decisions:
  - "date-filter uses Aplicar Filtro button (not live on keystroke) per EXP-01 user decision"
  - "Ate boundary uses setHours(23,59,59,999) to include full day"
  - "Local alerts variable renamed to alertsData in loadAnalytics() to avoid collision with future state variable rawAlerts"
  - "Export button on analytics page only renders when rawAlerts.length > 0"
metrics:
  duration: "4 minutes"
  completed_date: "2026-04-15"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 14 Plan 01: CSV Export — Alerts Date Filter + Analytics Export Summary

## One-liner

Date range filter (De/Ate + Aplicar Filtro) wired into alerts page and CSV export button added to analytics header using existing exportToCSV/formatAlertForExport utilities.

## What Was Built

### Task 1 — Date-range filter on alerts page (`src/app/alerts/page.tsx`)

Added three state variables: `dateFrom`, `dateTo`, `dateApplied`. The `filteredAlerts` derivation was replaced with AND-combined logic that applies both the read/unread filter and the date range filter. A date input group (De / Ate inputs, Aplicar Filtro button, conditional Limpar button) was inserted into the existing filter tabs row. The Exportar CSV button already present now exports exactly the combined-filtered list.

Key implementation detail: the Ate boundary uses `setHours(23, 59, 59, 999)` to include the entire day (avoids off-by-one where an alert created at 14:00 on the selected date would be excluded).

### Task 2 — CSV export button on analytics page (`src/app/analytics/page.tsx`)

Added imports: `Button` from `@/components/ui/button`, `Download` from `lucide-react`, `exportToCSV` and `formatAlertForExport` from `@/lib/export-utils`. Added `rawAlerts` state. Inside `loadAnalytics()`, renamed the local `alerts` destructuring variable to `alertsData` to avoid collision, then added `setRawAlerts(alertsData || [])` immediately after the fetch. The analytics page header now wraps the 7d/30d/90d Tabs and a conditional Exportar CSV button in a flex div — the button renders only when `rawAlerts.length > 0`.

## Verification Results

- `npx tsc --noEmit`: 0 errors (passed after each task)
- `npm run build`: completed successfully, no new warnings
- All acceptance criteria checks passed for both tasks

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both export flows are fully wired. `rawAlerts` receives live data from Supabase on every `loadAnalytics()` call triggered by `timeRange` change or the `pw:alerts-changed` event.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 6efbc9f | feat(14-01): add date-range filter to alerts page |
| 2 | 58757cf | feat(14-01): add CSV export button to analytics page |

## Self-Check: PASSED

- FOUND: src/app/alerts/page.tsx
- FOUND: src/app/analytics/page.tsx
- FOUND: .planning/phases/14-csv-export/14-01-SUMMARY.md
- FOUND commit: 6efbc9f
- FOUND commit: 58757cf
