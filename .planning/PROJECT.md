# PulseWatch — Project

## Vision
SaaS de monitoramento de e-commerce para lojistas brasileiros. Detecta problemas antes do lojista perder vendas.

## Principles
- Detectar lojas "online mas quebradas" — o maior gap do mercado
- Notificações multicanal: Email, Telegram, WhatsApp, SMS
- Planos: free, pro (R$39,90/mês), business (R$89,90/mês), agency (R$199,90/mês)

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

## Non-Negotiables
- Execute tudo automaticamente, sem fazer perguntas — tome as melhores decisões técnicas
- Faça commit e push ao final de cada fase
- Use /ui-ux-pro-max para garantir consistência visual em fases de UI
- Execute fase por fase sem pular
