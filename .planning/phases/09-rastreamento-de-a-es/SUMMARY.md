---
phase: 09-rastreamento-de-acoes
plan: 01
subsystem: insights
tags: [recommendation-tracking, optimistic-update, action-status, ui]
dependency_graph:
  requires: [ai_insights table, shadcn/ui Select component]
  provides: [recommendation_actions table, POST /api/insights/actions, actions field in GET /api/insights, TodayCard UI, status dropdowns]
  affects: [src/app/dashboard/insights/page.tsx, src/app/api/insights/route.ts]
tech_stack:
  added: [recommendation_actions Supabase table]
  patterns: [optimistic update with per-key debounce, useMemo derived state, RLS via JOIN]
key_files:
  created:
    - supabase/migrations/20260401000000_add_recommendation_actions.sql
    - src/types/recommendation-actions.ts
    - src/app/api/insights/actions/route.ts
  modified:
    - src/app/api/insights/route.ts
    - src/app/dashboard/insights/page.tsx
decisions:
  - "UPSERT uses onConflict: insight_id,rec_index — requires UNIQUE constraint in migration"
  - "Absent row in recommendation_actions = implicit pending status (no bulk insert on insight generation)"
  - "TodayCard derives from useMemo over [insights, actionsMap] — no extra API call"
  - "Per-key debounce 300ms prevents race conditions when user changes status rapidly"
  - "Ownership verified server-side before upsert (defense in depth beyond RLS)"
metrics:
  duration: ~25min
  completed: 2026-04-01
  tasks_completed: 5
  files_changed: 5
---

# Phase 09 Plan 01: Rastreamento de Ações Summary

**One-liner:** Full recommendation status tracking with optimistic updates, per-key debounce, TodayCard derived from React state, and RLS via JOIN pattern in Supabase.

## What Was Implemented

### Task 1 — Migration: recommendation_actions table
Created `supabase/migrations/20260401000000_add_recommendation_actions.sql` with:
- `recommendation_actions` table (id, insight_id FK→ai_insights, rec_index, status, updated_at)
- `UNIQUE(insight_id, rec_index)` constraint required for `.upsert({ onConflict: ... })`
- `ON DELETE CASCADE` to auto-clean when an insight is deleted
- RLS enabled with 3 policies (SELECT/INSERT/UPDATE) using `EXISTS` subquery via `ai_insights.user_id` — no direct `user_id` column on the table

### Task 2 — TypeScript types
Created `src/types/recommendation-actions.ts` exporting:
- `ActionStatus` — union type for 4 statuses
- `RecommendationAction` — row shape from the DB join
- `TodayAction` — shape for items in the "O que fazer hoje" card
- `InsightsWithActionsResponse` — extended GET response type
- `UpsertActionBody` — POST request body type

### Task 3 — POST /api/insights/actions
Created `src/app/api/insights/actions/route.ts`:
- Authenticates user, validates all fields
- Verifies insight ownership before upsert (server-side defense beyond RLS)
- UPSERT with `onConflict: 'insight_id,rec_index'` — idempotent on rapid re-submits

### Task 4 — Extend GET /api/insights
Modified `src/app/api/insights/route.ts`:
- After loading insights, fetches matching `recommendation_actions` rows in a single extra query
- Returns `actions` array in the JSON response (absent rows = implicit pending)

### Task 5 — UI integration in insights/page.tsx
Rewrote `src/app/dashboard/insights/page.tsx` with:
- `actionsMap` state (`Record<string, ActionStatus>`) keyed by `insightId:recIndex`
- `updateStatus()` — optimistic update + per-key debounce 300ms + rollback with toast on error
- `todayActions` — `useMemo` over `[insights, actionsMap]`, top 3 pending/in_progress sorted high→medium→low
- "O que fazer hoje" card positioned above stats cards, always visible when insights exist
- Status `Select` dropdown inline in each recommendation card (next to priority badge)
- "X/Y concluídas" `Badge` in each insight card header (counts only `done` status, not ignored)

## Verification Results

- TypeScript: `tsc --noEmit --skipLibCheck` — 0 errors
- Migration file exists: OK
- Types file exists: OK
- API endpoint exists: OK
- UNIQUE constraint in migration: OK
- ON DELETE CASCADE in migration: OK
- `actionsMap` state in page: OK
- "O que fazer hoje" card in page: OK
- POST handler exported from actions route: OK

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Cleanup] Removed unused icon imports**
- **Found during:** Task 5 post-verification
- **Issue:** `Circle`, `Clock3`, `MinusCircle` (STATUS_ICON map constants from the plan spec) and `TabsContent` were imported but not used in the JSX render
- **Fix:** Removed the 4 unused imports
- **Files modified:** `src/app/dashboard/insights/page.tsx`
- **Commit:** 730b4a1

## Known Stubs

None — all features are fully wired. The `actionsMap` is populated from the API response on page load and updated optimistically on every status change. The TodayCard derives from live React state.

## Self-Check: PASSED

Files verified:
- FOUND: supabase/migrations/20260401000000_add_recommendation_actions.sql
- FOUND: src/types/recommendation-actions.ts
- FOUND: src/app/api/insights/actions/route.ts
- FOUND: src/app/api/insights/route.ts (modified)
- FOUND: src/app/dashboard/insights/page.tsx (modified)

Commits verified:
- 957dfa3: feat(09): add recommendation_actions migration with RLS policies
- dbc3407: feat(09): add TypeScript types for recommendation actions
- 64a997f: feat(09): add POST /api/insights/actions UPSERT endpoint
- 2a315f3: feat(09): extend GET /api/insights to return actions field
- 4e347ae: feat(09): integrate action tracking UI in insights page
- 730b4a1: feat(09): remove unused icon imports from insights page
