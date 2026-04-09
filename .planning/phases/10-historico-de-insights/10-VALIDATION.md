---
phase: 10
slug: historico-de-insights
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project has no test config files or test directories |
| **Config file** | none |
| **Quick run command** | N/A — manual only |
| **Full suite command** | N/A — manual only |
| **Estimated runtime** | N/A |

---

## Sampling Rate

- **After every task commit:** Manual smoke test via browser (dev server)
- **After every plan wave:** Full manual scenario walkthrough per requirement
- **Before `/gsd:verify-work`:** All manual verifications in table below must be checked
- **Max feedback latency:** N/A (no automated tests)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | HIST-01 | manual | N/A | N/A | ⬜ pending |
| 10-01-02 | 01 | 1 | HIST-01 | manual | N/A | N/A | ⬜ pending |
| 10-01-03 | 01 | 2 | HIST-01 | manual | N/A | N/A | ⬜ pending |
| 10-01-04 | 01 | 2 | HIST-02 | manual | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test infrastructure exists in this project. Manual verification is the established pattern (consistent with Phases 8 and 9). No Wave 0 test setup required.

*Existing infrastructure covers all phase requirements via manual verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GET /api/insights/generations retorna lista de gerações para usuário business autenticado | HIST-01 | No test infra | Abrir DevTools → Network → chamar `/api/insights/generations` após login com usuário business |
| GET /api/insights?generation_id=X filtra insights corretamente | HIST-01 | No test infra | Chamar endpoint com um generation_id válido e verificar que apenas insights daquela geração são retornados |
| Select de gerações na UI carrega e muda corretamente | HIST-01 | No test infra | Abrir página de insights → verificar dropdown de gerações → selecionar geração histórica → confirmar que insights mudam |
| Modo comparação ativa 2 colunas (desktop) | HIST-02 | No test infra | Selecionar geração histórica → clicar "Comparar" → verificar layout 2 colunas |
| Modo comparação empilha em mobile (< lg) | HIST-02 | No test infra | Redimensionar janela para < 1024px em modo comparação → verificar empilhamento vertical |
| Geração atual identificada com badge "Atual" | HIST-01 SC4 | No test infra | Verificar que a geração mais recente mostra badge "Atual" no seletor e no header dos insights |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < N/A (manual-only project)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
