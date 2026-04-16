# Phase 11: Auto Weekly AI Insights — Plan

**Goal:** Business+ users receive AI insights automatically every Monday without manual intervention
**Requirements:** INS-01, INS-02, INS-03, INS-04
**Status:** Ready to execute

---

## Overview

The backend for this phase is **already fully implemented**. The cron endpoint
`/api/cron/weekly-insights/route.ts` exists, performs tier filtering (business/agency only),
deduplicates via `insight_generation_log` (6-day window), generates insights with
`source='automatic'`, and is already registered on cron-job.org (Mondays 11h BRT / 12h UTC).

The `source` column exists on both `ai_insights` and `insight_generation_log` (migration
`20260410000000_add_source_column_to_insights.sql`).

**The only code change required is UI:** the `formatGenerationLabel` function in
`src/app/dashboard/insights/page.tsx` currently renders the label for automatic generations
as a plain string `"Automatico — …"` (with a typo). It must be replaced by a visual
badge/chip component that renders `"Geração automática"` inline with the date.

This phase has two tasks:
1. Replace `formatGenerationLabel` with a `renderGenerationLabel` component that returns
   JSX, adding a colored badge for automatic generations (INS-03).
2. End-to-end verification of the full automatic cycle using the existing cron endpoint
   (INS-01, INS-02, INS-04).

**Out of scope (per CONTEXT.md decisions):**
- Registering the cron on cron-job.org (already done)
- Refactoring the insights generation service
- Push/email notifications for automatic generation
- Admin dashboard showing generation statistics

---

## Tasks

### Task 1: Replace `formatGenerationLabel` with a JSX badge component (INS-03)

**Files:**
- `src/app/dashboard/insights/page.tsx`

**What:**
The current `formatGenerationLabel(gen: Generation): string` function returns a plain string.
`SelectItem` renders its children as text, so a visual badge cannot be embedded directly
inside `<SelectItem>`. The pattern used must work within Radix UI's `SelectItem` which
accepts React children (not just strings).

Replace the string-returning function with a JSX-returning component and update all two
call sites (lines ~564 and ~916).

**Why:** Satisfies INS-03 — automatic generations appear in history with a visible
"geração automática" label that visually distinguishes them from manual generations.

**Step-by-step implementation:**

1. **Remove** the `formatGenerationLabel` function (lines 502–511).

2. **Add** a `renderGenerationLabel` helper that returns `React.ReactNode`:

```tsx
const renderGenerationLabel = (gen: Generation): React.ReactNode => {
  const date = new Date(gen.generated_at);

  if (gen.source === 'automatic') {
    const dateStr = date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return (
      <span className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Clock className="h-3 w-3" />
          Geração automática
        </span>
        <span>{dateStr}</span>
      </span>
    );
  }

  if (gen.source === 'alert_triggered') {
    const dateStr = date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <span className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="h-3 w-3" />
          Por alerta
        </span>
        <span>{dateStr}</span>
      </span>
    );
  }

  // Manual (default) — no badge, just date
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

Note: `Clock` and `AlertTriangle` are already imported (both are in the existing import
at the top of the file). No new imports are needed.

3. **Update both call sites** (there are exactly two `{formatGenerationLabel(g)}` usages
   in the file — one inside the Column B compare selector around line 564, one inside the
   primary generation selector around line 916):

   Change:
   ```tsx
   {formatGenerationLabel(g)} ({g.insight_count})
   ```
   To:
   ```tsx
   {renderGenerationLabel(g)} ({g.insight_count})
   ```

4. **Verify the color style** is consistent with the design system. The existing badge
   patterns in the file use `bg-red-500/10 text-red-500 border-red-500/20` (high priority),
   `bg-yellow-500/10 text-yellow-500 border-yellow-500/20` (medium), and
   `bg-green-500/10 text-green-500 border-green-500/20` (low). The same pattern with
   blue (`bg-blue-500/10 text-blue-600 border-blue-500/20`) matches the design system.
   Use this exact pattern — do NOT introduce new Tailwind classes outside of this palette.

**Verification:**
- Open the insights page in the browser
- If there are existing automatic generations in `insight_generation_log`, the dropdown
  should now show a blue chip labeled "Geração automática" next to the date
- Manual generations show only the date (no chip)
- The typo "Automatico" must not appear anywhere in the rendered UI

---

### Task 2: End-to-end verification of the automatic cycle (INS-01, INS-02, INS-04)

**Files:** No code changes — this is a verification task against the existing backend.

**What:**
Manually trigger the cron endpoint to confirm the full cycle works: tier gate, deduplication,
generation with `source='automatic'`, and that the result appears in the UI with the new badge.

**Why:** Satisfies INS-01 (generation happens automatically), INS-02 (no duplicate if already
generated), and INS-04 (free/pro users are excluded). The backend exists but has never been
verified end-to-end in this phase.

**Step-by-step verification:**

**Step 2a — Verify INS-04: tier gate**

Check the cron query restricts to business/agency only:

```bash
# In route.ts line 43-46:
# .in('subscription_tier', ['business', 'agency'])
# This is correct — free and pro are excluded.
```

Read `src/app/api/cron/weekly-insights/route.ts` lines 43–46 to confirm the query.
No code change needed if it matches the above.

**Step 2b — Trigger the cron locally**

```bash
curl -X GET http://localhost:3000/api/cron/weekly-insights \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected response (first call for a business+ user with no recent generation):
```json
{
  "success": true,
  "processed": N,
  "generated": N,
  "skipped": 0,
  "errors": 0,
  "details": [...],
  "timestamp": "..."
}
```

