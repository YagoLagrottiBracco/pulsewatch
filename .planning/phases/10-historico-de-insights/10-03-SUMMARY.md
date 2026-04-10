---
phase: 10-historico-de-insights
plan: 03
subsystem: ui
tags: [react, next.js, shadcn-ui, compare-mode, generation-history, side-by-side]

# Dependency graph
requires:
  - phase: 10-historico-de-insights/10-02
    provides: selectedGenerationId state, generations array, formatGenerationDate helper, generation Select in header

provides:
  - compareMode boolean state toggled via Comparar / Sair da comparação buttons
  - compareGenerationId state (null = latest, UUID = specific generation)
  - compareInsights state for independent column B data
  - fetchCompareInsights() function for column B data fetching
  - renderInsightColumn() helper for shared insight card rendering in both columns
  - 2-column responsive grid (grid-cols-1 lg:grid-cols-2) in compare mode
  - Column B generation selector defaulting to latest

affects:
  - All future plans that modify src/app/dashboard/insights/page.tsx

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "renderInsightColumn helper: inner function inside component that renders column header badge + optional B-selector + insight card list; called twice in compare mode"
    - "enterCompareMode fetches column B immediately (null = latest) to avoid empty state on activation"
    - "exitCompareMode resets compareGenerationId=null AND compareInsights=[] to prevent dirty state on re-entry (Pitfall 5)"
    - "actionsMap shared across both columns: globally unique insight UUIDs make merging safe (Pitfall 4)"
    - "Main generation Select disabled during compareMode to prevent selectedGenerationId from changing while compare is active"
    - "generateInsights also calls exitCompareMode() so user sees clean single-column view after new generation"

key-files:
  created: []
  modified:
    - src/app/dashboard/insights/page.tsx

key-decisions:
  - "Keep existing single-column inline render for non-compare path: minimizes churn and preserves all behavior from Plan 10-02 exactly"
  - "Delete in compare mode only removes from insights (column A) state: acceptable limitation; column B uses compareInsights which has its own independent fetch"
  - "Main selector disabled during compareMode: prevents selectedGenerationId from changing while user is in compare view, avoiding confusing state combinations"
  - "exitCompareMode called on new generation: ensures user returns to clean single-column 'Atual' view after generating new insights"

requirements-completed: [HIST-02]

# Metrics
duration: 10min
completed: 2026-04-10
---

# Phase 10 Plan 03: Compare Mode Summary

**Side-by-side generation compare mode added to insights page with independent column selectors, responsive 2-column grid, and shared actionsMap across both columns**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-10T03:37:25Z
- **Completed:** 2026-04-10T03:47:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- `compareMode` boolean state toggled by "Comparar" button (visible only when `selectedGenerationId !== null && !compareMode`) and "Sair da comparação" button
- "Comparar" button activates compare mode and immediately fetches column B data (defaulting to latest generation) via `fetchCompareInsights(null)`
- "Sair da comparação" resets `compareMode=false`, `compareGenerationId=null`, `compareInsights=[]` — no dirty state on re-entry
- `renderInsightColumn()` inner function handles column header badge (Atual vs Histórico - DD/MM/YYYY HH:mm), optional column B generation selector, and full insight card rendering including recommendations with action selects
- Two-column grid uses `grid-cols-1 lg:grid-cols-2` — on lg+ screens columns appear side-by-side, on mobile they stack vertically (no horizontal scroll)
- Column B selector defaults to "Mais recente (atual)" and independently calls `fetchCompareInsights(newId)` on change
- `actionsMap` remains a single shared state — insight UUIDs are globally unique, so merging actions from both columns is safe (Pitfall 4)
- Main generation selector is disabled while `compareMode` is active to prevent `selectedGenerationId` from changing during compare
- `generateInsights()` calls `exitCompareMode()` after success so user returns to clean single-column "Atual" view

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract InsightColumn render helper, add compare state, render compare buttons + 2-col grid** - `c1bb170` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified

- `src/app/dashboard/insights/page.tsx` — Added compareMode/compareGenerationId/compareInsights/compareLoading state, fetchCompareInsights(), enterCompareMode(), exitCompareMode(), handleCompareGenerationChange(), renderInsightColumn() helper, Comparar/Sair buttons in header, conditional compare grid in insights list section

## Decisions Made

- **Kept existing single-column inline render for non-compare path:** The `renderInsightColumn` helper is used only in compare mode. The non-compare branch preserves the existing inline render from Plan 10-02 verbatim. This minimizes churn and reduces regression risk.
- **Delete in compare mode only affects column A:** `deleteInsight()` mutates only the `insights` state (column A). Column B (`compareInsights`) is unaffected. This is an accepted limitation — deleting from column B would require a separate handler and is not required by the plan. Documented in Known Stubs/Limitations.
- **Main selector disabled during compareMode:** Prevents `selectedGenerationId` from changing while the user is viewing a compare layout, which would create a confusing state (column A data changes but column B stays). User must exit compare mode first to change the primary generation.
- **exitCompareMode called on new generation:** After generating new insights the user snap-backs to single-column "Atual" view. Compare mode is also exited to ensure a clean state.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

The worktree branch (`worktree-agent-acd92ac4`) was 24 commits behind master, missing Phase 10-02 changes. Resolved by fast-forwarding via `git merge master --no-edit` before implementing. This is expected worktree initialization behavior.

## User Setup Required

None — all changes are frontend-only UI. Backend endpoints from Plan 10-01 (GET /api/insights?generation_id=, GET /api/insights/generations) must remain active (already deployed in Plan 10-01).

## Known Stubs

None — compare mode fetches real generation data from existing API endpoints. Column B defaults to latest (real data), not a stub.

**Known Limitation (not a stub):** Clicking the Trash2 delete button in column B (compare column) removes the insight from the `insights` (column A) state, not from `compareInsights`. This means the card disappears from column A but remains in column B until page reload. This is an edge case with minimal UX impact and was explicitly accepted in the plan: "accept that delete in compare mode only affects column A."

## Self-Check: PASSED

- `src/app/dashboard/insights/page.tsx`: FOUND (modified)
- `useState(false)` for compareMode: FOUND (line 101)
- `useState<string | null>(null)` for compareGenerationId: FOUND (line 102)
- `useState<Insight[]>([])` for compareInsights: FOUND (line 103)
- `fetchCompareInsights` function: FOUND (line ~143)
- `enterCompareMode`: FOUND (line 195)
- `exitCompareMode`: FOUND (line 200), resets compareGenerationId=null AND compareInsights=[]
- `Comparar` button conditionally rendered when `selectedGenerationId !== null && !compareMode`: FOUND (lines 803-806)
- `Sair da comparação` button conditionally rendered when `compareMode`: FOUND (lines 808-811)
- `grid-cols-1 lg:grid-cols-2`: FOUND (line 959)
- Column B Select with `value={compareGenerationId ?? 'latest'}` and `onValueChange={handleCompareGenerationChange}`: FOUND (lines 440-452)
- `actionsMap` useState count: 1 (verified via grep)
- `npx tsc --noEmit`: PASSED (no output = no errors)
- commit c1bb170 (Task 1): FOUND

---
*Phase: 10-historico-de-insights*
*Completed: 2026-04-10*
