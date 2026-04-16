---
phase: 11-auto-weekly-ai-insights
verified: 2026-04-14T23:59:00Z
status: human_needed
score: 4/4 must-haves verified (1 requires runtime confirmation)
re_verification: false
human_verification:
  - test: "INS-01 runtime end-to-end: trigger cron and confirm generated > 0"
    expected: "GET /api/cron/weekly-insights with Authorization: Bearer $CRON_SECRET returns {success:true, generated: N>0} for a business+ user with no recent generation"
    why_human: "Requires a live dev server with a real business+ user in the database and CRON_SECRET set in env — cannot simulate without running the stack"
  - test: "INS-03 visual badge render in browser"
    expected: "History dropdown shows blue rounded chip labeled 'Geracao automatica' with Clock icon next to the date for automatic generations; manual generations show plain date only"
    why_human: "JSX is correct and substantive in code but visual rendering inside Radix UI SelectItem cannot be confirmed without a browser — SelectItem accepts React children so the pattern is valid"
---

# Phase 11: Auto Weekly AI Insights — Verification Report

**Phase Goal:** Business+ users receive AI insights automatically every Monday without manual intervention
**Verified:** 2026-04-14T23:59:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| #  | Truth                                                                                      | Status      | Evidence                                                                                          |
|----|--------------------------------------------------------------------------------------------|-------------|---------------------------------------------------------------------------------------------------|
| 1  | A business+ user sees a new insight entry on Monday, generated automatically               | ? UNCERTAIN | Cron endpoint fully implemented and wired; runtime confirmation requires live server (human test) |
| 2  | Automatic insight appears in history with visible "geracao automatica" label               | ✓ VERIFIED  | `renderGenerationLabel` returns blue JSX badge at both call sites; "Automatico" typo absent       |
| 3  | No duplicate entry if user already generated in the last 6 days                            | ✓ VERIFIED  | Deduplication logic confirmed in route.ts lines 63-76 with 6-day window and `success=true` gate  |
| 4  | Free and pro users do not receive automatic generation — only business+ is processed       | ✓ VERIFIED  | route.ts line 46: `.in('subscription_tier', ['business', 'agency'])` — pro/free never fetched    |

**Score:** 3/4 truths fully verified by static analysis; 1/4 requires runtime confirmation

---

## Required Artifacts

| Artifact                                               | Expected                                           | Status      | Details                                                                                    |
|--------------------------------------------------------|----------------------------------------------------|-------------|--------------------------------------------------------------------------------------------|
| `src/app/api/cron/weekly-insights/route.ts`            | Cron handler with tier gate, dedup, source tag     | ✓ VERIFIED  | 91 lines; auth check, business/agency filter, 6-day dedup, calls `generateInsightsForUser` with `source='automatic'` |
| `src/app/dashboard/insights/page.tsx`                  | UI with `renderGenerationLabel` JSX badge          | ✓ VERIFIED  | Function at line 502 returns `React.ReactNode`; two call sites at lines 603 and 955        |
| `src/app/api/insights/generations/route.ts`            | Generations API that returns `source` field        | ✓ VERIFIED  | Query selects `source` from `insight_generation_log`; maps `source` into response shape    |
| `src/services/ai-insights.ts`                          | Shared service accepting `InsightSource` parameter | ✓ VERIFIED  | `InsightSource = 'manual' \| 'automatic' \| 'alert_triggered'`; source written to both tables |
| `supabase/migrations/20260410000000_add_source_column_to_insights.sql` | Migration adding `source` column      | ✓ VERIFIED  | Adds `source TEXT NOT NULL DEFAULT 'manual'` to `ai_insights` and `insight_generation_log` |

---

## Key Link Verification

| From                              | To                                    | Via                                          | Status     | Details                                                                               |
|-----------------------------------|---------------------------------------|----------------------------------------------|------------|---------------------------------------------------------------------------------------|
| `weekly-insights/route.ts`        | `ai-insights.ts`                      | `generateInsightsForUser(user.id,'automatic')` | ✓ WIRED   | Called at route.ts line 79; service accepts `InsightSource` and writes source to DB  |
| `insights/page.tsx`               | `/api/insights/generations`           | `fetch('/api/insights/generations')` line 130 | ✓ WIRED   | Response populates `generations` state via `setGenerations(data.generations)`        |
| `generations/route.ts`            | `insight_generation_log` (Supabase)   | `.select('id, generated_at, source')`        | ✓ WIRED    | Source field is explicitly selected and mapped into response at line ~68              |
| `renderGenerationLabel` function  | `generations` state (page.tsx)        | `gen.source === 'automatic'` conditional      | ✓ WIRED   | Called at both SelectItem sites (lines 603, 955); `gen.source` flows from API        |
| `weekly-insights/route.ts`        | cron-job.org scheduler                | External HTTP call (Mondays 12h UTC)         | ? EXTERNAL | No vercel.json cron config — scheduling is entirely external at cron-job.org; cannot verify programmatically |

---

## Data-Flow Trace (Level 4)

| Artifact                    | Data Variable | Source                             | Produces Real Data     | Status      |
|-----------------------------|---------------|------------------------------------|------------------------|-------------|
| `insights/page.tsx` (labels) | `gen.source`  | `insight_generation_log.source` column | DB field written by cron | ✓ FLOWING  |
| `weekly-insights/route.ts`  | `users`       | `user_profiles.subscription_tier` | Real DB query          | ✓ FLOWING   |
| `weekly-insights/route.ts`  | `recentGen`   | `insight_generation_log`           | Real DB query with date filter | ✓ FLOWING |

