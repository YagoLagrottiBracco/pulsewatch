# Summary: Phase 8 — Crescimento e Retenção

**Status**: Complete
**Date**: 2026-03-31

## What was built

Implementação completa de todas as funcionalidades de crescimento e retenção do PulseWatch.

### Migration (`supabase/migrations/20260331300000_add_growth_retention.sql`)
- `onboarding_steps` — tracking de steps gamificados por usuário
- `referrals` — programa de indicação com status pipeline e reward_days
- `nps_surveys` — respostas NPS com score (0-10) e feedback livre
- `upsell_events` — rastreamento de interações com modais de upsell
- Colunas adicionais em `user_profiles`: `referral_code`, `referred_by`, `trial_bonus_days`, `last_active_at`, `reengagement_sent_at`, `nps_sent_at`, `nps_completed`

### Services
- `services/nps.ts` — calcula NPS score, gera email HTML, envia em batch para assinantes com 30+ dias
- `services/onboarding.ts` — 6 steps gamificados (100 pts total), +1 dia trial a cada 2 steps
- `services/reengagement.ts` — detecta free inativos há 7 dias e envia email de reativação
- `services/referral.ts` — código único por usuário (PW-XXXXXXXX), rastreia conversões, aplica +7 dias de trial ao referrer

### API Routes
- `GET/POST /api/nps` — buscar histórico / submeter resposta
- `GET /api/nps/respond` — link direto do email com score pré-definido
- `GET /api/onboarding` — progresso do usuário autenticado
- `POST /api/referral` — criar convite por email + buscar stats
- `POST /api/upsell` — registrar evento de interação
- `GET /api/cron/nps` — disparado por cron, envia NPS para elegíveis
- `GET /api/cron/reengagement` — disparado por cron, reengaja inativos

### Components
- `OnboardingWidget` — card no topo do dashboard com progress bar, checklist de steps e badge de bonus de trial
- `NpsModal` — dialog com scale colorida (vermelho/amarelo/verde), textarea de feedback e estado de confirmação
- `UpsellModal` — dialog contextual ao tentar feature bloqueada, com lista de benefícios do plano necessário

### Dashboard integration
- `dashboard/page.tsx` atualizado para incluir `OnboardingWidget` e `NpsModal`
- Detecção de `?nps_score=N` na URL para abrir modal diretamente a partir do email

## Success Criteria Status
1. ✅ Onboarding gamificado com progress bar e trial estendido por ações
2. ✅ Programa de indicação com cupons rastreáveis (código PW-XXXXXXXX)
3. ✅ Email de reengajamento para free inativo há 7 dias
4. ✅ Modal de upsell contextual ao tentar feature bloqueada
5. ✅ NPS automático 30 dias após assinar
