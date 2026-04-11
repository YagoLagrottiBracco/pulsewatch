---
plan: 14-01
status: complete
started: 2026-04-11
completed: 2026-04-11
commits:
  - 288864e
  - e143ddc
---

## What Was Built

Migration cria `chat_messages` com RLS e índice `(user_id, created_at)` para rate limit eficiente. Rota `POST /api/insights/chat` autentica o usuário, aplica tier gate (business+), conta mensagens do dia com service role, retorna 429 com mensagem clara ao atingir limite. Busca contexto real (lojas, pedidos, produtos, alertas, insights) e injeta no prompt Gemini. Streaming via `ReadableStream` + `generateContentStream`. Headers `X-Chat-Remaining` e `X-Chat-Limit` informam o contador. Salva mensagem em `chat_messages` via fire-and-forget após stream.

## Key Files

- `supabase/migrations/20260410300000_create_chat_messages.sql`
- `src/app/api/insights/chat/route.ts`

## Self-Check: PASSED
