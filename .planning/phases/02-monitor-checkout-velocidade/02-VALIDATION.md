---
phase: 2
slug: monitor-checkout-velocidade
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compilation + Next.js build |
| **Config file** | tsconfig.json |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | Migration | manual | `psql -c "SELECT column_name FROM information_schema.columns WHERE table_name='stores'"` | ✅ | ⬜ pending |
| 2-01-02 | 01 | 1 | checkStoreStatus | compile | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 2-01-03 | 01 | 2 | Advanced monitors | compile | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 2-02-01 | 02 | 3 | UI config | compile | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- Existing infrastructure (TypeScript + Next.js) covers all compilation checks.
- No new test framework needed — project relies on TypeScript for type safety.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| LOJA_LENTA alerta criado | Monitor de velocidade | Necessita loja real com resposta lenta | Configurar threshold 1ms, verificar alerta no banco |
| CHECKOUT_OFFLINE alerta criado | Monitor de checkout | Necessita URL de checkout retornando erro | Mock URL com /cart retornando 500 |
| UI toggle salva no banco | Configuração por loja | Requer browser + Supabase | Marcar toggle, verificar stores.checkout_monitor_enabled = true |
| Gate pro+ funciona | Todos monitores avançados | Requer usuário free autenticado | Verificar que lojas free não executam monitores avançados |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
