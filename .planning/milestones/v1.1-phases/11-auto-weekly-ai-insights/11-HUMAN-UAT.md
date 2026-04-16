---
status: partial
phase: 11-auto-weekly-ai-insights
source: [11-VERIFICATION.md]
started: 2026-04-14T00:00:00Z
updated: 2026-04-14T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. INS-01: Geração automática funciona end-to-end
expected: Disparar `GET /api/cron/weekly-insights` com `Authorization: Bearer $CRON_SECRET` retorna `"success": true` e `"generated": N` onde N > 0 (para um usuário business+ sem geração nos últimos 6 dias). Uma entrada com `source='automatic'` aparece em `insight_generation_log` e `ai_insights`.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
