---
phase: 15-team-activity-feed
plan: 02
subsystem: ui
tags: [react, nextjs, supabase, tabs, radix-ui, lucide-react, rls, audit-logs]

# Dependency graph
requires:
  - phase: 15-team-activity-feed-01
    provides: ALERT_VIEWED action constant, RLS policy granting owners SELECT on team audit_logs, logAudit call in markAsRead
  - phase: 09-rastreamento-de-acoes
    provides: audit_logs table with existing RLS policies and AuditActions constants
provides:
  - Tabs UI on /activity page (Minha Atividade / Time) for account owners
  - isOwner detection via account_members subquery (null-safe, no flash)
  - Team feed query: audit_logs filtered by alert.% actions for active member user_ids
  - getRelativeTime helper: relative timestamps (ha Xmin / ha Xh / ha X dias)
  - getTeamActionIcon function: Eye/Archive/Trash2 for viewed/dismissed/deleted
  - alert.viewed label in getActionLabel map
  - Lazy load guard: team feed only fetched on Time tab click (teamLoaded flag)
  - Loading / error / empty states for team tab
affects: [any phase extending /activity page, team management UI phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conditional Tabs pattern: isOwner null = loading (no flash), true = tabs, false = direct content
    - Lazy tab load pattern: onValueChange handler + teamLoaded flag prevents re-fetch on tab switch
    - Enrich-at-query pattern: emailMap built from account_members, merged onto audit_log rows client-side
    - Relative time helper: inline pure function, no library dependency

key-files:
  created: []
  modified:
    - src/app/activity/page.tsx

key-decisions:
  - "isOwner null state prevents UI flash: tabs only render after ownership check resolves, never on initial render"
  - "Team feed lazy-loaded on tab click (not page mount) to avoid unnecessary Supabase query for owners who never view the tab"
  - "emailMap built client-side from account_members join rather than a server-side SQL join — simpler query, sufficient for 50-entry feed"
  - "myActivityContent extracted as JSX variable to reuse across three render branches (loading, owner, non-owner) without duplication"

patterns-established:
  - "Conditional Tabs pattern: null/true/false isOwner drives three render branches — avoids tab flash on ownership check"
  - "Lazy load with loaded guard: onValueChange + teamLoaded boolean prevents duplicate fetches on tab switch"

requirements-completed: [TEAM-01, TEAM-03]

# Metrics
duration: 2min
completed: 2026-04-16
---

# Phase 15 Plan 02: Team Activity Feed UI Summary

**Owner-only Tabs UI on /activity page with lazy-loaded team feed showing member email, action label, and relative timestamp per audit log entry**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-16T02:16:23Z
- **Completed:** 2026-04-16T02:18:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Refactored `src/app/activity/page.tsx` with Tabs (Minha Atividade / Time) rendered only for account owners
- Added isOwner detection via `account_members` subquery (null during check = no tab flash)
- Team feed loaded lazily on "Time" tab click via `onValueChange` + `teamLoaded` guard flag
- Team log entries enriched client-side with member email from `account_members`; owner's own entries show "Voce"
- Added `getRelativeTime` helper: ha Xmin / ha Xh / ha X dias / absolute date fallback
- Added `getTeamActionIcon`: Eye for viewed, Archive for dismissed, Trash2 for deleted
- Added `'alert.viewed': 'Visualizou alerta'` to `getActionLabel` label map
- Non-owners see existing activity log without any tab chrome
- Loading, error, and empty states all handled in team tab

## Task Commits

1. **Task 1: Refactor activity page with tabs, owner detection, and team feed** - `a8841c2` (feat)

## Files Created/Modified

- `src/app/activity/page.tsx` - Complete rewrite: adds Tabs, isOwner detection, team feed query, relative time, new icons, lazy load, all states

## Decisions Made

- `isOwner` uses a null/true/false tri-state to prevent tabs from flashing before ownership check resolves. Page renders existing content until `isOwner` settles.
- Team feed lazy-loaded on tab click rather than page mount — avoids a Supabase round-trip for owners who never switch to the "Time" tab.
- `emailMap` built client-side from `account_members` result, merged onto audit_log rows — simpler than a SQL join and adequate for a 50-entry feed.
- `myActivityContent` extracted as a JSX variable shared across three render branches (isOwner null, true, false) to avoid duplicating the existing log list JSX.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The migration from Plan 01 (`20260415000000_add_team_activity_rls.sql`) must be applied for RLS to work; that was documented in 15-01-SUMMARY.md.

## Known Stubs

None - all UI paths are wired to live Supabase queries. The team feed renders real data from `account_members` and `audit_logs`.

## Next Phase Readiness

- Phase 15 (team-activity-feed) is now complete — both backend prerequisites and UI are delivered
- Owners can view team member alert activity on /activity under the "Time" tab
- Non-owners are not exposed to the tab chrome or any team data
- No blockers for subsequent phases

---
*Phase: 15-team-activity-feed*
*Completed: 2026-04-16*
