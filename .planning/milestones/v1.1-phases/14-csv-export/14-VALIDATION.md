---
phase: 14
slug: csv-export
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — TypeScript type-checking only |
| **Config file** | none |
| **Quick run command** | `npm run type-check` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~30 seconds (type-check), ~60 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run type-check`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full build must be green + manual browser download test
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| T1 | 14-01 | 1 | EXP-01 | manual + type-check | `npm run type-check` | alerts/page.tsx | pending |
| T2 | 14-01 | 1 | EXP-02 | manual + type-check | `npm run type-check` | analytics/page.tsx | pending |
| T3 | 14-01 | 1 | EXP-03 | manual (Network tab) | `npm run build` | both pages | pending |

---

## Human Verification Checklist

Before `/gsd:verify-work`:

- [ ] EXP-01: On alerts page, set date range De/Até and click "Aplicar Filtro" — verify only alerts within range appear
- [ ] EXP-01: Click "Exportar CSV" — verify downloaded file contains only alerts from selected period
- [ ] EXP-02: On analytics page, click "Exportar CSV" — verify file downloads with alert data for current timeRange
- [ ] EXP-03: Open Network tab, trigger both exports — verify no HTTP requests are made during download
- [ ] Build is green: `npm run build` exits 0
