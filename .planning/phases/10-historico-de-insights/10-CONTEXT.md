# Phase 10: Histórico de Insights - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** auto (all decisions made by Claude)

<domain>
## Phase Boundary

Adicionar navegação por gerações passadas de insights na página de insights existente + modo de comparação lado a lado entre duas gerações. Não inclui geração automática, export, share ou chat.

Requirements: HIST-01 (seletor de gerações), HIST-02 (comparação lado a lado)

</domain>

<decisions>
## Implementation Decisions

### Conceito de Geração
- **D-01:** Adicionar coluna `generation_id UUID REFERENCES insight_generation_log(id)` na tabela `ai_insights`. Coluna nullable para compatibilidade com dados existentes (sem backfill obrigatório — dados sem generation_id são exibidos agrupados pela data `DATE(created_at)`).
- **D-02:** A rota `POST /api/insights/generate` deve inserir em `insight_generation_log` e propagar o `generation_id` para todos os insights criados naquele batch.
- **D-03:** Para o seletor, a lista de gerações disponíveis vem de `insight_generation_log` (não de `ai_insights` diretamente) — mais confiável para saber quantos batches existem.

### Navegação pelo Histórico (HIST-01)
- **D-04:** Select dropdown adicionado no header da página, ao lado do botão "Gerar Insights". Opções: "Mais recente (atual)" como default + data de cada geração passada formatada como "DD/MM/YYYY HH:mm". Ao trocar o select, os insights na lista abaixo são recarregados para aquela geração.
- **D-05:** A geração mais recente é sempre selecionada por padrão ao entrar na página. Nenhuma mudança comportamental para o fluxo atual.
- **D-06:** Badge "Atual" exibido ao lado do título dos insights quando o seletor está na geração mais recente. Ao visualizar geração histórica, badge muda para "Histórico - DD/MM/YYYY".

### Comparação Lado a Lado (HIST-02)
- **D-07:** Botão "Comparar" aparece no header somente quando uma geração DIFERENTE da mais recente está selecionada. Ao clicar, ativa o modo comparação.
- **D-08:** Em modo comparação: layout de 2 colunas. Coluna esquerda = geração selecionada no select principal. Coluna direita = geração mais recente (default) com segundo select para trocar. Header de cada coluna exibe a data da geração e badge "Atual" ou "Histórico".
- **D-09:** Em mobile (< lg), modo comparação empilha as colunas verticalmente (coluna A em cima, coluna B abaixo) — sem scroll horizontal.
- **D-10:** Botão "Sair da comparação" retorna ao modo single-column normal.

### API Changes
- **D-11:** Adicionar parâmetro `?generation_id=<uuid>` ao `GET /api/insights`. Quando ausente, retorna a geração mais recente (comportamento atual preservado). Quando presente, retorna os insights daquele generation_id.
- **D-12:** Novo endpoint `GET /api/insights/generations` retorna lista de gerações disponíveis para o usuário: `[{ id, generated_at, insight_count }]` ordenado por `generated_at DESC`.

### Status das Ações em Histórico
- **D-13:** Actions (recommendation_actions) são exibidas e **editáveis** em todas as gerações — não apenas na mais recente. Isso permite que o usuário continue marcando progresso mesmo em insights de gerações passadas.

### Claude's Discretion
- Skeleton/loading state durante troca de geração no select
- Exact column widths no modo comparação (sugestão: 50/50 ou 55/45)
- Debounce de troca de geração no select (evitar calls rápidas consecutivas)
- Empty state quando geração histórica não tem insights (edge case de falha de geração)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Página de Insights (principal arquivo a modificar)
- `src/app/dashboard/insights/page.tsx` — página atual completa; adicionar generation select, modo comparação, e badge de geração

### API de Insights (a modificar)
- `src/app/api/insights/route.ts` — adicionar suporte ao parâmetro `?generation_id`; criar novo GET /api/insights/generations

### Geração (a modificar)
- `src/app/api/insights/generate/route.ts` — propagar generation_id para os insights criados no batch

### Schema
- `supabase/migrations/20250118000000_create_ai_insights_system.sql` — schema atual de `ai_insights` e `insight_generation_log`
- `supabase/migrations/20260401000000_add_recommendation_actions.sql` — schema de `recommendation_actions` (Phase 9)

### UI Components
- `src/components/ui/` — shadcn/ui disponíveis: Select, Badge, Card, Button, Tabs

### Types
- `src/types/recommendation-actions.ts` — tipos existentes de Phase 9 (InsightsWithActionsResponse, etc.)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Select` (shadcn/ui) — já em uso para dropdown de status das ações; reusar para generation selector
- `Badge` com variantes — já usado para tipo e confiança; adicionar variante "Atual" / "Histórico"
- `Card`, `CardHeader`, `CardContent` — estrutura existente de cada insight, reusar nas 2 colunas
- `fetchInsights()` + `useState<Insight[]>` — refatorar para aceitar `generationId` como parâmetro
- `actionsMap` state (Record<string, ActionStatus>) — funciona igual para qualquer geração

### Established Patterns
- Auth: `supabase.auth.getUser()` → verificar subscription_tier
- Gate: `['business', 'agency'].includes(userProfile?.subscription_tier)`
- API: Next.js App Router em `src/app/api/`
- Optimistic update com debounce 300ms (Phase 9 pattern) — manter para actions em histórico

### Integration Points
- `src/app/dashboard/insights/page.tsx` — adicionar state para `selectedGenerationId`, `compareMode`, `compareGenerationId`; adicionar generation select no header; adicionar modo de 2 colunas
- `GET /api/insights` — adicionar `searchParams.get('generation_id')` e filtrar query se presente
- `POST /api/insights/generate` — inserir em insight_generation_log e propagar id

### Schema Gap (migration necessária)
- `ai_insights` não tem `generation_id` coluna → nova migration `20260409000000_add_generation_id_to_ai_insights.sql`
- Adicionar `generation_id UUID REFERENCES insight_generation_log(id) ON DELETE SET NULL`
- Index: `CREATE INDEX idx_ai_insights_generation ON ai_insights(generation_id)`

</code_context>

<specifics>
## Specific Ideas

- Generation select deve mostrar datas formatadas em pt-BR: "12/03/2026 às 14:30"
- No modo comparação, header de cada coluna: "[Tipo de geração] — DD/MM/YYYY" com badge colorido (Atual = primary, Histórico = muted)
- Comportamento ao deletar insight em geração histórica: remover da lista local imediatamente (igual ao comportamento atual)

</specifics>

<deferred>
## Deferred Ideas

- Paginação de gerações (caso usuário acumule muitas) — Phase 11 pode adicionar se necessário
- Diff visual entre gerações (destacar recomendações novas/removidas) — potencial Phase 15+
- Filtro por insight_type no modo comparação — funciona naturalmente via tabs existentes

</deferred>

---

*Phase: 10-historico-de-insights*
*Context gathered: 2026-04-09*
