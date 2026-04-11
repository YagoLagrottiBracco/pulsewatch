---
phase: 11-gera-o-autom-tica-semanal
plan: "01"
subsystem: ai-insights
tags: [refactor, service-extraction, migration, cron-foundation]
dependency_graph:
  requires: [10-03-SUMMARY.md]
  provides: [generateInsightsForUser, InsightSource, source-column-migration]
  affects: [src/services/ai-insights.ts, src/app/api/insights/generate/route.ts]
tech_stack:
  added: []
  patterns: [service-role-client, log-first-insert, source-column-discriminator]
key_files:
  created:
    - supabase/migrations/20260410000000_add_source_column_to_insights.sql
  modified:
    - src/services/ai-insights.ts
    - src/app/api/insights/generate/route.ts
decisions:
  - "InsightSource type with 3 values covers Phase 11 (automatic) and Phase 12 (alert_triggered) in one migration"
  - "generateInsightsForUser uses service role client so it works from both auth routes and cron context"
  - "Log-first pattern preserved in shared function — insert insight_generation_log before ai_insights batch"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-04-10"
  tasks_completed: 2
  files_changed: 3
---

# Phase 11 Plan 01: Source Column Migration and Service Extraction Summary

**One-liner:** Extracted `generateInsightsForUser(userId, source)` service function with `InsightSource` type discriminator and `source` column migration, enabling shared generation logic for cron and manual routes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create migration adding source column to ai_insights and insight_generation_log | 3f69dbb | supabase/migrations/20260410000000_add_source_column_to_insights.sql |
| 2 | Extract generateInsightsForUser into ai-insights.ts service and update generate route | dff192b | src/services/ai-insights.ts, src/app/api/insights/generate/route.ts |

## What Was Built

### Migration (Task 1)

Created `supabase/migrations/20260410000000_add_source_column_to_insights.sql`:
- `ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'`
- `ALTER TABLE insight_generation_log ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'`
- Indexes on both tables for source-based filtering
- All pre-existing rows receive `'manual'` via DEFAULT — no backfill needed

### Service Extraction (Task 2)

Added to `src/services/ai-insights.ts`:
- `export type InsightSource = 'manual' | 'automatic' | 'alert_triggered'`
- `export async function generateInsightsForUser(userId, source)` — standalone function using service role client, propagating source to both log and insight inserts, preserving log-first insert pattern

Simplified `src/app/api/insights/generate/route.ts`:
- Auth, rate limit (check_insight_rate_limit RPC), and tier gate (business/agency) preserved
- Generation + insert logic replaced with single call: `generateInsightsForUser(user.id, 'manual')`
- Response simplified to return insightCount and generationId

## Decisions Made

- **InsightSource covers 3 phases in one migration:** `'manual'` (existing), `'automatic'` (Phase 11 cron), `'alert_triggered'` (Phase 12) — avoids a second migration later
- **Service role client in shared function:** Required so the function works from both authenticated routes (Phase 11-01) and unauthenticated cron routes (Phase 11-02)
- **Log-first pattern preserved:** `insight_generation_log` insert happens before `ai_insights` batch insert to capture UUID for FK propagation — same as Phase 10 decision D-02

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All functionality wired end-to-end.

## Self-Check: PASSED

- supabase/migrations/20260410000000_add_source_column_to_insights.sql: FOUND
- src/services/ai-insights.ts modified with generateInsightsForUser: FOUND (commit dff192b)
- src/app/api/insights/generate/route.ts simplified: FOUND (commit dff192b)
- Build: PASSED (no TypeScript errors)
