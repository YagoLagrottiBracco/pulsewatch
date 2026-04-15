---
phase: 13
plan: 02
name: loss-calculator-gap-closure
subsystem: landing-page
tags: [landing-page, calculator, gap-closure, conditional-rendering]
dependency_graph:
  requires: [loss-calculator-widget]
  provides: [accumulated-estimate, gated-cta]
  affects: [src/components/loss-calculator.tsx]
tech_stack:
  added: []
  patterns: [conditional-rendering, derived-computation]
key_files:
  created: []
  modified:
    - src/components/loss-calculator.tsx
decisions:
  - Accumulated estimate placed between results grid and CTA for natural reading flow (numbers → consequence → action)
  - Both accumulated estimate box and full CTA section (paragraph + button + disclaimer) unified under a single hasValue gate
metrics:
  duration: 336s
  completed: 2026-04-15
  tasks_completed: 1
  files_changed: 1
---

# Phase 13 Plan 02: Loss Calculator Gap Closure Summary

**One-liner:** Added missing accumulated 5h/month downtime estimate and moved CTA button inside hasValue gate to close two verification failures from 13-VERIFICATION.md.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add accumulated estimate and gate CTA on hasValue | 51a5e1f | src/components/loss-calculator.tsx |

## What Was Built

### Gap 1 — Accumulated 5h/month estimate (Truth #4 restored)

- Added `const accumulated = hourlyLoss * 5` after the existing computations at line 33
- Added a new `{hasValue && (...)}` block between the results grid and the CTA section
- Block renders a destructive-themed rounded box with: "Com 5h/mês de downtime, sua perda estimada seria de {formatBRL(accumulated)}"
- Only visible when user has entered a valid revenue value

### Gap 2 — CTA button gated on hasValue (Truth #5 restored)

- Moved `<Link href="/auth/signup">...</Link>`, the contextual paragraph, and the disclaimer `<p>` inside a single `{hasValue && (<>...</>)}` fragment
- CTA button is now hidden until user enters a valid revenue value, matching the plan's intent

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — calculator uses live computation derived from user input. No hardcoded placeholder data.

## Self-Check: PASSED

- FOUND: src/components/loss-calculator.tsx (modified)
- FOUND: `const accumulated = hourlyLoss * 5` at line 33
- FOUND: `formatBRL(accumulated)` rendered inside hasValue block
- FOUND: `5h/mês` display text present
- FOUND: Link href="/auth/signup" inside hasValue conditional (line 142)
- FOUND: commit 51a5e1f in git log
- TypeScript: zero errors (npx tsc --noEmit passed)
- Build: passed (npm run build succeeded)
