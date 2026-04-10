# PulseWatch — Project

## Current Milestone: v1.1 Insights IA Avançado

**Goal:** Transformar a área de Insights IA de uma geração passiva em um sistema ativo de ações rastreáveis, análise histórica e chat com dados.

**Target features:**
- Rastreamento de ações (marcar recomendações como feito/em progresso/ignorado)
- Geração automática agendada (cron semanal)
- Card "O que fazer hoje" (resumo das 3 top ações prioritárias)
- Histórico de insights (timeline comparativa entre gerações)
- Insight disparado por alerta crítico
- Exportar/compartilhar insights (PDF + link)
- Chat com seus dados (perguntas em linguagem natural via Gemini)

## What This Is

SaaS de monitoramento de e-commerce para lojistas brasileiros. Detecta problemas antes do lojista perder vendas — de lojas offline a checkouts quebrados, integrações com as principais plataformas brasileiras, e agora com sistema completo de growth e retenção.

## Core Value

Detectar lojas "online mas quebradas" antes que o lojista perca vendas.

## Current State

**Shipped:** v1.0 MVP (2026-03-31)
**Codebase:** ~25.000 LOC TypeScript (Next.js 14 App Router)
**Status:** v1.1 em andamento — Phases 9, 10, 11, 12, 13 concluídas (Phase 13 complete — Export e Compartilhamento)

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres + Realtime + Auth)
- Stripe (pagamentos e assinaturas)
- Twilio (WhatsApp e SMS)
- Telegram Bot API (@PulseWatchClick_Bot)
- Tailwind CSS + shadcn/ui
- Vercel (deploy)

## Subscription Tiers

- `free`: 1 loja, check 15min, email+telegram
- `pro`: 5 lojas, check 5min, whatsapp, monitor checkout, relatório semanal
- `business`: lojas ilimitadas, check 1min, SMS, AI insights, multi-usuário (3), webhooks
- `agency`: lojas ilimitadas multi-cliente, check 1min, SMS (500/mês), white-label, API

## Requirements

### Validated

- ✓ Detecção de lojas offline (HTTP check) — v1.0
- ✓ Monitor de velocidade, erros HTTP e checkout — v1.0
- ✓ Planos free/pro/business/agency com Stripe — v1.0
- ✓ Integrações brasileiras: Mercado Livre, Shopee, gateways — v1.0
- ✓ Relatórios automáticos e inteligência de dados — v1.0
- ✓ Multi-usuário e times com papéis — v1.0
- ✓ Plano Agency com white-label e workspaces — v1.0
- ✓ Automações (webhooks, status page, API pública) — v1.0
- ✓ Growth: onboarding, referral, reengajamento, upsell, NPS — v1.0

### Active (v1.1)

- [ ] Rastreamento de ações em recomendações IA
- [ ] Geração automática agendada (cron semanal)
- [ ] Card "O que fazer hoje" com top 3 ações
- [ ] Histórico e timeline de insights
- [ ] Insight disparado por alerta crítico
- [ ] Exportar/compartilhar insights (PDF + link)
- [ ] Chat com dados via linguagem natural

### Deferred (post-v1.1)

- [ ] Unificar campo legado `plan` com `subscription_tier`
- [ ] Migrar Telegram de polling para webhook
- [ ] Mobile app ou PWA melhorada
- [ ] Integrações adicionais: Bling, Tiny ERP
- [ ] Dashboard analytics de receita por plano

### Out of Scope

- Video chat integrado — usar ferramentas externas
- Offline-first / PWA completo — real-time é o core value

## Key Decisions

| Decision | Phase | Outcome |
|----------|-------|---------|
| Migrar tiers para free/pro/business/agency | 1 | ✓ Melhor posicionamento de mercado |
| Stack Next.js + Supabase + Stripe | 1 | ✓ Velocidade de entrega |
| Gate explícito por funcionalidade | 1-7 | ✓ Upsell natural |
| Multi-tenant via workspaces isolados | 6 | ✓ Correto para agency |
| Referral com extensão de trial (não desconto) | 8 | ✓ Menor custo de CAC |

## Known Technical Debt

- Campo legado `plan` coexiste com `subscription_tier`
- Telegram Bot usa polling ao invés de webhook
- Fases 1-7 sem planos GSD formais (apenas fase 8 tem PLAN.md/SUMMARY.md)

## Non-Negotiables

- Execute tudo automaticamente, sem fazer perguntas — tome as melhores decisões técnicas
- Faça commit ao final de cada fase
- Use /ui-ux-pro-max para garantir consistência visual em fases de UI
- Execute fase por fase sem pular

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

*Last updated: 2026-04-10 after Phase 13 complete*
