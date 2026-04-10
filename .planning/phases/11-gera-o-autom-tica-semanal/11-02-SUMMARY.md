---
phase: 11-gera-o-autom-tica-semanal
plan: "02"
subsystem: ai-insights
tags: [cron, automation, weekly-insights, ui-label, vercel]
dependency_graph:
  requires: [11-01-SUMMARY.md]
  provides: [weekly-cron-route, automatico-ui-label, source-aware-generations-api]
  affects: [src/app/api/cron/weekly-insights/route.ts, vercel.json, src/app/api/insights/generations/route.ts, src/app/dashboard/insights/page.tsx]
tech_stack:
  added: []
  patterns: [cron-secret-auth, dedup-window-6-days, tier-gate-business-agency, source-label-discriminator]
key_files:
  created:
    - src/app/api/cron/weekly-insights/route.ts
  modified:
    - vercel.json
    - src/app/api/insights/generations/route.ts
    - src/app/dashboard/insights/page.tsx
decisions:
  - "user_profiles uses id column (not user_id) for dedup query — matches generate/route.ts pattern"
  - "source fallback '?? manual' in API mapping provides graceful degradation if migration not yet applied"
  - "formatGenerationLabel helper centralizes source-aware label logic for reuse in both main and compare selectors"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-04-10"
  tasks_completed: 2
  files_changed: 4
---

# Phase 11 Plan 02: Weekly Cron and Automatico Label Summary

**One-liner:** Created weekly cron route at `/api/cron/weekly-insights` generating automatic insights for business+ users with 6-day dedup, scheduled Monday 12:00 UTC in vercel.json, with "Automatico" label in UI generation selector.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create weekly-insights cron route with deduplication and tier gate | e933842 | src/app/api/cron/weekly-insights/route.ts, vercel.json |
| 2 | Add source field to generations API and show Automatico label in UI | 6ee7a2d | src/app/api/insights/generations/route.ts, src/app/dashboard/insights/page.tsx |

## What Was Built

### Cron Route (Task 1)

Created `src/app/api/cron/weekly-insights/route.ts`:
- GET handler with `Bearer ${CRON_SECRET}` authorization
- Queries `user_profiles` for `business` and `agency` tier users only
- Per-user 6-day dedup: checks `insight_generation_log` for recent successful generation
- Calls `generateInsightsForUser(user.id, 'automatic')` for eligible users
- Per-user try/catch — individual failures do not block other users
- Returns `{ processed, generated, skipped, errors, details }` response

Updated `vercel.json`:
- Added `{ "path": "/api/cron/weekly-insights", "schedule": "0 12 * * 1" }` (Monday 12:00 UTC)
- All 3 existing crons preserved: check-status, weekly-report, weekly-insights

### UI and API Updates (Task 2)

Updated `src/app/api/insights/generations/route.ts`:
- Changed select query from `'id, generated_at'` to `'id, generated_at, source'`
- Added `source: (l as any).source ?? 'manual'` to generation mapping (graceful degradation)

Updated `src/app/dashboard/insights/page.tsx`:
- Added `source?: string` to `Generation` interface
- Added `formatGenerationLabel(gen: Generation)` helper function
  - Returns `Automatico — seg, 07/04/2026` for automatic generations
  - Returns `DD/MM/YYYY HH:mm` for manual generations
- Applied `formatGenerationLabel(g)` in main header selector and compare mode Column B selector

## Decisions Made

- **user_profiles id column:** The `user_profiles` table primary key is `id` (equals auth user id), confirmed by `generate/route.ts` pattern. Used `user.id` in dedup query without aliasing.
- **source fallback `?? 'manual'`:** Handles the edge case where the migration has not been applied to a given environment — pre-existing generations display with the correct default.
- **formatGenerationLabel centralized:** Single helper function used in both selectors ensures consistent label format across the entire page, including compare mode.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All functionality wired end-to-end.

## Self-Check: PASSED

- src/app/api/cron/weekly-insights/route.ts: FOUND (commit e933842)
- vercel.json contains "0 12 * * 1" schedule: FOUND (commit e933842)
- src/app/api/insights/generations/route.ts contains source field: FOUND (commit 6ee7a2d)
- src/app/dashboard/insights/page.tsx contains "Automatico": FOUND (commit 6ee7a2d)
- TypeScript: PASSED (npx tsc --noEmit with no errors)
- Build: Compiled successfully (pre-existing Telegram route runtime error unrelated to this plan)
