---
phase: 13
slug: loss-calculator-on-landing-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (Next.js project) |
| **Config file** | vitest.config.ts or next.config.js |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx next build 2>&1 \| tail -5` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx next build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | LAND-01 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | LAND-02 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 2 | LAND-03 | build | `npx next build` | ❌ W0 | ⬜ pending |
| 13-01-04 | 01 | 2 | LAND-04 | build | `npx next build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/loss-calculator.tsx` — client component stub (empty return, 'use client')
- [ ] Verify `TrendingDown` import from `lucide-react` resolves

*Existing infrastructure (TypeScript, Next.js build) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time calculation updates as user types | LAND-01 | UI interaction | Type "50.000" in input → verify hourly loss card shows R$ value immediately |
| R$ prefix displays correctly (not doubled) | LAND-01 | Rendering edge case | Type value → verify prefix appears once as a text element, not duplicated |
| CTA appears only when value is present | LAND-04 | Conditional render | Load page → verify CTA hidden; type value → verify CTA appears |
| Visual language matches landing page | LAND-03 | Visual QA | Compare fonts, spacing, card style with existing sections |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