---

## Behavioral Spot-Checks

| Behavior                              | Command                                                                                       | Result          | Status  |
|---------------------------------------|-----------------------------------------------------------------------------------------------|-----------------|---------|
| Old typo "Automatico" absent          | `grep -n "Automatico" src/app/dashboard/insights/page.tsx`                                    | No matches      | ✓ PASS  |
| `renderGenerationLabel` defined       | `grep -n "renderGenerationLabel" src/app/dashboard/insights/page.tsx`                         | 3 occurrences (def + 2 call sites) | ✓ PASS |
| `formatGenerationLabel` removed       | `grep -n "formatGenerationLabel" src/app/dashboard/insights/page.tsx`                         | No matches      | ✓ PASS  |
| Tier gate query correct               | `grep -n "subscription_tier.*business.*agency" src/app/api/cron/weekly-insights/route.ts`    | Line 46 confirmed | ✓ PASS |
| Dedup uses success=true filter        | `grep -n "success.*true" src/app/api/cron/weekly-insights/route.ts`                           | Line 69 confirmed | ✓ PASS |
| `source='automatic'` passed to service | `grep -n "automatic" src/app/api/cron/weekly-insights/route.ts`                              | Line 79 confirmed | ✓ PASS |
| Commit 619f841 exists                 | `git show --stat 619f841`                                                                      | Confirmed feat commit modifying insights/page.tsx | ✓ PASS |
| Runtime end-to-end (cron triggers generation) | `curl GET /api/cron/weekly-insights -H "Authorization: Bearer $CRON_SECRET"`         | Cannot run without server | ? SKIP |

---

## Requirements Coverage

| Requirement | Source Plan | Description                                                                 | Status           | Evidence                                                                                   |
|-------------|-------------|-----------------------------------------------------------------------------|------------------|--------------------------------------------------------------------------------------------|
| INS-01      | Phase 11    | Sistema gera insights automaticamente toda segunda-feira para lojas business+ | ? NEEDS HUMAN   | Cron endpoint exists and is fully implemented; runtime test required to confirm end-to-end |
| INS-02      | Phase 11    | Geracao automatica e deduplicada — nao gera se ja gerou nos ultimos 6 dias  | ✓ SATISFIED      | Dedup logic at route.ts lines 63-76: 6-day window, `success=true` filter, `skipped++` path |
| INS-03      | Phase 11    | Geracoes automaticas aparecem no historico com label "geracao automatica"   | ✓ SATISFIED      | `renderGenerationLabel` returns blue badge JSX; `source` flows from DB through API to UI  |
| INS-04      | Phase 11    | Gate de tier: apenas business+ recebe geracao automatica                    | ✓ SATISFIED      | `.in('subscription_tier', ['business', 'agency'])` at route.ts line 46                    |

**Orphaned requirements:** None. All four INS-01..INS-04 are mapped to Phase 11 in both REQUIREMENTS.md and the plan.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/api/insights/generations/route.ts` | ~68 | `(l as any).source` cast | Info | Type cast needed because Supabase auto-generated types may not include the newly added `source` column yet — not a logic bug, but worth updating types after migration runs |

No blockers or stubs detected. The `return { processed: 0, ... }` at route.ts line 49 is a legitimate early-exit guard (when no business+ users exist), not a stub.

---

## Human Verification Required

### 1. INS-01 Runtime End-to-End

**Test:** Start the dev server with CRON_SECRET set in `.env.local`. Ensure at least one user with `subscription_tier = 'business'` or `'agency'` exists and has no entry in `insight_generation_log` within the last 6 days. Then run:

```bash
curl -X GET http://localhost:3000/api/cron/weekly-insights \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Expected:** Response includes `"success": true`, `"generated": N` where N > 0, and `"skipped": 0`. A new row appears in `insight_generation_log` with `source = 'automatic'` and `success = true`.

**Why human:** Requires a running Next.js server, a seeded Supabase instance with a business+ user, and the CRON_SECRET environment variable — none of which can be simulated by static analysis.

### 2. INS-03 Visual Badge in Browser

**Test:** After triggering the cron (test 1 above), open `/dashboard/insights` in the browser while logged in as the business+ user. Open the generation history dropdown (top-right selector).

**Expected:** The most recent entry shows a blue rounded chip labeled "Geracao automatica" with a clock icon to its left, followed by the generation date. Manual generations (if any) show only the date with no chip.

**Why human:** JSX structure is correct and substantive in code, but visual rendering inside a Radix UI `SelectItem` (particularly the flex layout and color of the badge) can only be confirmed in a browser.

---

## Gaps Summary

No gaps blocking the phase goal. All code artifacts exist, are substantive, are wired, and data flows through the full chain. The two items flagged for human verification are runtime/visual confirmations of already-correct code — they do not indicate missing implementation.

The absence of a `vercel.json` cron config is intentional: the project decision (documented in CONTEXT.md and MEMORY) is to manage scheduling via cron-job.org, not Vercel's native cron. This is not a gap.

---

_Verified: 2026-04-14T23:59:00Z_
_Verifier: Claude (gsd-verifier)_
