---
phase: 13
plan: 01
name: loss-calculator-widget
subsystem: landing-page
tags: [landing-page, calculator, conversion, client-component]
dependency_graph:
  requires: []
  provides: [loss-calculator-widget]
  affects: [landing-page]
tech_stack:
  added: []
  patterns: [client-component, live-calculation, BRL-formatting]
key_files:
  created:
    - src/components/loss-calculator.tsx
  modified:
    - src/app/page.tsx
decisions:
  - Calculator is a separate Client Component to avoid converting entire landing page to use client
  - Revenue parsing strips non-numeric except comma/period for BRL-style input (e.g. "50.000")
  - 720 hours divisor (30d * 24h) for monthly-to-hourly conversion
metrics:
  duration: 74s
  completed: 2026-04-15
  tasks_completed: 2
  files_changed: 2
---

# Phase 13 Plan 01: Loss Calculator Widget Summary

**One-liner:** Interactive BRL loss calculator with hourly downtime and 20% drop figures, wired into landing page as a standalone Client Component.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create LossCalculator client component | e6d51ba | src/components/loss-calculator.tsx |
| 2 | Wire LossCalculator into landing page | 558695d | src/app/page.tsx |

## What Was Built

### LossCalculator component (`src/components/loss-calculator.tsx`)

- Client Component with `'use client'` directive
- Input: monthly revenue in BRL, accepts "50.000" style formatting
- Live calculation: hourly loss = `monthlyRevenue / 720`
- Live calculation: 20% drop impact = `monthlyRevenue * 0.20`
- Results formatted with `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Two result cards: destructive/red theme for hourly loss, orange theme for drop impact
- CTA button linking to `/auth/signup` with gradient matching rest of landing page
- Shows "R$ 0,00" when input is empty or zero

### Landing page integration (`src/app/page.tsx`)

- Import added: `import { LossCalculator } from '@/components/loss-calculator'`
- Section inserted between Stats section and Features section
- Section has `id="calculator"` for anchor link support
- Section uses `className="container py-24"` consistent with other sections

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — calculator uses live computation, no hardcoded placeholder data.

## Self-Check: PASSED

- FOUND: src/components/loss-calculator.tsx
- FOUND: commit e6d51ba (create LossCalculator client component)
- FOUND: commit 558695d (wire LossCalculator into landing page)
