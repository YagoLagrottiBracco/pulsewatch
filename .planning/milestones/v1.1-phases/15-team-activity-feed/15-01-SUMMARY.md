---
phase: 15-team-activity-feed
plan: 01
subsystem: database
tags: [supabase, rls, audit-logs, postgres, typescript]

# Dependency graph
requires:
  - phase: 09-rastreamento-de-acoes
    provides: audit_logs table with existing RLS policies and AuditActions constants
  - phase: 14-alert-filters
    provides: markAsRead function in alerts/page.tsx
provides:
  - ALERT_VIEWED action constant in AuditActions
  - logAudit call in markAsRead for automatic viewed tracking
  - Additive RLS policy granting owners SELECT on team members' audit_logs
  - Performance index on account_members for RLS subquery
affects: [15-team-activity-feed-02, any phase reading audit_logs for team activity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Additive RLS policy pattern: new policies extend existing access without replacing them
    - Partial index on account_members for active-user-only filtering in RLS subquery

key-files:
  created:
    - supabase/migrations/20260415000000_add_team_activity_rls.sql
  modified:
    - src/lib/audit-logger.ts
    - src/app/alerts/page.tsx

key-decisions:
  - "RLS policy uses subquery in account_members (not SECURITY DEFINER function) -- simpler for SELECT-only access pattern"
  - "Policy filters status = 'active' AND user_id IS NOT NULL to exclude pending invites and removed members"
  - "logAudit call placed before loadAlerts() in markAsRead success branch -- audit failure is silently swallowed by try/catch in logAudit"

patterns-established:
  - "Additive RLS pattern: new team-access policies extend existing user-scoped policies, both coexist via OR semantics"
  - "Performance index pattern: partial index WHERE user_id IS NOT NULL matches exact filter in RLS subquery"

requirements-completed: [TEAM-02]

# Metrics
duration: 8min
completed: 2026-04-15
---

# Phase 15 Plan 01: Team Activity Feed Backend Prerequisites Summary

**ALERT_VIEWED audit action added to AuditActions, wired into markAsRead, and additive Supabase RLS policy created granting owners SELECT on active team members' audit_logs**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-15T00:00:00Z
- **Completed:** 2026-04-15T00:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `ALERT_VIEWED: 'alert.viewed'` to `AuditActions` in `audit-logger.ts`
- Updated `markAsRead` in `alerts/page.tsx` to call `logAudit` with `ALERT_VIEWED` after a successful alert update
- Created `supabase/migrations/20260415000000_add_team_activity_rls.sql` with additive RLS policy and performance index

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ALERT_VIEWED to audit logger and wire into markAsRead** - `7e60b70` (feat)
2. **Task 2: Create Supabase migration for team audit logs RLS policy** - `400cc8d` (feat)

## Files Created/Modified

- `src/lib/audit-logger.ts` - Added `ALERT_VIEWED: 'alert.viewed'` to `AuditActions` object
- `src/app/alerts/page.tsx` - Updated `markAsRead` to call `logAudit` with `ALERT_VIEWED` on successful update
- `supabase/migrations/20260415000000_add_team_activity_rls.sql` - Additive RLS policy + partial performance index

## Decisions Made

- Used a subquery in account_members directly in the USING clause rather than a SECURITY DEFINER function -- simpler for a SELECT-only access pattern and sufficient performance with the partial index.
- Partial index `WHERE user_id IS NOT NULL` mirrors the exact filter in the RLS subquery, avoiding index scan over pending-invite rows.
- `logAudit` is called before `loadAlerts()` in the success branch; silent error handling in `logAudit` ensures UI flow is never interrupted by audit failures.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

The migration `20260415000000_add_team_activity_rls.sql` must be applied to the Supabase project. Run:

```bash
supabase db push
```

Or apply via the Supabase dashboard SQL editor.

## Next Phase Readiness

- Backend prerequisites for team activity feed are complete
- `ALERT_VIEWED` events will be written to `audit_logs` on each `markAsRead` call
- RLS policy enables Phase 15 Plan 02 (feed UI) to query team members' audit_logs without bypassing row-level security
- No blockers for Plan 02

---
*Phase: 15-team-activity-feed*
*Completed: 2026-04-15*
