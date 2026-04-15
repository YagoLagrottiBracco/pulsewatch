---
phase: 12
slug: post-alert-guided-diagnosis
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — purely visual component, no test framework in project |
| **Config file** | none |
| **Quick run command** | `grep -n "DIAGNOSIS_CHECKLISTS\|O que fazer agora" src/app/alerts/page.tsx` |
| **Full suite command** | Manual visual inspection in browser at `/alerts` |
| **Estimated runtime** | ~5 seconds (grep check) |

---

## Sampling Rate

- **After every task commit:** Run `grep -n "DIAGNOSIS_CHECKLISTS\|O que fazer agora" src/app/alerts/page.tsx` to confirm the structure is in place.

---

## Validation Architecture

This phase adds a purely presentational component with no async logic, no API calls, and no DB changes. Validation is structural (grep-based) + visual (browser).

### Static checks (automated)
1. `DIAGNOSIS_CHECKLISTS` constant exists in `alerts/page.tsx`
2. All three keys present: `downtime`, `stock_low`, `sales_drop`
3. Each key maps to an array with at least 4 items
4. The card render block is gated on `alert.severity === 'critical'`
5. The typo "Automatico" is not introduced (not applicable here — carried from Phase 11)

### Visual checks (manual)
1. A critical alert of type `downtime` shows the "O que fazer agora" card with its checklist
2. A critical alert of type `stock_low` shows a different checklist
3. A critical alert of type `sales_drop` shows a different checklist
4. A non-critical alert (severity != critical) does NOT show the card
5. An alert of an unmapped type does NOT show the card (no crash)

---

## Acceptance Gate

Phase is complete when:
- All static grep checks pass
- Visual inspection confirms the card renders correctly for all 3 types
- No JS console errors on the `/alerts` page
