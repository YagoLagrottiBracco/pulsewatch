# PulseWatch — Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-31
**Phases:** 8 | **Plans:** 3 (formais) | **Timeline:** ~113 dias (2025-12-08 → 2026-03-31)

### What Was Built

- Monitoramento completo de e-commerce: offline, velocidade, erros HTTP, checkout
- Planos free/pro/business/agency com Stripe, gates, trials por tier
- Integrações brasileiras: Mercado Livre, Shopee, 4 gateways de pagamento
- Relatórios automáticos, dashboard comparativo, previsão de estoque
- Multi-usuário com papéis, convites e roteamento de alertas
- Plano Agency com workspaces isolados e white-label completo
- Webhooks, status page pública, janelas de manutenção, API documentada
- Growth stack: onboarding gamificado, referral, reengajamento, upsell, NPS

### What Worked

- Execução direta das fases sem overhead de planning formal para fases simples
- Stack Next.js + Supabase + Stripe funcionou bem para velocidade de entrega
- Gates por tier implementados desde o início evitaram refactors grandes
- Separação limpa entre services (lógica) e API routes (HTTP) facilitou extensão

### What Was Inefficient

- Fases 1-7 executadas sem planos GSD formais — histórico de implementação menos rastreável
- Campo legado `plan` não foi removido na migração de tiers (débito acumulado)
- Telegram Bot com polling é funcional mas não escala para produção

### Patterns Established

- Services independentes por domínio (`services/nps.ts`, `services/referral.ts`) como padrão
- Migration por fase com nomenclatura `YYYYMMDDHHMMSS_add_feature.sql`
- Gates de tier centralizados no middleware antes das API routes
- Cron jobs como API routes separadas (`/api/cron/`)

### Key Lessons

1. **Planejar formalmente paga dividendos**: fases com PLAN.md são mais fáceis de auditar e retomar
2. **Gates desde o início**: implementar gates por tier junto com a feature evita débito de UX
3. **Services desacoplados de HTTP**: separar lógica de negócio de route handlers facilita testes e reuso
4. **Campos legados criam débito**: remover campos antigos no mesmo PR da migração

### Cost Observations

- Modelo: Sonnet 4.6 (primary executor)
- Sessions: múltiplas ao longo de ~113 dias
- Notable: fases 4-7 executadas fora do GSD resultaram em menor overhead de planning

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans Formais | Key Change |
|-----------|--------|---------------|------------|
| v1.0 | 8 | 3 | MVP completo; fases 1-7 sem GSD formal |

### Top Lessons (Verified Across Milestones)

1. Fases simples podem ser executadas diretamente; fases complexas se beneficiam de PLAN.md
2. Gates por tier devem ser implementados na mesma fase da feature, nunca depois
