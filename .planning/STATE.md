---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: milestone
status: in_progress
last_updated: "2026-04-15T10:05:01Z"
last_activity: 2026-04-15
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 3
  completed_plans: 3
---

# GSD State

## Current Position

Phase: 13
Plan: 01 (complete)
Status: Phase 13 complete — plan 13-01 done
Last activity: 2026-04-15
Stopped at: Completed 13-01-PLAN.md

## Milestone

v1.1 — Insights IA + Melhorias de Produto

## Completed Phases

| Phase | Name | Status |
|---|---|---|
| 9 | Rastreamento de Ações | ✅ done (commit b3c01a2) |
| 10 | Histórico de Insights | ✅ done (commit f436383) |
| 11 | Auto Weekly AI Insights | ✅ done (commit 619f841) |
| 12 | Post-Alert Guided Diagnosis | ✅ done (commit 0169acc) |
| 13 | Loss Calculator on Landing Page | ✅ done (commit 558695d) |

## Decisions

- Calculator is a standalone Client Component — avoids converting entire landing page to `use client`
- 720 hours divisor (30d * 24h) for monthly-to-hourly revenue conversion
- BRL input parser strips non-numeric except comma/period (supports "50.000" format)

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
- Phase 13: LossCalculator in src/components/loss-calculator.tsx — 'use client', live BRL calc, hourly loss + 20% drop
