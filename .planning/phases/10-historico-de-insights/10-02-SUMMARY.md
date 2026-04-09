---
phase: 10-historico-de-insights
plan: 02
subsystem: ui
tags: [react, next.js, shadcn-ui, select, badge, generation-history]

# Dependency graph
requires:
  - phase: 10-historico-de-insights/10-01
    provides: GET /api/insights/generations endpoint and generation_id filter on GET /api/insights

provides:
  - Generation selector dropdown in insights page header (hidden when no generations exist)
  - "Atual" / "Histórico - DD/MM/YYYY HH:mm" badge in page title reflecting selected generation
  - fetchGenerations() function calling GET /api/insights/generations on mount
  - fetchInsights(generationId) accepting nullable generationId and building URL with generation_id param
  - Loading opacity state on insights list during generation switch
  - Snap-back to latest generation after new insights are generated

affects:
  - 10-03-compare (will extend same page with compare mode UI)
  - 11-geracao-automatica (cron-generated insights will appear in selector on next page load)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fetchGenerations silent fail: if generations endpoint returns non-OK, selector is hidden — no user error shown (Pitfall 3)"
    - "generationId default param: fetchInsights(generationId = selectedGenerationId) allows explicit override without state race"
    - "Snap back on generate: setSelectedGenerationId(null) + fetchInsights(null) + fetchGenerations() ensures fresh state after new batch"

key-files:
  created: []
  modified:
    - src/app/dashboard/insights/page.tsx

key-decisions:
  - "Generation interface defined inline in page.tsx (not in types file) — local scope sufficient for a single-page component"
  - "Select hidden when generations.length === 0 — preserves pre-Phase-10 user experience (Pitfall 3)"
  - "generationsLoading applies opacity-50 + pointer-events-none to insights list — subtle visual feedback without full skeleton replacement"

patterns-established:
  - "Conditional fetch with URL override: build URL conditionally inside async function accepting nullable param, keeping default behavior when param is null"

requirements-completed: [HIST-01]

# Metrics
duration: 5min
completed: 2026-04-09
---

# Phase 10 Plan 02: Generation Selector UI Summary

**Generation selector dropdown + Atual/Histórico badge added to insights page, enabling historical generation browsing with loading state and automatic snap-back to latest after new generation**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-09T22:27:00Z
- **Completed:** 2026-04-09T22:30:06Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Generation selector dropdown appears in the insights page header whenever at least one generation exists; hidden otherwise to preserve pre-Phase-10 behavior
- Badge in title title dynamically shows "Atual" (variant=default) when on latest, or "Histórico - DD/MM/YYYY HH:mm" (variant=secondary) when viewing a past generation
- `fetchGenerations()` fetches `/api/insights/generations` on mount silently — if endpoint fails the selector is simply not shown, no error surfaced to user
- `fetchInsights(generationId)` accepts an optional nullable param; when null fetches current behavior (latest), when set appends `?generation_id=` to URL
- `generationsLoading` state applies `opacity-50 pointer-events-none` to insights list while a generation switch is in flight
- After `generateInsights()` succeeds: `fetchInsights(null)` then `fetchGenerations()` then `setSelectedGenerationId(null)` — snaps selector back to "Mais recente (atual)"

## Task Commits

Each task was committed atomically:

1. **Task 1: Add generation state + fetchGenerations + generationId-aware fetchInsights + Select UI + badge** - `817e06d` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified

- `src/app/dashboard/insights/page.tsx` - Added Generation interface, generation state (3 vars), fetchGenerations(), modified fetchInsights() signature and URL, modified generateInsights() snap-back, handleGenerationChange(), formatGenerationDate(), generation badge in title, Select dropdown in header, opacity loading on insights list

## Decisions Made

- **Generation interface inline:** Defined `interface Generation` directly in `page.tsx` rather than adding to `src/types/recommendation-actions.ts` — this type is page-local only and doesn't need to be shared with API routes or other components.
- **Silent fail for fetchGenerations:** If `/api/insights/generations` returns non-OK (e.g., pre-existing users with no generations), the selector is simply hidden. No error toast. Consistent with Pitfall 3 guidance.
- **flex-wrap on header divs:** Added `flex-wrap` to title h1 and action area divs to gracefully handle the additional UI elements at smaller viewport widths.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The worktree branch was at v1.0 milestone commit (3d0a0a1), missing Phase 9 (actionsMap, recommendation actions) and Phase 10-01 (backend foundation) commits. Resolved by fast-forwarding `worktree-agent-ac963192` branch to master (`644ed21`) via `git merge master --no-edit` before implementing the UI changes. This is expected worktree initialization behavior, not a code issue.

## User Setup Required

None - all UI changes are frontend-only. Backend endpoints from Plan 10-01 must be active (migration applied to Supabase, deployments updated) for the selector to populate. No new env vars required.

## Known Stubs

None — generation data is fetched from real API endpoints established in Plan 10-01. The selector shows actual generation history from `insight_generation_log`. When no generations exist, the selector is hidden (not a stub — intentional empty state per Pitfall 3).

## Next Phase Readiness

- Plan 10-03 (compare mode) can extend this page with `compareMode` boolean state and `compareGenerationId` state
- The `generations` state array and `selectedGenerationId` are already present and will be the data sources for the compare column header selects
- `formatGenerationDate` helper is available for column header labels in compare mode

## Self-Check: PASSED

- `src/app/dashboard/insights/page.tsx`: FOUND (modified)
- `interface Generation` in page.tsx: FOUND (line 37)
- `useState<Generation[]>([])`: FOUND (line 97)
- `selectedGenerationId`: FOUND (line 98)
- `fetchGenerations`: FOUND (line 108)
- `/api/insights/generations` in fetch: FOUND (line 110)
- `generation_id=${encodeURIComponent`: FOUND (line 123)
- `Histórico -` badge text: FOUND (line 475)
- `opacity-50 pointer-events-none`: FOUND (line 673)
- commit 817e06d (Task 1): FOUND
- `npx tsc --noEmit`: PASSED (no output = no errors)

---
*Phase: 10-historico-de-insights*
*Completed: 2026-04-09*