**Step 2c — Verify INS-02: deduplication**

Immediately trigger the cron again (same session, within 6 days):

```bash
curl -X GET http://localhost:3000/api/cron/weekly-insights \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected response (second call — deduplication blocks):
```json
{
  "success": true,
  "processed": N,
  "generated": 0,
  "skipped": N,
  "errors": 0,
  "details": [{"user_id": "...", "skipped": true, "reason": "generated_within_6_days"}]
}
```

**Step 2d — Verify INS-01 and INS-03: result appears in UI with badge**

1. Open `/dashboard/insights`
2. Open the generation history dropdown (top-right selector)
3. The most recent entry should show the blue "Geração automática" badge + the date from
   the automatic generation just triggered
4. Selecting that entry should load the insights generated by the cron

**Step 2e — Verify INS-04: free/pro user exclusion**

Query the database directly or check the `details` array from the cron response.
Users with `subscription_tier = 'free'` or `'pro'` must not appear in `details`.

If a test free/pro user exists:
```sql
SELECT id, subscription_tier FROM user_profiles WHERE subscription_tier IN ('free', 'pro');
```
Confirm none of those IDs appear in the cron response `details`.

---

## Verification

### INS-01: Auto generation on Monday

**How to verify:**
Trigger `GET /api/cron/weekly-insights` with `Authorization: Bearer $CRON_SECRET`.
Response must include `"success": true` and `"generated": N` where N > 0 (for a business+
user who hasn't generated in the past 6 days).

The cron is already registered on cron-job.org at 11h BRT / 12h UTC every Monday.
Automatic execution on next Monday will produce a new entry in `insight_generation_log`
with `source='automatic'` and `success=true`.

**Expected DB state after successful run:**
```sql
SELECT source, success, generated_at
FROM insight_generation_log
WHERE source = 'automatic'
ORDER BY generated_at DESC
LIMIT 5;
```

### INS-02: Deduplication

**How to verify:**
Trigger the cron twice in quick succession (within 6 days).

First call: `generated > 0`, `skipped = 0`
Second call: `generated = 0`, `skipped > 0`, `reason = "generated_within_6_days"`

The deduplication window is 6 days — checked via `insight_generation_log.generated_at >= now() - interval '6 days'`
where `success = true`.

### INS-03: "Geração automática" label

**How to verify:**
1. Open `/dashboard/insights` in the browser
2. Open the generation history dropdown
3. Any generation with `source = 'automatic'` must show a blue rounded chip labeled
   "Geração automática" with a clock icon, plus the generation date
4. Manual generations (`source = 'manual'`) show only the date — no chip
5. The word "Automatico" (with or without accent) must not appear in the UI

**Automated check:**
```bash
# Search for the old typo — must return no results after Task 1
grep -n "Automatico" src/app/dashboard/insights/page.tsx
```
Expected: no matches.

### INS-04: Tier gate (business+ only)

**How to verify:**
Read `src/app/api/cron/weekly-insights/route.ts` lines 43–46.

The query must be:
```typescript
.in('subscription_tier', ['business', 'agency'])
```

This is already correct. Only users with `business` or `agency` tier are fetched.
Free and pro users never appear in the processing loop.

---

## Success Criteria

All four criteria from ROADMAP.md must be true:

1. **Auto generation works end-to-end:** A business+ user who has not manually generated
   insights sees a new insight entry triggered by the cron, with `source='automatic'` in
   `insight_generation_log` and `ai_insights`.

2. **Visual label in history:** The automatic insight appears in the history dropdown with
   a blue "Geração automática" badge chip, visually distinguishable from manual generations.

3. **No duplicates:** If the user already generated insights within the last 6 days, a
   second cron call returns `skipped > 0` and `generated = 0` for that user.

4. **Tier gate:** Free and pro users are not included in the cron processing loop. Only
   `business` and `agency` tier users are processed.

---

## Constraints and Notes

- **No cron code in the application.** Cron scheduling is managed entirely via cron-job.org.
  The endpoint `/api/cron/weekly-insights` only responds to authenticated HTTP requests.
  Do NOT introduce `node-cron`, `setInterval`, or any in-process scheduling.

- **No new dependencies.** All UI components needed (`Badge`, `Clock` icon) are already
  imported in `insights/page.tsx`. The badge is implemented with Tailwind utility classes
  following the existing `bg-{color}-500/10` pattern — no new Radix UI primitives required.

- **Backend is final.** Do NOT rewrite or refactor `weekly-insights/route.ts` or
  `ai-insights.ts`. The only code change in this phase is the UI label in `insights/page.tsx`.

- **Error behavior is silent.** Automatic generation failures are already caught and logged
  in `insight_generation_log` with `success=false`. No user-facing notification is needed
  on failure. Retry happens automatically the following Monday (deduplication only blocks
  on `success=true` entries).

- **Stack:** Next.js 14, TypeScript, TailwindCSS, Radix UI (SelectItem accepts JSX children).
