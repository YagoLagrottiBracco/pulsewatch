---
plan: 13-01
status: complete
started: 2026-04-10
completed: 2026-04-10
commits:
  - 8aff85b
  - e0be20d
  - 28cc0bd
  - 79debce
---

## What Was Built

Migration cria tabela `shared_insights` com RLS (owner policy), token único, `expires_at` e `revoked_at`. Três rotas de API: POST `/api/insights/share` cria link com token aleatório e expiração de 30 dias (agency only, verifica propriedade da geração). DELETE `/api/insights/share/[shareId]` revoga link setando `revoked_at`. GET `/api/share/[token]` endpoint público usando service role — retorna insights sem PII (`user_id`, `store_id` excluídos), status 410 para links inválidos/expirados/revogados.

## Key Files

- `supabase/migrations/20260410200000_create_shared_insights.sql`
- `src/app/api/insights/share/route.ts` — POST criar link
- `src/app/api/insights/share/[shareId]/route.ts` — DELETE revogar
- `src/app/api/share/[token]/route.ts` — GET público

## Decisions

- Status 410 (Gone) para links inválidos — mais semântico que 404 para recursos expirados
- Service role no endpoint público — sem sessão necessária, sem RLS bypass explícito
- Token = dois UUIDs concatenados sem hífens — 64 chars, praticamente impossível de adivinhar

## Self-Check: PASSED
