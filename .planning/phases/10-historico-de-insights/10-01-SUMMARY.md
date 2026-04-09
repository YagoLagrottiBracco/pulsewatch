---
phase: 10-historico-de-insights
plan: 01
subsystem: api
tags: [supabase, postgres, next.js, ai-insights, generation-tracking]

# Dependency graph
requires:
  - phase: 09-rastreamento-de-acoes
    provides: recommendation_actions table and insight actions API patterns

provides:
  - generation_id FK column on ai_insights linking rows to their batch
  - GET /api/insights/generations endpoint returning sorted list with insight counts
  - generation_id filter on GET /api/insights endpoint
  - Log-first generation pattern ensuring every insight batch has a traceable ID

affects:
  - 10-02-ui (will use generations endpoint and generation_id filter)
  - 11-geracao-automatica (will propagate generation_id in cron-triggered generations)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Log-first insert: insert generation log before batch insert to capture UUID for FK propagation"
    - "Two-query count: fetch generation logs then counts separately (Pitfall 6 — avoids GROUP BY complexity)"
    - "Nullable FK with ON DELETE SET NULL: backward compatible with pre-Phase-10 data"

key-files:
  created:
    - supabase/migrations/20260409000000_add_generation_id_to_ai_insights.sql
    - src/app/api/insights/generations/route.ts
  modified:
    - src/app/api/insights/generate/route.ts
    - src/app/api/insights/route.ts

key-decisions:
  - "Log-first pattern (D-02): insight_generation_log inserted before ai_insights batch to capture UUID"
  - "Nullable generation_id (D-01): no backfill of existing data, ON DELETE SET NULL for safety"
  - "Two-query approach for counts (Pitfall 6): fetch logs then counts separately for reliability"
  - "Filter success=true in generations endpoint (D-12): failed generations not shown to user"

patterns-established:
  - "Log-first insert: always insert the parent log row first, capture .select('id').single(), propagate to child rows"
  - "Additive query filters: use conditional .eq() chains on existing query builder without breaking defaults"

requirements-completed: [HIST-01]

# Metrics
duration: 3min
completed: 2026-04-09
---

# Phase 10 Plan 01: Backend Foundation for Histórico de Insights Summary

**Nullable generation_id FK added to ai_insights with log-first generation pattern, enabling batch traceability via new GET /api/insights/generations endpoint**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-09T22:22:57Z
- **Completed:** 2026-04-09T22:25:01Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- SQL migration adds nullable `generation_id UUID` FK to `ai_insights` with index, backward-compatible with all existing data
- `POST /api/insights/generate` now inserts log entry first, captures UUID, and spreads `generation_id` into every insight row in the batch
- New `GET /api/insights/generations` endpoint returns `[{ id, generated_at, insight_count }]` sorted by `generated_at DESC`, filtered to success=true, gated to business/agency tiers
- `GET /api/insights` accepts optional `?generation_id=<uuid>` filter while preserving all existing behavior when absent

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration adding generation_id FK + index to ai_insights** - `064ab68` (feat)
2. **Task 2: Refactor generate/route.ts to insert log FIRST and propagate generation_id** - `a391d3f` (feat)
3. **Task 3: Add ?generation_id filter to GET /api/insights + create GET /api/insights/generations** - `cbf14b1` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified

- `supabase/migrations/20260409000000_add_generation_id_to_ai_insights.sql` - Nullable generation_id FK column + index on ai_insights
- `src/app/api/insights/generate/route.ts` - Log-first insert order with generation_id propagation to all insight rows
- `src/app/api/insights/route.ts` - Added optional ?generation_id query param filter
- `src/app/api/insights/generations/route.ts` - New endpoint returning sorted list of generations with insight counts

## Decisions Made

- **Log-first pattern (D-02):** Insert `insight_generation_log` before the `ai_insights` batch to capture the auto-generated UUID. This is the only safe ordering since we need the FK value before inserting child rows.
- **Nullable FK (D-01):** No backfill of existing rows. Pre-Phase-10 insights display without a generation badge in the UI (handled in Phase 10-02).
- **Two-query approach:** Fetching counts via `.in('generation_id', ids)` separately instead of a JOIN/GROUP BY — avoids Supabase PostgREST GROUP BY complexity (Pitfall 6).
- **success=true filter:** Failed generation attempts are excluded from the user-facing generations list (Open Question 2 resolution).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed on first attempt. TypeScript compiled cleanly after all three tasks.

## User Setup Required

The migration `20260409000000_add_generation_id_to_ai_insights.sql` must be applied to the Supabase database before the new functionality is active. Run via `supabase db push` or apply through the Supabase dashboard.

## Known Stubs

None - this plan is backend-only. No UI rendering or data display implemented here.

## Next Phase Readiness

- All API primitives ready for Phase 10-02 (UI implementation)
- Generations list endpoint ready to populate the generation selector dropdown
- generation_id filter ready to reload insights when user selects a past generation
- Failure-path logging in generate route unchanged — catch block still records success=false rows

---
*Phase: 10-historico-de-insights*
*Completed: 2026-04-09*
