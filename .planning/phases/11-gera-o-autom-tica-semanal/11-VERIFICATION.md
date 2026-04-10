---
phase: 11-gera-o-autom-tica-semanal
verified: 2026-04-10T17:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 11: Geração Automática Semanal — Verification Report

**Phase Goal:** Insights são gerados automaticamente toda segunda-feira para usuários business+ sem nenhuma ação manual
**Verified:** 2026-04-10T17:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria + Plan must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ai_insights table has a source column with default 'manual' | VERIFIED | Migration file `20260410000000_add_source_column_to_insights.sql` contains `ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'` |
| 2 | insight_generation_log table has a source column with default 'manual' | VERIFIED | Same migration file contains `ALTER TABLE insight_generation_log ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'` |
| 3 | generateInsightsForUser function exists in ai-insights.ts and accepts userId + source params | VERIFIED | `src/services/ai-insights.ts` lines 231-313: `export async function generateInsightsForUser(userId: string, source: InsightSource = 'manual')` fully implemented with Supabase inserts |
| 4 | generate/route.ts delegates to generateInsightsForUser instead of inline logic | VERIFIED | Line 76: `const { insightCount, generationId } = await generateInsightsForUser(user.id, 'manual')` — no `aiInsightsService.generateInsights` call found in route |
| 5 | Manual generation still works identically after refactor | VERIFIED | Route preserves auth (getUser), rate limit (check_insight_rate_limit RPC), and tier gate (business/agency check) before calling shared function |
| 6 | Cron route exists at /api/cron/weekly-insights and generates insights for business+ users | VERIFIED | `src/app/api/cron/weekly-insights/route.ts` exists (91 lines), queries `user_profiles` for `subscription_tier IN ('business', 'agency')`, calls `generateInsightsForUser(user.id, 'automatic')` |
| 7 | Cron skips users who already generated insights in the last 6 days | VERIFIED | Lines 60-76: computes `sixDaysAgo`, queries `insight_generation_log WHERE user_id = X AND generated_at >= sixDaysAgo AND success = true LIMIT 1`, continues on match with reason `'generated_within_6_days'` |
| 8 | Cron is scheduled every Monday at 12:00 UTC in vercel.json | VERIFIED | `vercel.json` line 17-19: `{ "path": "/api/cron/weekly-insights", "schedule": "0 12 * * 1" }` — all 3 existing crons (check-status, weekly-report) preserved |
| 9 | Automatic generations show as 'Automatico' in the generation selector | VERIFIED | `page.tsx` line 401-407: `formatGenerationLabel` returns `Automatico — {date}` when `gen.source === 'automatic'`; applied at lines 460 and 805 (both main selector and compare Column B selector) |

**Score:** 9/9 truths verified

---

## Required Artifacts

