---
phase: 12-post-alert-guided-diagnosis
plan: 01
subsystem: ui
tags: [react, nextjs, tailwindcss, lucide-react, shadcn-ui]

# Dependency graph
requires:
  - phase: v1.0-alerts
    provides: alerts system with severity and type fields already in DB
provides:
  - DIAGNOSIS_CHECKLISTS constant with 3 typed checklist entries (downtime, stock_low, sales_drop)
  - AlertDiagnosisCard presentational component (src/components/alerts/)
  - Conditional inline rendering on /alerts page for critical alerts
affects: [phase-13, phase-14, phase-15]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lookup map pattern: Record<string, {title, items}> keyed by alert type for type-specific UI content"
    - "Pure presentational component with no business logic extracted into src/components/alerts/"
    - "Conditional inline render guard: severity === 'critical' && DIAGNOSIS_CHECKLISTS[alert.type]"

key-files:
  created:
    - src/lib/alert-checklists.ts
    - src/components/alerts/alert-diagnosis-card.tsx
  modified:
    - src/app/alerts/page.tsx

key-decisions:
  - "Checklist content is hard-coded in a constant (no DB table, no API call) — static per alert type"
  - "Unmapped alert types silently skip the card — no crash, no fallback UI"
  - "Card uses border-t pt-4 inside existing Card to separate visually from the actions row"
  - "Orange theme (bg-orange-500/5, border-orange-500/20, text-orange-700) distinguishes diagnosis from primary card content"

patterns-established:
  - "Alert-type lookup map: DIAGNOSIS_CHECKLISTS[alert.type] — extend for new types without page-level changes"
  - "src/components/alerts/ — directory for alert-specific presentational components"

requirements-completed: [ALERT-01, ALERT-02, ALERT-03]

# Metrics
duration: 5min
completed: 2026-04-15
---

# Phase 12 Plan 01: Post-Alert Guided Diagnosis Summary

**Inline "O que fazer agora" diagnosis checklists rendered on /alerts for critical alerts, covering downtime, stock_low, and sales_drop with 6-7 actionable steps each**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-15T03:02:16Z
- **Completed:** 2026-04-15T03:07:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `src/lib/alert-checklists.ts` with `DIAGNOSIS_CHECKLISTS` constant containing 3 alert type entries (downtime: 6 items, stock_low: 6 items, sales_drop: 7 items) with proper Portuguese text and accents
- Created `src/components/alerts/alert-diagnosis-card.tsx` as a pure presentational component with CardContent + border-t, orange-themed background, Wrench icon, and ordered checklist list
- Wired `AlertDiagnosisCard` into `src/app/alerts/page.tsx` with a severity + type gate — only critical alerts with a mapped type render the card; non-critical and unmapped types silently skip

## Task Commits

Each task was committed atomically:

1. **Task 1: Create checklist data constant and AlertDiagnosisCard component** - `e2bcc4b` (feat)
2. **Task 2: Wire AlertDiagnosisCard into the alerts page for critical alerts** - `865615b` (feat)

## Files Created/Modified

- `src/lib/alert-checklists.ts` — DIAGNOSIS_CHECKLISTS constant with 3 typed checklist entries
- `src/components/alerts/alert-diagnosis-card.tsx` — Pure presentational component (Wrench icon, ordered list, orange theme)
- `src/app/alerts/page.tsx` — Added imports and conditional render inside filteredAlerts.map()

## Decisions Made

- Hard-coded checklist content in a constant (no DB table) — consistent with D-04 decision from CONTEXT.md
- Used lookup map pattern (`DIAGNOSIS_CHECKLISTS[alert.type]`) so unmapped types return `undefined` and silently skip without crashing
- Orange color scheme (`bg-orange-500/5`, `border-orange-500/20`, `text-orange-700`) chosen to be visually distinct from existing blue (auto insights) and amber (alert triggered) badge colors

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 12 requirements ALERT-01, ALERT-02, ALERT-03 are satisfied
- The `src/components/alerts/` directory is established for future alert-specific UI components
- The lookup map pattern in `alert-checklists.ts` is easily extensible for new alert types
- Ready to proceed to Phase 13: Loss Calculator on Landing Page

---
## Self-Check: PASSED

- FOUND: src/lib/alert-checklists.ts
- FOUND: src/components/alerts/alert-diagnosis-card.tsx
- FOUND: .planning/phases/12-post-alert-guided-diagnosis/12-01-SUMMARY.md
- FOUND commit: e2bcc4b (Task 1)
- FOUND commit: 865615b (Task 2)
- FOUND commit: 0a92ddf (metadata)

---
*Phase: 12-post-alert-guided-diagnosis*
*Completed: 2026-04-15*
