# Phase 11: Auto Weekly AI Insights - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning
**Source:** discuss-phase (interactive)

<domain>
## Phase Boundary

Garantir que o ciclo completo de geração automática semanal de insights funcione end-to-end para usuários business+:
- O cron existente (`/api/cron/weekly-insights`) está implementado e registrado no cron-job.org (às 11h BRT / 12h UTC, toda segunda-feira)
- O backend de deduplicação e gate de tier já está correto
- O trabalho desta fase é: adicionar badge visual na UI (INS-03) e garantir que o fluxo end-to-end está correto

**O que NÃO é escopo desta fase:**
- Registrar o cron no cron-job.org (já feito pelo usuário)
- Refatorar o serviço de geração de insights
- Notificações para o usuário quando a geração automática ocorre

</domain>

<decisions>
## Implementation Decisions

### Badge Visual no Histórico de Gerações (INS-03)
- A geração automática deve exibir um **badge/chip colorido** ao lado da data na lista de histórico
- Cor sugerida: azul ou roxo (consistente com o design system)
- Texto do badge: "Geração automática" (corrigindo o atual "Automatico" sem acento)
- A função `formatGenerationLabel` existente em `insights/page.tsx` deve ser estendida/substituída por um componente com badge visual
- Gerações manuais NÃO ganham badge — só as automáticas se destacam

### Comportamento em Caso de Erro
- Falhas na geração automática são **silenciosas** para o usuário
- O erro já é capturado no `catch` do cron e logado em `insight_generation_log` com `success=false`
- Retry automático ocorre na semana seguinte (deduplication só bloqueia se `success=true`)
- Nenhuma notificação é enviada ao usuário quando a geração automática falha

### Cron-job.org (Já Configurado)
- Registrado às 11h BRT / 12h UTC, toda segunda-feira
- Endpoint: `/api/cron/weekly-insights`
- Auth: Bearer CRON_SECRET (padrão do projeto)
- Nenhuma ação de código necessária para isso

### Claude's Discretion
- Estilo exato do badge (cor específica, variant do componente) — seguir design system existente
- Posicionamento do badge no dropdown de histórico (inline com a data ou abaixo)
- Testes de integração para o fluxo automático

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend — Cron e Geração
- `src/app/api/cron/weekly-insights/route.ts` — Implementação completa do cron semanal
- `src/services/ai-insights.ts` — generateInsightsForUser(userId, source) — suporta 'automatic'

### UI — Página de Insights
- `src/app/dashboard/insights/page.tsx` — Página de insights com histórico de gerações e formatGenerationLabel

### Banco de Dados
- `supabase/migrations/20260410000000_add_source_column_to_insights.sql` — Coluna source em ai_insights
- `supabase/migrations/20260401000000_add_recommendation_actions.sql` — Tabela recommendation_actions

### API
- `src/app/api/insights/route.ts` — GET: lista insights; inclui nextAvailableAt e canGenerate
- `src/app/api/insights/generate/route.ts` — POST: geração manual (source='manual')

</canonical_refs>

<specifics>
## Specific Ideas

- O badge deve ser visualmente distinto mas não intrusivo — um chip pequeno tipo `<Badge variant="secondary">Automática</Badge>` com ícone de relógio ou calendário seria ideal
- A label atual "Automatico" (sem acento, sem "geração") precisa ser corrigida
- O cron existente já usa `source: 'automatic'` no log e nos insights — a UI só precisa renderizá-lo corretamente

</specifics>

<deferred>
## Deferred Ideas

- Notificação push/email quando insight automático é gerado (não solicitado, fora do escopo)
- Dashboard admin mostrando quantos usuários receberam geração automática

</deferred>

---

*Phase: 11-auto-weekly-ai-insights*
*Context gathered: 2026-04-14 via discuss-phase*
