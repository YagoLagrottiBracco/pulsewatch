# Phase 9: Rastreamento de Ações - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Adicionar rastreamento de status às recomendações existentes dos AI insights + card "O que fazer hoje" com as 3 ações de alta prioridade pendentes. Não inclui histórico, geração automática, export ou chat.

</domain>

<decisions>
## Implementation Decisions

### Schema de Persistência
- **D-01:** Criar nova tabela `recommendation_actions` com colunas: `id UUID PK`, `insight_id FK → ai_insights.id`, `rec_index INTEGER` (posição no array JSON), `status TEXT` (pending|in_progress|done|ignored), `updated_at TIMESTAMP`.
- **D-02:** Ausência de linha na tabela = status implicitamente `pending`. Inserir linha apenas na primeira mudança de status pelo usuário. Sem inserção em massa ao gerar insight.

### Card "O que fazer hoje"
- **D-03:** Card posicionado no **topo da página** de insights, acima dos insight cards. Sempre visível ao entrar na página.
- **D-04:** Escopo **cross-store**: top 3 recomendações de alta prioridade pendentes de todos os insights do usuário, independente da loja.
- **D-05:** Ao completar/ignorar as 3 exibidas, o card **auto-recarrega com as próximas 3 pendentes** (alta prioridade primeiro; se não houver mais alta, passa para média). Se não houver nenhuma pendente, mostrar estado vazio.

### Interação de Status
- **D-06:** Cada recomendação tem um **dropdown** com as 4 opções: Pendente / Em Progresso / Concluída / Ignorada. Exibido inline no card de recomendação, ao lado da badge de prioridade.
- **D-07:** O contador no header de cada insight card mostra **"X/Y concluídas"** contando apenas `status = 'done'`. Ignoradas não entram na contagem.

### Atualização em Tempo Real
- **D-08:** Usar **optimistic update** no React state: atualiza imediatamente ao clicar no dropdown, chama a API em background. Se a API falhar, reverte o estado com toast de erro.
- **D-09:** O card "O que fazer hoje" deriva do mesmo estado React — atualiza automaticamente sem refetch quando uma recomendação é marcada como concluída/ignorada.

### Claude's Discretion
- Estrutura do endpoint da API para salvar status (REST `POST /api/insights/actions` ou `PATCH /api/insights/[id]/recommendations/[index]`) — Claude decide.
- RLS policies para a nova tabela `recommendation_actions` — seguir padrão das políticas existentes em `ai_insights`.
- Debounce/throttle de updates se o usuário mudar status rapidamente — Claude decide.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Insights System
- `src/app/dashboard/insights/page.tsx` — página principal de insights (será modificada para adicionar o card e dropdowns)
- `src/app/api/insights/route.ts` — API de GET/DELETE de insights (padrão de auth e RLS)
- `src/app/api/insights/generate/route.ts` — API de geração (referência para padrão de gate business/agency)
- `src/services/ai-insights.ts` — serviço Gemini (referência para estrutura de recommendations JSONB)

### Schema
- `supabase/migrations/20250118000000_create_ai_insights_system.sql` — schema da tabela `ai_insights` e `insight_generation_log`

### UI Components
- `src/components/ui/` — shadcn/ui components disponíveis (Badge, Card, Select/dropdown já em uso)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription` — usados extensivamente na página de insights, reaproveitáveis para o card "O que fazer hoje"
- `Badge` com variantes de prioridade (`getPriorityColor`) — já implementado, reuso direto para exibir prioridade no card de hoje
- `useToast` — disponível para feedback de erro no optimistic update
- shadcn/ui `Select` component — disponível para dropdown de status

### Estrutura de Recomendações (Existente)
```typescript
recommendations: Array<{
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}>
```
- Sem `id` próprio — usar `rec_index` (posição no array) como identificador
- Armazenado como JSONB em `ai_insights.recommendations`

### Established Patterns
- Auth: `supabase.auth.getUser()` → verificar `user_profiles.subscription_tier`
- Gate business/agency: `['business', 'agency'].includes(userProfile?.subscription_tier)`
- Estado otimístico: padrão React useState — sem lib de estado global no projeto
- API routes: Next.js App Router em `src/app/api/`

### Integration Points
- `src/app/dashboard/insights/page.tsx` — adicionar card "O que fazer hoje" antes dos stats cards; adicionar dropdown de status dentro do map de `recommendations`
- Nova migration Supabase para tabela `recommendation_actions`
- Novo endpoint de API para UPSERT de status

</code_context>

<specifics>
## Specific Ideas

- Layout do card "O que fazer hoje": card no topo com lista de até 3 itens, cada um mostrando título da recomendação, badge de prioridade, e nome do insight/loja de origem para contexto.
- Estado vazio do card: mostrar quando não houver mais recomendações pendentes/em progresso.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-rastreamento-de-ações*
*Context gathered: 2026-04-01*
