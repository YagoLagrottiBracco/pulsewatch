# Phase 11: Geração Automática Semanal - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** auto (all decisions made by Claude)

<domain>
## Phase Boundary

Adicionar cron job semanal que gera insights automaticamente para usuários business+ toda segunda-feira, sem intervenção manual. Inclui deduplicação (não gerar se já gerou nos últimos 6 dias), label "automático" no histórico, e gate de tier. Não inclui alert-triggered insights (Phase 12) nem UI de histórico (já feita na Phase 10).

Requirements: AUTO-01, AUTO-02

</domain>

<decisions>
## Implementation Decisions

### Cron Route
- **D-01:** Nova rota `src/app/api/cron/weekly-insights/route.ts` — segue exatamente o padrão de `weekly-report/route.ts` (auth via `CRON_SECRET`, try/catch, NextResponse.json com resultado).
- **D-02:** Schedule `0 12 * * 1` (segunda-feira 9h Brasília = 12h UTC) — ligeiramente depois do weekly-report (`0 11 * * 1`) para evitar sobrecarga simultânea. Adicionar entrada em `vercel.json`.

### Schema — Coluna `source`
- **D-03:** Adicionar coluna `source TEXT NOT NULL DEFAULT 'manual'` na tabela `ai_insights`. Valores permitidos: `'manual'` | `'automatic'` | `'alert_triggered'`. Cobre Phase 11 (automatic) e Phase 12 (alert_triggered) com uma única migration. Coluna é propagada junto com `generation_id` no batch insert do `generate/route.ts`.

### Deduplicação (AUTO-02)
- **D-04:** No início do processamento de cada usuário, consultar `insight_generation_log WHERE user_id = $1 AND generated_at > NOW() - INTERVAL '6 days'`. Se existir qualquer linha → pular usuário (não gerar). Usar Supabase service role client (sem RLS) para acessar todos os usuários.
- **D-05:** O cron loga o resultado por usuário: `{ user_id, skipped: true, reason: 'generated_within_6_days' }` vs `{ user_id, skipped: false, insights_generated: N }`.

### Serviço Reutilizável
- **D-06:** Extrair lógica de geração de `src/app/api/insights/generate/route.ts` para uma função `generateInsightsForUser(userId: string, source: 'manual' | 'automatic' | 'alert_triggered'): Promise<{ insightCount: number; generationId: string }>` em `src/services/ai-insights.ts`. O cron e a rota manual chamam a mesma função. Parâmetro `source` é passado ao insert.

### Gate de Tier
- **D-07:** O cron itera apenas sobre usuários com `subscription_tier IN ('business', 'agency')` na tabela `user_profiles`. Query via service role para acessar todos os perfis.

### Label "Automático" na UI (Phase 10 History)
- **D-08:** Na página de insights (`src/app/dashboard/insights/page.tsx`), o seletor de gerações (Phase 10) deve exibir o label da geração como `"Automático — DD/MM/YYYY"` quando `source = 'automatic'`, e `"DD/MM/YYYY HH:mm"` quando manual. A interface `Generation` em `page.tsx` recebe o campo `source` da API `/api/insights/generations`.
- **D-09:** GET `/api/insights/generations` já retorna dados de `insight_generation_log`. Adicionar `source` ao `ai_insights` permite derivar o source do batch via JOIN ou campo direto. Alternativa mais simples: adicionar coluna `source TEXT DEFAULT 'manual'` também em `insight_generation_log`. Usar essa coluna para o label — Claude decide qual abordagem é mais limpa ao implementar.

### Claude's Discretion
- Tratamento de erros por usuário no cron (continuar para próximo usuário se um falhar) — Claude decide a estratégia de retry/skip
- Número máximo de usuários processados por execução do cron (timeout Vercel = 300s para crons) — Claude decide se precisa de paginação
- Se `generateInsightsForUser` já existir com assinatura diferente em `ai-insights.ts` — Claude adapta sem quebrar callers existentes

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cron Pattern Existente
- `src/app/api/cron/weekly-report/route.ts` — padrão exato a seguir (auth, try/catch, resultado)
- `vercel.json` — adicionar entrada de cron aqui

### Geração de Insights (a refatorar)
- `src/app/api/insights/generate/route.ts` — lógica de geração a extrair para serviço
- `src/services/ai-insights.ts` — destino da função `generateInsightsForUser`

### Schema
- `supabase/migrations/20250118000000_create_ai_insights_system.sql` — schema de `ai_insights` e `insight_generation_log`
- `supabase/migrations/20260409000000_add_generation_id_to_ai_insights.sql` — migration mais recente (padrão a seguir)

### UI (a atualizar para mostrar label "Automático")
- `src/app/dashboard/insights/page.tsx` — interface `Generation` e renderização do seletor

### Requirements
- `.planning/REQUIREMENTS.md` — AUTO-01, AUTO-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `weekly-report/route.ts` — auth via `CRON_SECRET`, iteração por usuários, log de resultado — replicar exatamente
- `check_insight_rate_limit` RPC — verifica janela de 6h (manual). NÃO usar para deduplicação semanal — fazer query direta com intervalo de 6 dias
- `aiInsightsService` em `src/services/ai-insights.ts` — lógica Gemini existente, expandir com `generateInsightsForUser`
- `Generation` interface em `page.tsx` (Phase 10) — já existe, adicionar campo `source`

### Established Patterns
- Cron auth: `request.headers.get('authorization') !== Bearer ${CRON_SECRET}` → 401
- Service role: `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` para acesso sem RLS
- Tier gate: `subscription_tier IN ('business', 'agency')`
- Migration pattern: arquivo em `supabase/migrations/YYYYMMDDHHMMSS_nome.sql`

### Integration Points
- `vercel.json` → nova entrada `{ path: '/api/cron/weekly-insights', schedule: '0 12 * * 1' }`
- `src/services/ai-insights.ts` → nova função `generateInsightsForUser`
- `src/app/api/insights/generate/route.ts` → chamar `generateInsightsForUser` em vez de lógica inline
- `src/app/dashboard/insights/page.tsx` → campo `source` na interface `Generation` + label condicional

</code_context>

<specifics>
## Specific Ideas

- Cron result format: `{ processed: N, generated: N, skipped: N, errors: N, details: [...] }` — consistente com weekly-report
- Label no seletor: `"Automático — seg, 07/04/2026"` (dia da semana + data) para gerações automáticas

</specifics>

<deferred>
## Deferred Ideas

- Notificação push/email quando insights automáticos são gerados — potencial Phase 15+
- Configuração de dia/hora da geração automática por usuário — fora do escopo v1.1
- Retry automático em caso de falha parcial do cron — deferred para operações

</deferred>

---

*Phase: 11-gera-o-autom-tica-semanal*
*Context gathered: 2026-04-10*