### Plan 11-01

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260410000000_add_source_column_to_insights.sql` | source column on ai_insights and insight_generation_log | VERIFIED | 14 lines, both ALTER TABLE statements present, indexes created, Phase 11 header comment present |
| `src/services/ai-insights.ts` | generateInsightsForUser reusable function | VERIFIED | 314 lines; exports `InsightSource` type, `generateInsightsForUser`, and `aiInsightsService`; uses service role client; source propagated to both DB tables |
| `src/app/api/insights/generate/route.ts` | Simplified manual generation route calling shared service | VERIFIED | 109 lines; calls `generateInsightsForUser(user.id, 'manual')`; no inline generation logic |

### Plan 11-02

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/api/cron/weekly-insights/route.ts` | Weekly cron endpoint for automatic insight generation | VERIFIED | 91 lines; exports `GET`; CRON_SECRET auth; business/agency tier gate; 6-day dedup; per-user try/catch |
| `vercel.json` | Cron schedule entry for weekly-insights | VERIFIED | 3 cron entries; `"0 12 * * 1"` schedule for `/api/cron/weekly-insights` |
| `src/app/api/insights/generations/route.ts` | Generations endpoint returning source field | VERIFIED | select query: `'id, generated_at, source'`; mapping: `source: (l as any).source ?? 'manual'` |
| `src/app/dashboard/insights/page.tsx` | UI showing 'Automatico' label for automatic generations | VERIFIED | `Generation` interface has `source?: string`; `formatGenerationLabel` present; applied in both selectors |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/insights/generate/route.ts` | `src/services/ai-insights.ts` | `import { generateInsightsForUser }` | WIRED | Line 3 import; line 76 call with `source='manual'` |
| `src/app/api/cron/weekly-insights/route.ts` | `src/services/ai-insights.ts` | `import { generateInsightsForUser }` + `source='automatic'` | WIRED | Line 3 import; line 79 call with `source='automatic'` |
| `vercel.json` | `/api/cron/weekly-insights` | crons config `0 12 * * 1` | WIRED | Schedule entry confirmed at line 17-19 |
| `src/app/api/insights/generations/route.ts` | `insight_generation_log` | select source column | WIRED | Line 39: `.select('id, generated_at, source')`; line 72: source mapped to response |
| `src/app/dashboard/insights/page.tsx` | Generation interface | source field conditional rendering | WIRED | `formatGenerationLabel` checks `gen.source === 'automatic'`; applied in both selectors (lines 460 and 805) |
| `src/services/ai-insights.ts` | supabase | service role client insert with source column | WIRED | Lines 278-282: `insert({ user_id: userId, success: true, source })`; lines 289-301: insightsToInsert includes `source` field |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `src/app/dashboard/insights/page.tsx` — generation selector | `generations` state (from `useEffect` fetch) | `/api/insights/generations` GET | Yes — queries `insight_generation_log` for real DB rows, maps source field from DB | FLOWING |
| `src/app/api/cron/weekly-insights/route.ts` | `users` | `user_profiles` table via service role client | Yes — `.from('user_profiles').select('id, subscription_tier').in('subscription_tier', ['business', 'agency'])` returns live DB rows | FLOWING |
| `src/app/api/cron/weekly-insights/route.ts` — dedup | `recentGen` | `insight_generation_log` table | Yes — `.from('insight_generation_log').select('id').eq(...).gte(...).eq('success', true).limit(1)` queries real DB | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Verification | Status |
|----------|-------------|--------|
| Cron route exports GET handler | `grep "export async function GET" src/app/api/cron/weekly-insights/route.ts` — found at line 6 | PASS |
| Cron AUTH check present | `Bearer ${process.env.CRON_SECRET}` check at line 10 | PASS |
| Tier gate filters business/agency | `.in('subscription_tier', ['business', 'agency'])` at line 46 | PASS |
| Dedup uses 6-day window | `sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)` at line 61 | PASS |
| source='automatic' passed to shared function | `generateInsightsForUser(user.id, 'automatic')` at line 79 | PASS |
| vercel.json schedule Monday 12:00 UTC | `"schedule": "0 12 * * 1"` confirmed | PASS |
| Generations API select includes source | `.select('id, generated_at, source')` at line 39 | PASS |
| UI formatGenerationLabel applied in compare selector | Line 460 and 805 in page.tsx | PASS |
| generate/route.ts no longer has inline aiInsightsService.generateInsights | grep confirms zero matches | PASS |
| check_insight_rate_limit preserved in generate/route.ts | Line 20 confirms RPC call present | PASS |

Step 7b: SKIPPED for cron route (requires running Vercel infrastructure); all behavioral checks above are static code-level confirmations.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTO-01 | 11-01-PLAN.md, 11-02-PLAN.md | Sistema gera insights automaticamente toda semana (segunda-feira) para usuários business+ sem intervenção manual | SATISFIED | Weekly cron at `0 12 * * 1` calls `generateInsightsForUser` for `business`/`agency` users automatically |
| AUTO-02 | 11-01-PLAN.md, 11-02-PLAN.md | Cron de geração semanal verifica se usuário já gerou insights nos últimos 6 dias antes de chamar a IA (deduplicação) | SATISFIED | `insight_generation_log` query with `gte('generated_at', sixDaysAgo.toISOString())` skips eligible users with reason `generated_within_6_days` |

**Orphaned requirements check:** No additional AUTO-* requirements in REQUIREMENTS.md map to Phase 11 beyond AUTO-01 and AUTO-02. No orphaned requirements.

---

## Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| None detected | — | — | All phase-11 files scanned; no TODO/FIXME/placeholder/stub patterns found |

Scan covered:
- `supabase/migrations/20260410000000_add_source_column_to_insights.sql` — pure SQL, no stubs
- `src/services/ai-insights.ts` (generateInsightsForUser section) — full implementation, no empty returns
- `src/app/api/insights/generate/route.ts` — delegate pattern, not a stub
- `src/app/api/cron/weekly-insights/route.ts` — full processing loop, no placeholder logic
- `src/app/api/insights/generations/route.ts` — real DB query with source field
- `src/app/dashboard/insights/page.tsx` — formatGenerationLabel with real conditional logic

---

## Human Verification Required

### 1. End-to-End Cron Execution

**Test:** Invoke `GET /api/cron/weekly-insights` with `Authorization: Bearer {CRON_SECRET}` against a staging/production environment that has at least one `business` or `agency` user profile.
**Expected:** Response `{ success: true, processed: N, generated: M, skipped: K, errors: 0 }` with insights appearing in the user's history selector showing "Automatico" label.
**Why human:** Requires live Vercel/Supabase environment, real CRON_SECRET, and real business-tier user data. Cannot be verified statically.

### 2. 6-Day Deduplication Behavior

**Test:** After a business user has a successful generation, trigger the cron again within 6 days and confirm that user appears in the `skipped` array with `reason: 'generated_within_6_days'`.
**Expected:** The user is skipped and no duplicate generation log entry is created.
**Why human:** Requires controlling database state (existing recent generation) and triggering the cron endpoint in a live environment.

### 3. "Automatico" Label Display in UI

**Test:** As a business user with at least one automatic generation in history, open the insights page and inspect the generation selector dropdown.
**Expected:** Automatic generations are labeled `Automatico — seg, DD/MM/YYYY` and manual ones show `DD/MM/YYYY HH:mm`. The compare mode Column B selector shows the same formatting.
**Why human:** Requires a real browser session with real data containing both `source='automatic'` and `source='manual'` generation log entries.

---

## Commit Traceability

All phase-11 commits confirmed in git history:

| Commit | Description | Files |
|--------|-------------|-------|
| 3f69dbb | Source column migration (ai_insights + insight_generation_log) | migration SQL |
| dff192b | Extract generateInsightsForUser + simplify generate/route.ts | ai-insights.ts, generate/route.ts |
| e933842 | Weekly cron route + vercel.json schedule | cron route, vercel.json |
| 6ee7a2d | Source field in generations API + Automatico label in UI | generations/route.ts, insights page.tsx |

---

## Summary

Phase 11 goal is fully achieved. All 9 observable truths are verified against the actual codebase:

- The database schema supports the `source` discriminator column on both `ai_insights` and `insight_generation_log` with no backfill required (DEFAULT 'manual').
- The `generateInsightsForUser(userId, source)` shared function is substantive (full data-fetch + AI generation + log-first DB insert pipeline) and wired into both the manual route (`source='manual'`) and the cron route (`source='automatic'`).
- The weekly cron at `/api/cron/weekly-insights` is correctly scheduled (`0 12 * * 1`), enforces CRON_SECRET auth, gates to `business`/`agency` users, deduplicates against a 6-day window, and handles per-user failures gracefully.
- The generations API returns the `source` field, and the UI `formatGenerationLabel` helper correctly branches on `gen.source === 'automatic'` and is applied in both the main selector and compare mode Column B selector.

Requirements AUTO-01 and AUTO-02 are both SATISFIED with no orphaned requirements.

Three human verification items remain for live-environment confirmation (cron invocation, dedup behavior, and UI label rendering with real data).

---

_Verified: 2026-04-10T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
