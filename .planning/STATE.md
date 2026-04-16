---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: (planning)
status: milestone_complete
last_updated: "2026-04-16T00:00:00.000Z"
last_activity: 2026-04-16
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# GSD State

## Current Position

Milestone v1.1 SHIPPED — archived 2026-04-16
Next: `/gsd:new-milestone` para planejar v1.2

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-16)

**Core value:** Lojistas descobrem problemas antes dos clientes — não horas depois.
**Current focus:** Planning next milestone (v1.2)

## Milestone

v1.1 — Insights IA + Melhorias de Produto — SHIPPED 2026-04-16

## Completed Phases

| Phase | Name | Status |
|---|---|---|
| 9 | Rastreamento de Ações | ✅ done (commit b3c01a2) |
| 10 | Histórico de Insights | ✅ done (commit f436383) |
| 11 | Auto Weekly AI Insights | ✅ done (commit 619f841) |

## Accumulated Context

- Cron jobs devem ser criados em cron-job.org, nunca no código
- Monitoramento das 11 plataformas está completo (expandido em 2026-04-14)
- mercadolivre e shopee foram adicionados ao SUPPORTED_PLATFORMS em 2026-04-14
- VTEX armazena valores monetários em centavos (dividir por 100)
- Tray usa /web_api/ como base de URL
- AI Insights usa Gemini via @google/generative-ai
- Geração de insights: src/app/api/insights/route.ts
- Cron principal: src/app/api/cron/check-status/route.ts
- Proposals F01-F13 documentadas em .claude/projects/.../memory/project_improvement_proposals.md
- renderGenerationLabel retorna React.ReactNode (não string) para suportar JSX badges dentro de Radix SelectItem
- Badge automático usa bg-blue-500/10 / text-blue-600; badge alert_triggered usa bg-amber-500/10 / text-amber-600
- Cron semanal de insights: /api/cron/weekly-insights — tier gate business/agency, deduplication 6 dias
- Phase 12: DIAGNOSIS_CHECKLISTS lookup map in src/lib/alert-checklists.ts — hard-coded per alert type, no DB table
- Phase 12: AlertDiagnosisCard component in src/components/alerts/ — pure presentational, orange theme (bg-orange-500/5)
- Phase 12: Conditional render gate: severity === 'critical' && DIAGNOSIS_CHECKLISTS[alert.type] — unmapped types silently skip
- Phase 14: Date filter on alerts page uses Aplicar Filtro button (no live-filter on keystroke) — AND-combined with read/unread filter
- Phase 14: Ate boundary fix: setHours(23,59,59,999) ensures full day inclusion
- Phase 14: rawAlerts state in analytics page holds loaded alerts; local variable renamed to alertsData to avoid collision
- Phase 15-01: ALERT_VIEWED: 'alert.viewed' added to AuditActions; markAsRead in alerts/page.tsx calls logAudit with ALERT_VIEWED after successful update
- Phase 15-01: RLS policy "Owners can read team audit logs" uses subquery on account_members (not SECURITY DEFINER) -- additive, does not replace existing user policy
- Phase 15-01: Partial index idx_account_members_owner_active_users WHERE user_id IS NOT NULL covers exact RLS subquery filter
- Phase 15-02: isOwner null state prevents tab flash — tabs render only after ownership check resolves (null/true/false tri-state)
- Phase 15-02: Team feed lazy-loaded on Time tab click via onValueChange + teamLoaded flag (not page mount)
- Phase 15-02: myActivityContent extracted as JSX variable shared across three render branches to avoid duplication
- Phase 15-02: emailMap built client-side from account_members; merged onto audit_log rows; owner's own entries show "Voce"
