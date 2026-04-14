# PulseWatch

## What This Is

Micro-SaaS que monitora lojas de e-commerce 24/7 e envia alertas automáticos de queda de vendas, estoque baixo e problemas críticos.

## Core Value

Lojistas descobrem problemas antes dos clientes — não horas depois.

## Current Milestone: v1.1 — Insights IA + Melhorias de Produto

**Goal:** Completar a automação de insights e entregar melhorias de alto impacto para lojistas, gestores e agências.

**Target features:**
- Geração automática semanal de AI Insights (cron, business+)
- Diagnóstico guiado pós-alerta ("O que fazer agora")
- Calculadora de perdas por downtime na landing page
- Exportação CSV de relatórios e alertas
- Feed de atividade por membro do time

## Stack

- **Frontend:** Next.js 14, TypeScript, TailwindCSS, Radix UI, Recharts
- **Backend:** Supabase (Postgres + Auth + RLS), Next.js API Routes
- **AI:** Google Gemini (`@google/generative-ai`)
- **Payments:** Stripe
- **Notifications:** Twilio (SMS + WhatsApp), Nodemailer (email), Telegram Bot
- **Monitoring:** Cron via cron-job.org → `/api/cron/check-status`

## Architecture

- `src/integrations/` — clientes de API por plataforma (11 plataformas: Shopify, WooCommerce, Nuvemshop, VTEX, Magento, BigCommerce, PrestaShop, Spree, Tray, Mercado Livre, Shopee)
- `src/services/` — lógica de negócio (ai-insights, notifications, uptime-sla, stock-forecast, etc.)
- `src/app/api/cron/check-status/` — cron principal: verifica status HTTP, sincroniza produtos, dispara alertas
- `src/app/(authenticated)/` — dashboard, lojas, alertas, produtos, analytics
- `supabase/migrations/` — schema versionado

## Subscription Tiers

| Tier | Lojas | Intervalo | Features |
|---|---|---|---|
| free | 1 | 15 min | Alertas básicos |
| pro | 5 | 5 min | AI Insights manual |
| business | ∞ | 1 min | AI Insights auto, times |
| agency | ∞ | 1 min | API keys, features de agência |

## Team Roles

`owner` → `manager` → `viewer` (tabela `account_members`)

## Active Requirements

Ver REQUIREMENTS.md

## Key Decisions

- Cron jobs são gerenciados externamente via cron-job.org (não usar node-cron ou similar no código)
- Monitoramento por polling HTTP — SSE/WebSocket é backlog (F01)
- White-label é backlog (F08) — complexidade alta, não entra em v1.1

## Validated Requirements (v1.0 — shipped 2026-03-31)

- Cadastro e autenticação de usuários
- Adição e monitoramento de lojas (11 plataformas)
- Alertas por email, SMS, WhatsApp, Telegram
- Dashboard com métricas de venda e estoque
- AI Insights via Gemini (geração manual)
- Relatório semanal automático
- Planos de assinatura via Stripe
- Sistema de times (owner/manager/viewer)
- Previsão de estoque
- Uptime SLA tracking
- NPS e feedback de usuário
- Referral program

## Validated Requirements (v1.1 — parcial)

- **Phase 9** ✅ Rastreamento de ações sobre recomendações de AI (recommendation_actions table)
- **Phase 10** ✅ Histórico de gerações de insights com modo comparação

## Backlog (fases futuras — não entram em v1.1)

| ID | Feature | Tamanho |
|---|---|---|
| F02 | Wizard de onboarding por plataforma | M |
| F03 | Página de status pública por loja | M |
| F04 | Timeline visual de incidentes | M |
| F06 | Métricas de negócio no painel admin | M |
| F08 | White-label para agências | G |
| F09 | Push notifications (PWA) | G |
| F11 | SLA configurável por loja | M |
| F12 | Ranking comparativo entre lojas | M |
| F01 | Alertas em tempo real via SSE ⭐ | G |

## Out of Scope (v1.1)

- App mobile nativo
- WebSocket / SSE para alertas em tempo real (F01) — complexidade G
- White-label (F08) — complexidade G
- Subdomínios customizados

## Context

Projeto criado em 2026. MVP (v1.0) entregue em 2026-03-31. GSD inicializado em 2026-04-14.

## Evolution

Este documento evolui a cada transição de fase e milestone.

**Após cada fase** (via `/gsd:transition`):
1. Requirements invalidados? → mover para Out of Scope
2. Requirements validados? → mover para Validated
3. Novos requirements? → adicionar em Active
4. Decisões? → registrar em Key Decisions

**Após cada milestone** (via `/gsd:complete-milestone`):
1. Revisão completa de todas as seções
2. Checar Core Value — ainda é a prioridade certa?

---
*Last updated: 2026-04-14 — Milestone v1.1 started*
