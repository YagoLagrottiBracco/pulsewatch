---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Insights IA Avançado
status: completed
last_updated: "2026-04-10T17:18:08.046Z"
last_activity: 2026-04-10
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 5
  completed_plans: 5
---

# PulseWatch — State

## Current Status

**v1.1 Insights IA Avançado — IN PROGRESS**

## Current Position

Phase: 11 (gera-o-autom-tica-semanal) — COMPLETE
Plan: 2 of 2 — DONE
Status: Phase 11 complete — all 2 plans done; next phase is 12 (Insight por Alerta Crítico)
Last activity: 2026-04-10

## Progress Bar

```
v1.1: [ 9 ][ 10 ][ 11 ][ 12 ][ 13 ][ 14 ]
       DONE  ---   ---   ---   ---   ---
       1/6 phases complete
```

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-01)

**Core value:** Detectar lojas "online mas quebradas" antes que o lojista perca vendas
**Current focus:** Phase 10 — Histórico de Insights

## v1.1 Phases

| Phase | Goal | Status |
|-------|------|--------|
| 9. Rastreamento de Ações | Usuário acompanha progresso nas recomendações e vê o que fazer hoje | DONE (2026-04-01) |
| 10. Histórico de Insights | Usuário navega e compara gerações passadas de insights | DONE (2026-04-10) |
| 11. Geração Automática Semanal | Insights gerados automaticamente toda semana sem ação manual | DONE (2026-04-10) |
| 12. Insight por Alerta Crítico | Diagnóstico de IA disparado automaticamente por alertas críticos | Not started |
| 13. Export e Compartilhamento | Exportar PDF e gerar links públicos para clientes | Not started |
| 14. Chat com Dados | Perguntas em linguagem natural sobre dados da loja via IA | Not started |

## Completed Phases

### v1.0 MVP (all shipped 2026-03-31)

- Phase 1: Reestruturação dos Planos (free/pro/business/agency) — DONE
- Phase 2: Monitor de Checkout e Velocidade — DONE (2026-03-30)
- Phase 3: Integrações Brasileiras — DONE (2026-03-30)
- Phase 4: Inteligência e Relatórios — DONE
- Phase 5: Multi-usuário e Times — DONE
- Phase 6: Plano Agência e White-label — DONE
- Phase 7: Automações e API — DONE
- Phase 8: Crescimento e Retenção — DONE (2026-03-31)

## Accumulated Context

### Key Decisions (v1.1)

- Build order follows research recommendation: action tracking → history → cron → alert → export/share → chat
- Phase 10-01: Log-first insert pattern — insert insight_generation_log before ai_insights batch to capture UUID for FK propagation (D-02)
- Phase 10-01: Nullable generation_id with no backfill — pre-Phase-10 insights remain valid without FK (D-01)
- Phase 10-01: Two-query approach for generation counts — fetch logs then counts separately for reliability (Pitfall 6)
- Phase 10-02: Generation interface inline in page.tsx — local scope sufficient, no need to add to shared types file
- Phase 10-02: fetchGenerations silent fail — selector hidden when endpoint unavailable, no error toast (Pitfall 3 pattern)
- Phase 10-02: generationId default param pattern — fetchInsights(generationId = selectedGenerationId) avoids state race on explicit calls
- Phase 10-03: Keep single-column inline render for non-compare path; renderInsightColumn helper used only in compare mode to minimize churn
- Phase 10-03: Main generation selector disabled during compareMode to prevent selectedGenerationId changing while in compare view
- Phase 11-01: InsightSource type covers Phase 11 (automatic) and Phase 12 (alert_triggered) in one migration
- Phase 11-01: Service role client in generateInsightsForUser so it works from both auth routes and cron context
- Phase 11-02: user_profiles id column used in cron dedup query (matches generate/route.ts pattern, not user_id)
- Phase 11-02: source fallback '?? manual' in generations API for graceful degradation if migration not applied
- Phase 11-02: formatGenerationLabel helper centralizes source-aware label logic for main and compare selectors
- Chat route must use Edge Runtime to avoid 60s serverless timeout on streaming
- Alert-triggered insights hard-throttled at 1 per store per 4 hours (storm prevention)
- PDF uses @react-pdf/renderer (not Puppeteer) — Vercel serverless safe
- Share tokens generated with crypto.randomBytes(32) — not enumerable
- Chat capped at 10 turns per session, daily limit by tier (business: 10/day, agency: 30/day)

### New Packages Required

- `ai@4.3.19` — Vercel AI SDK for chat streaming
- `@ai-sdk/google@3.0.55` — Gemini provider for AI SDK
- `@react-pdf/renderer@4.3.2` — Server-side PDF generation
- `zod@^3.23.8` — Bump (peer requirement of ai@4.3.19)

### Schema Changes Required

- `recommendation_actions` table — new (Phase 9) — DONE
- `ai_insights.generation_id` column — new nullable FK (Phase 10) — DONE
- `ai_insights.triggered_by_alert_id` column — new nullable (Phase 12)
- `insight_share_tokens` table — new (Phase 13)
- `chat_messages` table — new (Phase 14)

## Known Issues / Tech Debt

- Campo legado `plan` coexiste com `subscription_tier` — unificação pendente (deferred post-v1.1)
- Telegram Bot usa polling ao invés de webhook — migrar para produção (deferred post-v1.1)
