---
plan: 12-01
status: complete
started: 2026-04-10
completed: 2026-04-10
commits:
  - 46beec2
  - d723dad
  - b95c04c
---

## What Was Built

Migration adicionando `alert_id UUID` (nullable, FK para `alerts`) em `insight_generation_log`. Função `generateInsightsForUser` estendida com terceiro parâmetro `alertId?` que persiste a referência no log. No cron `check-status`, `createAlertWithNotification` agora retorna o ID do alerta criado e dispara `triggerAlertInsight` via fire-and-forget para alertas `high`/`critical`. `triggerAlertInsight` implementa dedup de 4h por usuário antes de chamar `generateInsightsForUser` com `source='alert_triggered'`.

## Key Files

- `supabase/migrations/20260410100000_add_alert_id_to_generation_log.sql` — FK alert_id nullable
- `src/services/ai-insights.ts` — `generateInsightsForUser(userId, source, alertId?)`
- `src/app/api/cron/check-status/route.ts` — `triggerAlertInsight` + fire-and-forget

## Decisions

- Fire-and-forget via `.catch()` mantém performance do cron inalterada
- Dedup de 4h por usuário (não por loja) para evitar spam
- `.select('id').single()` no insert de alertas — backward compat (callers não mudam)

## Self-Check: PASSED
