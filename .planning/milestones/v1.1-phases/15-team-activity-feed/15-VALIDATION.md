---
phase: 15
slug: team-activity-feed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — manual browser testing only |
| **Config file** | none |
| **Quick run command** | `npm run type-check` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~30s (type-check), ~60s (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run type-check`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Build verde + manual browser test com dois usuários (owner + membro)
- **Max feedback latency:** 60 seconds (automated), manual testes adicionais

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| T1 | 15-01 | 1 | TEAM-02 | manual + type-check | `npm run type-check` | audit-logger.ts, alerts/page.tsx | pending |
| T2 | 15-01 | 1 | TEAM-01 | manual + type-check | `npm run type-check` | activity/page.tsx | pending |
| T3 | 15-01 | 1 | TEAM-01, TEAM-03 | manual + build | `npm run build` | migration SQL | pending |

---

## Human Verification Checklist

Antes do `/gsd:verify-work` — testar com dois usuários (owner + membro ativo):

- [ ] **TEAM-02**: Membro clica em alerta (markAsRead) → ação gravada em `audit_logs` automaticamente
- [ ] **TEAM-01**: Owner acessa `/activity` → aba "Time" visível; aba não aparece para membro/viewer
- [ ] **TEAM-01**: Feed do time lista ações dos membros com email, ação legível e timestamp
- [ ] **TEAM-03**: Cada entrada mostra claramente quem fez o quê e quando
- [ ] Owner aparece como "Você" se sua própria ação aparecer no feed (se incluído)
- [ ] Feed vazio exibe estado vazio correto: "Nenhuma atividade do time ainda"
- [ ] Build passa: `npm run build` exit 0
