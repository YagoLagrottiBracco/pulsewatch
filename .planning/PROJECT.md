# PulseWatch

## What This Is

Micro-SaaS que monitora lojas de e-commerce 24/7 e envia alertas automáticos de queda de vendas, estoque baixo e problemas críticos. Inclui geração automática de AI Insights, diagnóstico guiado pós-alerta, calculadora de perdas na landing page, exportação CSV e feed de atividade por time.

## Core Value

Lojistas descobrem problemas antes dos clientes — não horas depois.

## Current State (v1.1 — shipped 2026-04-16)

**Status:** v1.1 completo. 15 fases entregues, 196 commits, stack estável.

**Shipped in v1.1:**
- Geração automática semanal de AI Insights (cron business+, deduplicação 6 dias)
- Diagnóstico guiado pós-alerta ("O que fazer agora" — 4 tipos de alerta)
- Calculadora interativa de perdas por downtime na landing page
- Exportação CSV client-side de alertas (com filtro de período) e analytics
- Feed de atividade de time (owner vê ações de membros com timestamp)

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
- `src/app/(authenticated)/` — dashboard, lojas, alertas, produtos, analytics, atividade
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

## Requirements

### Validated

**v1.0 (shipped 2026-03-31):**
- ✓ Cadastro e autenticação de usuários — v1.0
- ✓ Adição e monitoramento de lojas (11 plataformas) — v1.0
- ✓ Alertas por email, SMS, WhatsApp, Telegram — v1.0
- ✓ Dashboard com métricas de venda e estoque — v1.0
- ✓ AI Insights via Gemini (geração manual) — v1.0
- ✓ Relatório semanal automático — v1.0
- ✓ Planos de assinatura via Stripe — v1.0
- ✓ Sistema de times (owner/manager/viewer) — v1.0
- ✓ Previsão de estoque — v1.0
- ✓ Uptime SLA tracking — v1.0
- ✓ NPS e feedback de usuário — v1.0
- ✓ Referral program — v1.0
- ✓ Rastreamento de ações sobre recomendações de AI — v1.0
- ✓ Histórico de gerações de insights com modo comparação — v1.0

**v1.1 (shipped 2026-04-16):**
- ✓ INS-01: Geração automática de insights toda segunda-feira para business+ — v1.1
- ✓ INS-02: Deduplicação de geração automática (não gera se já gerou em 6 dias) — v1.1
- ✓ INS-03: Label "geração automática" no histórico — v1.1
- ✓ INS-04: Gate de tier: apenas business+ recebe geração automática — v1.1
- ✓ ALERT-01: Card "O que fazer agora" em alertas críticos — v1.1
- ✓ ALERT-02: Checklist cobre loja offline, estoque zerado, estoque baixo, queda de vendas — v1.1
- ✓ ALERT-03: Card contextual por tipo de alerta — v1.1
- ✓ LAND-01: Calculadora interativa de perdas por downtime na landing page — v1.1
- ✓ LAND-02: Calculadora aceita faturamento mensal e calcula perda por hora — v1.1
- ✓ LAND-03: Calculadora exibe impacto de queda de 20% nas vendas — v1.1
- ✓ LAND-04: Widget visualmente consistente com design system — v1.1
- ✓ EXP-01: Exportação de alertas filtrados por período em CSV — v1.1
- ✓ EXP-02: Exportação de dados de analytics em CSV — v1.1
- ✓ EXP-03: Exportação gerada client-side — v1.1
- ✓ TEAM-01: Feed de atividade com ações de membros (owner) — v1.1
- ✓ TEAM-02: Ações registradas automaticamente ao interagir com alertas — v1.1
- ✓ TEAM-03: Feed exibe nome do membro, ação e timestamp — v1.1

### Active (v1.2 — a definir)

Ver próximo milestone.

### Out of Scope

- App mobile nativo — fora da stack atual
- WebSocket / SSE para alertas em tempo real (F01) — complexidade G
- White-label (F08) — complexidade G
- Subdomínios customizados

## Key Decisions

| Decision | Milestone | Outcome |
|---|---|---|
| Cron jobs via cron-job.org (não node-cron no código) | v1.0 | ✓ Good — operação simples, sem infra extra |
| Monitoramento por polling HTTP | v1.0 | ✓ Good — SSE/WebSocket é backlog |
| White-label fora de escopo | v1.0 | ✓ Good — foco no produto core |
| Geração automática de insights via cron semanal | v1.1 | ✓ Good — deduplicação funciona |
| Checklists de diagnóstico hardcoded em alert-checklists.ts | v1.1 | ✓ Good — simples, sem DB extra |
| Exportação CSV inteiramente client-side | v1.1 | ✓ Good — sem endpoint, sem infra |
| ALERT_VIEWED via logAudit no markAsRead | v1.1 | ✓ Good — não requer step extra do membro |
| RLS policy aditiva para owners (não SECURITY DEFINER) | v1.1 | ✓ Good — seguro, não sobrescreve policy existente |
| isOwner tri-state (null/true/false) para evitar flash de tabs | v1.1 | ✓ Good — UX limpa |
| Team feed lazy-loaded no clique da aba | v1.1 | ✓ Good — não carrega no mount desnecessariamente |

## Backlog (fases futuras)

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

## Context

Projeto criado em 2025-12-08. MVP (v1.0) entregue em 2026-03-31. v1.1 entregue em 2026-04-16.
~196 commits. Stack Next.js 14 + Supabase + Gemini, estável e sem dívida técnica significativa.

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
*Last updated: 2026-04-16 — após milestone v1.1*
