---
phase: 09-rastreamento-de-acoes
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260401000000_add_recommendation_actions.sql
  - src/types/recommendation-actions.ts
autonomous: true
requirements: [ACT-01, ACT-02, ACT-03]

must_haves:
  truths:
    - "Usuário pode alterar o status de qualquer recomendação para pendente, em progresso, concluída ou ignorada"
    - "O contador 'X/Y concluídas' no header de cada insight card reflete apenas recomendações com status 'done'"
    - "O card 'O que fazer hoje' exibe as top 3 recomendações de alta prioridade pendentes ou em progresso, cross-store"
    - "O card 'O que fazer hoje' atualiza automaticamente sem refetch quando o usuário marca recomendações"
    - "Mudanças de status persistem após reload da página"
    - "Updates otimistas: UI atualiza imediatamente; rollback com toast se a API falhar"
  artifacts:
    - path: "supabase/migrations/20260401000000_add_recommendation_actions.sql"
      provides: "Tabela recommendation_actions com UNIQUE(insight_id, rec_index) e RLS via JOIN em ai_insights"
      contains: "CREATE TABLE recommendation_actions"
    - path: "src/types/recommendation-actions.ts"
      provides: "Tipo ActionStatus e interfaces para o actionsMap, TodayAction e resposta da API"
      exports: ["ActionStatus", "RecommendationAction", "TodayAction", "InsightsWithActionsResponse"]
    - path: "src/app/api/insights/actions/route.ts"
      provides: "POST /api/insights/actions — UPSERT de status via Supabase"
      exports: ["POST"]
    - path: "src/app/api/insights/route.ts"
      provides: "GET /api/insights estendido para retornar actions junto com insights"
      contains: "actions"
    - path: "src/app/dashboard/insights/page.tsx"
      provides: "Página integrada: actionsMap state, updateStatus com debounce, TodayCard e dropdown por recomendação"
      contains: "actionsMap"
  key_links:
    - from: "src/app/dashboard/insights/page.tsx"
      to: "/api/insights"
      via: "fetchInsights() — GET retorna { insights, actions, nextAvailableAt, canGenerate }"
      pattern: "data\\.actions"
    - from: "src/app/dashboard/insights/page.tsx"
      to: "/api/insights/actions"
      via: "updateStatus() — POST com { insight_id, rec_index, status }"
      pattern: "fetch.*api/insights/actions"
    - from: "src/app/api/insights/actions/route.ts"
      to: "supabase recommendation_actions"
      via: "supabase.from('recommendation_actions').upsert(..., { onConflict: 'insight_id,rec_index' })"
      pattern: "recommendation_actions.*upsert"
    - from: "InsightCard (inline in page.tsx)"
      to: "actionsMap state"
      via: "getStatus(insight.id, recIndex) — fallback para 'pending' se chave ausente"
      pattern: "actionsMap\\[.*\\].*\\?\\?.*pending"
    - from: "TodayCard (inline in page.tsx)"
      to: "actionsMap state"
      via: "useMemo derivado de insights + actionsMap — sem refetch"
      pattern: "useMemo.*actionsMap"
---

<objective>
Implementar o sistema completo de rastreamento de ações para recomendações de AI insights, cobrindo: persistência no banco (migration), contratos TypeScript, endpoint de UPSERT, extensão do GET, e a UI completa com dropdown de status, contador por card, card "O que fazer hoje" e updates otimistas com rollback.

Purpose: Permitir que o usuário acompanhe quais recomendações da IA já foram implementadas, estão em progresso ou foram descartadas, e visualize um resumo diário das 3 ações mais importantes ainda pendentes.

Output:
- Migration SQL: `supabase/migrations/20260401000000_add_recommendation_actions.sql`
- Tipos: `src/types/recommendation-actions.ts`
- API UPSERT: `src/app/api/insights/actions/route.ts`
- API GET modificada: `src/app/api/insights/route.ts`
- Página integrada: `src/app/dashboard/insights/page.tsx`
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/09-rastreamento-de-a-es/09-CONTEXT.md
@.planning/phases/09-rastreamento-de-a-es/09-RESEARCH.md

<interfaces>
<!-- Contratos existentes que o executor deve usar diretamente. -->

De src/app/dashboard/insights/page.tsx (estado atual — será substituído na Task 5):
```typescript
// Interface atual de Insight (manter; adicionar apenas actionsMap ao redor dela)
interface Insight {
  id: string;
  insight_type: string;
  title: string;
  summary: string;
  detailed_analysis: {
    mainFindings: string[];
    trends: string[];
    risks: string[];
    opportunities: string[];
  };
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }>;
  confidence_score: number;
  created_at: string;
  expires_at: string;
}

// Interface atual de resposta (será estendida na Task 4)
interface InsightsResponse {
  insights: Insight[];
  nextAvailableAt: string;
  canGenerate: boolean;
  upgradeRequired?: boolean;
  message?: string;
  error?: string;
}

// Padrão de auth usado em src/app/api/insights/route.ts
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

const { data: userProfile } = await supabase
  .from('user_profiles')
  .select('subscription_tier')
  .eq('id', user.id)
  .single();

if (!['business', 'agency'].includes(userProfile?.subscription_tier || '')) {
  return NextResponse.json({ error: 'Acesso restrito', upgradeRequired: true }, { status: 403 });
}
```

De supabase/migrations/20250118000000_create_ai_insights_system.sql:
```sql
-- Tabela ai_insights (referência para FK)
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  recommendations JSONB,  -- Array de recomendações
  ...
);
-- RLS já habilitado nesta tabela
```
</interfaces>
</context>

<tasks>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- WAVE 1 — Tasks independentes, executam em paralelo         -->
<!-- ═══════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task 1: Migration — Criar tabela recommendation_actions com RLS</name>
  <files>supabase/migrations/20260401000000_add_recommendation_actions.sql</files>
  <action>
Criar o arquivo de migration seguindo a convenção de nomes do projeto (YYYYMMDDHHMMSS_description.sql). O conteúdo deve ser exatamente:

```sql
-- Phase 9: Rastreamento de Ações
-- Adds recommendation_actions table to track status of AI insight recommendations.
-- Absence of a row means implicit 'pending' status (D-02).

CREATE TABLE IF NOT EXISTS recommendation_actions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id  UUID        NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
  rec_index   INTEGER     NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'done', 'ignored')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (insight_id, rec_index)   -- required for UPSERT onConflict (Pitfall 1)
);

-- Index for fast lookup of all actions for a given insight
CREATE INDEX IF NOT EXISTS idx_recommendation_actions_insight_id
  ON recommendation_actions (insight_id);

ALTER TABLE recommendation_actions ENABLE ROW LEVEL SECURITY;

-- SELECT: user may read actions that belong to their own insights (RLS via JOIN — Pitfall 4)
CREATE POLICY "Users can view own recommendation actions"
  ON recommendation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_insights
      WHERE ai_insights.id = recommendation_actions.insight_id
        AND ai_insights.user_id = auth.uid()
    )
  );

-- INSERT: user may create actions only for their own insights
CREATE POLICY "Users can insert own recommendation actions"
  ON recommendation_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_insights
      WHERE ai_insights.id = recommendation_actions.insight_id
        AND ai_insights.user_id = auth.uid()
    )
  );

-- UPDATE: user may update actions only for their own insights
CREATE POLICY "Users can update own recommendation actions"
  ON recommendation_actions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ai_insights
      WHERE ai_insights.id = recommendation_actions.insight_id
        AND ai_insights.user_id = auth.uid()
    )
  );
```

Notas para o executor:
- A constraint `UNIQUE(insight_id, rec_index)` é OBRIGATÓRIA para o `.upsert({ onConflict: 'insight_id,rec_index' })` funcionar no Supabase JS v2 (Pitfall 1 do RESEARCH.md).
- `ON DELETE CASCADE` garante que ao deletar um insight, todas as suas actions são removidas automaticamente (Pitfall 3).
- Não há coluna `user_id` na tabela; ownership é verificado via JOIN em `ai_insights.user_id` (padrão RLS de tabelas sem user_id direto — Pitfall 4).
- Não inserir dados em massa; a tabela começa vazia (D-02).
  </action>
  <verify>
    <automated>test -f "E:/Projetos/Projetos/Pessoal/pulsewatch/supabase/migrations/20260401000000_add_recommendation_actions.sql" && echo "OK"</automated>
  </verify>
  <done>Arquivo de migration existe, contém CREATE TABLE recommendation_actions, a constraint UNIQUE(insight_id, rec_index), ON DELETE CASCADE, RLS habilitado, e as 3 policies (SELECT, INSERT, UPDATE) com EXISTS subquery via ai_insights.user_id.</done>
</task>

<task type="auto">
  <name>Task 2: TypeScript — Criar src/types/recommendation-actions.ts com contratos de tipos</name>
  <files>src/types/recommendation-actions.ts</files>
  <action>
Criar o arquivo com todos os tipos necessários para a feature. Estes tipos serão importados pela página e pelos endpoints de API.

```typescript
// src/types/recommendation-actions.ts
// Phase 9: Rastreamento de Ações — shared type contracts

/** Os quatro estados possíveis de uma recomendação. Ausência de row = implicitamente 'pending'. */
export type ActionStatus = 'pending' | 'in_progress' | 'done' | 'ignored';

/** Shape de uma row retornada pelo GET /api/insights (join de recommendation_actions). */
export interface RecommendationAction {
  insight_id: string;
  rec_index: number;
  status: ActionStatus;
}

/**
 * Shape de um item exibido no card "O que fazer hoje".
 * Derivado do estado React (insights + actionsMap) via useMemo — sem chamada de API extra.
 */
export interface TodayAction {
  insightId: string;
  insightTitle: string;
  rec: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  };
  recIndex: number;
}

/**
 * Shape completo da resposta do GET /api/insights após a extensão da Task 4.
 * O campo `actions` é um array apenas das rows que existem na tabela;
 * rows ausentes = status implicitamente 'pending'.
 */
export interface InsightsWithActionsResponse {
  insights: Array<{
    id: string;
    insight_type: string;
    title: string;
    summary: string;
    detailed_analysis: {
      mainFindings: string[];
      trends: string[];
      risks: string[];
      opportunities: string[];
    };
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      impact: string;
    }>;
    confidence_score: number;
    created_at: string;
    expires_at: string;
  }>;
  actions: RecommendationAction[];
  nextAvailableAt: string;
  canGenerate: boolean;
  upgradeRequired?: boolean;
  message?: string;
  error?: string;
}

/** Body enviado pelo cliente ao POST /api/insights/actions. */
export interface UpsertActionBody {
  insight_id: string;
  rec_index: number;
  status: ActionStatus;
}
```
  </action>
  <verify>
    <automated>cd "E:/Projetos/Projetos/Pessoal/pulsewatch" && npx tsc --noEmit --skipLibCheck 2>&1 | head -20</automated>
  </verify>
  <done>Arquivo src/types/recommendation-actions.ts existe e exporta: ActionStatus, RecommendationAction, TodayAction, InsightsWithActionsResponse, UpsertActionBody. TypeScript compila sem erros no arquivo.</done>
</task>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- WAVE 2 — Dependem de Wave 1 (tipos definidos)             -->
<!-- ═══════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task 3: API — Criar POST /api/insights/actions (UPSERT de status)</name>
  <files>src/app/api/insights/actions/route.ts</files>
  <action>
Criar o diretório `src/app/api/insights/actions/` e o arquivo `route.ts`. Este endpoint aceita `POST` com body `{ insight_id, rec_index, status }` e faz UPSERT na tabela `recommendation_actions`.

Padrão de auth: idêntico ao usado em `src/app/api/insights/route.ts` (ver seção interfaces do contexto).

Não replicar o gate business/agency aqui — a ação de salvar status não requer verificação de plano (o insight já foi gerado e o acesso à página já foi gatekeepado). A única verificação de segurança necessária é confirmar que o `insight_id` pertence ao usuário logado antes do upsert (defesa em profundidade além do RLS — conforme Padrão 4 do RESEARCH.md).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpsertActionBody, ActionStatus } from '@/types/recommendation-actions';

const VALID_STATUSES: ActionStatus[] = ['pending', 'in_progress', 'done', 'ignored'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: UpsertActionBody = await request.json();
    const { insight_id, rec_index, status } = body;

    // Validate input
    if (!insight_id || rec_index === undefined || rec_index === null || !status) {
      return NextResponse.json({ error: 'Campos obrigatórios: insight_id, rec_index, status' }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }
    if (typeof rec_index !== 'number' || rec_index < 0) {
      return NextResponse.json({ error: 'rec_index deve ser um número inteiro não-negativo' }, { status: 400 });
    }

    // Security: verify insight belongs to this user (defense in depth beyond RLS)
    const { data: insight } = await supabase
      .from('ai_insights')
      .select('id')
      .eq('id', insight_id)
      .eq('user_id', user.id)
      .single();

    if (!insight) {
      return NextResponse.json({ error: 'Insight não encontrado' }, { status: 404 });
    }

    // UPSERT: insert on first status change, update on subsequent changes.
    // UNIQUE(insight_id, rec_index) constraint in migration enables onConflict.
    const { error: upsertError } = await supabase
      .from('recommendation_actions')
      .upsert(
        {
          insight_id,
          rec_index,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'insight_id,rec_index' }
      );

    if (upsertError) {
      console.error('Upsert recommendation action error:', upsertError);
      return NextResponse.json({ error: 'Erro ao salvar status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/insights/actions error:', error);
    return NextResponse.json({ error: 'Erro interno', message: error.message }, { status: 500 });
  }
}
```
  </action>
  <verify>
    <automated>cd "E:/Projetos/Projetos/Pessoal/pulsewatch" && npx tsc --noEmit --skipLibCheck 2>&1 | head -20</automated>
  </verify>
  <done>Arquivo src/app/api/insights/actions/route.ts existe e exporta a função POST. TypeScript compila sem erros. O endpoint valida os campos obrigatórios, verifica ownership do insight e executa o upsert com onConflict correto.</done>
</task>

<task type="auto">
  <name>Task 4: API — Estender GET /api/insights para retornar actions junto com insights</name>
  <files>src/app/api/insights/route.ts</files>
  <action>
Modificar o handler `GET` existente em `src/app/api/insights/route.ts` para, após buscar os insights, também buscar as rows de `recommendation_actions` associadas e retorná-las na resposta.

Localizar o bloco final do GET que retorna o JSON (linha ~73 do arquivo atual):
```typescript
return NextResponse.json({
  insights,
  nextAvailableAt: nextAvailable,
  canGenerate: canGenerate || false,
});
```

Substituir por (adicionar a query de actions antes do return):
```typescript
// Fetch existing action statuses for all loaded insights (single extra round-trip)
const insightIds = (insights ?? []).map((i: { id: string }) => i.id);
let actions: Array<{ insight_id: string; rec_index: number; status: string }> = [];
if (insightIds.length > 0) {
  const { data: actionsData } = await supabase
    .from('recommendation_actions')
    .select('insight_id, rec_index, status')
    .in('insight_id', insightIds);
  actions = actionsData ?? [];
}

return NextResponse.json({
  insights,
  actions,
  nextAvailableAt: nextAvailable,
  canGenerate: canGenerate || false,
});
```

IMPORTANTE: Não alterar nenhuma outra parte do arquivo (auth, plan gate, DELETE handler). Apenas adicionar o bloco de query de actions + atualizar o NextResponse.json final do GET.

O campo `actions` já está tipado em `InsightsWithActionsResponse` (Task 2). Rows ausentes = status implicitamente 'pending' — não forçar inserção de rows para todos os rec_indexes.
  </action>
  <verify>
    <automated>cd "E:/Projetos/Projetos/Pessoal/pulsewatch" && npx tsc --noEmit --skipLibCheck 2>&1 | head -20</automated>
  </verify>
  <done>src/app/api/insights/route.ts tem o bloco de query de actions após a query de insights e antes do return final do GET. O JSON retornado inclui o campo `actions`. Nenhuma outra lógica do arquivo foi alterada.</done>
</task>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- WAVE 3 — Depende de Wave 2 (API pronta)                   -->
<!-- ═══════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task 5: UI — Integrar tudo em insights/page.tsx (actionsMap, TodayCard, dropdown, contador)</name>
  <files>src/app/dashboard/insights/page.tsx</files>
  <action>
Esta task reescreve src/app/dashboard/insights/page.tsx integrando todas as partes da feature. O arquivo deve ser substituído na íntegra pelo conteúdo abaixo. Toda a lógica existente (paywall, geração, deleção, filtros, tabs) deve ser mantida; apenas adições e extensões são aplicadas.

## Mudanças necessárias (aplicar nesta ordem):

### 1. Imports adicionais (no topo do arquivo, após os imports existentes)
```typescript
import { useMemo, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Circle, Clock3, MinusCircle } from 'lucide-react';
import type { ActionStatus, RecommendationAction, TodayAction, InsightsWithActionsResponse } from '@/types/recommendation-actions';
```
Nota: `useState` e `useEffect` já existem; adicionar `useMemo` e `useRef` ao import existente do React.

### 2. Substituir a interface InsightsResponse
Remover a interface `InsightsResponse` existente e usar `InsightsWithActionsResponse` importada dos tipos.

### 3. Adicionar estado actionsMap após os estados existentes
```typescript
const [actionsMap, setActionsMap] = useState<Record<string, ActionStatus>>({});
const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
```

### 4. Modificar fetchInsights para popular actionsMap
Após `setInsights(data.insights || [])`, adicionar:
```typescript
// Populate actionsMap from API (only rows that exist; absent = implicit 'pending')
if (data.actions && data.actions.length > 0) {
  const map: Record<string, ActionStatus> = {};
  for (const action of data.actions) {
    map[`${action.insight_id}:${action.rec_index}`] = action.status as ActionStatus;
  }
  setActionsMap(map);
}
```
Também atualizar a tipagem: `const data: InsightsWithActionsResponse = await response.json();`

### 5. Adicionar helpers após fetchInsights
```typescript
/** Retorna o status de uma recomendação, com fallback para 'pending' se não existe row. */
const getStatus = (insightId: string, recIndex: number): ActionStatus =>
  actionsMap[`${insightId}:${recIndex}`] ?? 'pending';

/** Conta apenas recomendações com status 'done' (D-07: ignoradas não entram na contagem). */
const getDoneCount = (insightId: string, totalRecs: number): number => {
  let count = 0;
  for (let i = 0; i < totalRecs; i++) {
    if (getStatus(insightId, i) === 'done') count++;
  }
  return count;
};

/**
 * Atualiza o status de uma recomendação com optimistic update + per-key debounce 300ms (D-08).
 * UI atualiza imediatamente; API é chamada após 300ms de inatividade na mesma chave.
 * Em caso de falha da API, reverte o estado e exibe toast de erro.
 */
const updateStatus = (insightId: string, recIndex: number, newStatus: ActionStatus) => {
  const key = `${insightId}:${recIndex}`;
  const previousStatus = actionsMap[key] ?? 'pending';

  // Optimistic update: fires immediately for instant UI feedback
  setActionsMap(prev => ({ ...prev, [key]: newStatus }));

  // Per-key debounce: cancels previous timeout for this key only (Pitfall 2)
  if (debounceRefs.current[key]) clearTimeout(debounceRefs.current[key]);
  debounceRefs.current[key] = setTimeout(async () => {
    try {
      const response = await fetch('/api/insights/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight_id: insightId, rec_index: recIndex, status: newStatus }),
      });
      if (!response.ok) throw new Error('Update failed');
    } catch {
      // Rollback to previous status on failure
      setActionsMap(prev => ({ ...prev, [key]: previousStatus }));
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o status da recomendação',
        variant: 'destructive',
      });
    }
  }, 300);
};
```

### 6. Adicionar useMemo para "O que fazer hoje" (D-09: derivado do estado React)
Colocar após os helpers, antes do bloco de loading:
```typescript
/**
 * Top 3 recomendações pendentes ou em progresso, ordenadas por prioridade (D-03, D-04, D-05).
 * Cross-store: itera todos os insights do usuário independente da store.
 * Derivado do estado React — atualiza automaticamente sem refetch (D-09).
 */
const todayActions = useMemo((): TodayAction[] => {
  const pending: TodayAction[] = [];
  for (const insight of insights) {
    for (let i = 0; i < (insight.recommendations?.length ?? 0); i++) {
      const rec = insight.recommendations[i];
      const status = getStatus(insight.id, i);
      if (status === 'pending' || status === 'in_progress') {
        pending.push({
          insightId: insight.id,
          insightTitle: insight.title,
          rec,
          recIndex: i,
        });
      }
    }
  }
  // Sort: high → medium → low (D-05: alta prioridade primeiro)
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  pending.sort((a, b) => (priorityOrder[a.rec.priority] ?? 2) - (priorityOrder[b.rec.priority] ?? 2));
  return pending.slice(0, 3);
}, [insights, actionsMap]); // eslint-disable-line react-hooks/exhaustive-deps
```
Nota: `getStatus` é uma closure sobre `actionsMap`, então `actionsMap` como dependência é suficiente.

### 7. Adicionar helper para label de status
```typescript
const STATUS_LABEL: Record<ActionStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  done: 'Concluída',
  ignored: 'Ignorada',
};

const STATUS_ICON: Record<ActionStatus, React.ReactNode> = {
  pending: <Circle className="h-3 w-3" />,
  in_progress: <Clock3 className="h-3 w-3 text-yellow-500" />,
  done: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  ignored: <MinusCircle className="h-3 w-3 text-muted-foreground" />,
};
```

### 8. Inserir card "O que fazer hoje" no JSX (D-03: acima dos stats cards)
Inserir logo após `{/* Header */}` e antes de `{/* Stats Cards */}`:

```tsx
{/* Card "O que fazer hoje" — sempre visível, topo da página (D-03) */}
{insights.length > 0 && (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        O que fazer hoje
      </CardTitle>
      <CardDescription>
        {todayActions.length > 0
          ? 'Top 3 recomendações de alta prioridade pendentes'
          : 'Tudo em dia! Nenhuma recomendação pendente no momento.'}
      </CardDescription>
    </CardHeader>
    {todayActions.length > 0 && (
      <CardContent>
        <div className="space-y-3">
          {todayActions.map((item) => (
            <div
              key={`${item.insightId}:${item.recIndex}`}
              className="flex items-start justify-between gap-3 border rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.rec.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {item.rec.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">
                  De: {item.insightTitle}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant="outline"
                  className={getPriorityColor(item.rec.priority)}
                >
                  {item.rec.priority === 'high' ? 'Alta' : item.rec.priority === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
                <Select
                  value={getStatus(item.insightId, item.recIndex)}
                  onValueChange={(val) => updateStatus(item.insightId, item.recIndex, val as ActionStatus)}
                >
                  <SelectTrigger className="w-[140px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluída</SelectItem>
                    <SelectItem value="ignored">Ignorada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    )}
  </Card>
)}
```

### 9. Adicionar contador "X/Y concluídas" no header de cada insight card (D-07)
Dentro do map de `filteredInsights`, no bloco `<CardHeader>`, na div que contém os badges de tipo e confiança (linha ~480 do arquivo atual), adicionar após os badges existentes:
```tsx
{insight.recommendations?.length > 0 && (
  <Badge variant="outline" className="gap-1">
    <CheckCircle2 className="h-3 w-3 text-green-500" />
    {getDoneCount(insight.id, insight.recommendations.length)}/{insight.recommendations.length} concluídas
  </Badge>
)}
```

### 10. Adicionar dropdown de status em cada recomendação (D-06)
Dentro do map de `insight.recommendations`, localizar o bloco que renderiza cada recomendação (linha ~573 do arquivo atual):
```tsx
<div className="flex items-start justify-between">
  <h5 className="font-medium">{rec.title}</h5>
  <Badge variant="outline" className={getPriorityColor(rec.priority)}>
    {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
  </Badge>
</div>
```
Substituir por:
```tsx
<div className="flex items-start justify-between gap-2">
  <h5 className="font-medium flex-1">{rec.title}</h5>
  <div className="flex items-center gap-2 flex-shrink-0">
    <Badge variant="outline" className={getPriorityColor(rec.priority)}>
      {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
    </Badge>
    <Select
      value={getStatus(insight.id, idx)}
      onValueChange={(val) => updateStatus(insight.id, idx, val as ActionStatus)}
    >
      <SelectTrigger className="w-[140px] h-7 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pendente</SelectItem>
        <SelectItem value="in_progress">Em Progresso</SelectItem>
        <SelectItem value="done">Concluída</SelectItem>
        <SelectItem value="ignored">Ignorada</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```
Nota: `idx` já é o segundo argumento do `.map((rec, idx) =>` existente na linha ~573.
  </action>
  <verify>
    <automated>cd "E:/Projetos/Projetos/Pessoal/pulsewatch" && npx tsc --noEmit --skipLibCheck 2>&1 | head -30</automated>
  </verify>
  <done>
- src/app/dashboard/insights/page.tsx compila sem erros TypeScript.
- Estado `actionsMap` declarado com `useState&lt;Record&lt;string, ActionStatus&gt;&gt;({})`.
- `fetchInsights` popula `actionsMap` a partir de `data.actions`.
- `updateStatus` implementa optimistic update + per-key debounce 300ms + rollback com toast.
- `todayActions` é calculado via `useMemo` sobre `[insights, actionsMap]`.
- Card "O que fazer hoje" renderizado acima dos stats cards.
- Dropdown de status aparece inline em cada recomendação.
- Contador "X/Y concluídas" aparece no header de cada insight card.
  </done>
</task>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- WAVE 4 — Verificação humana (depende de Wave 3)           -->
<!-- ═══════════════════════════════════════════════════════════ -->

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Sistema completo de rastreamento de ações:
1. Tabela `recommendation_actions` com RLS via JOIN em ai_insights
2. POST /api/insights/actions — UPSERT de status com validação e ownership check
3. GET /api/insights — extendido para retornar campo `actions` junto com insights
4. src/app/dashboard/insights/page.tsx — actionsMap state, updateStatus com debounce, todayCard, dropdown por recomendação, contador por insight card
  </what-built>
  <how-to-verify>
**Pré-requisito:** Ter ao menos 1 insight gerado na conta de teste (business ou agency).

**Teste 1 — ACT-01: Dropdown de status por recomendação**
1. Abrir http://localhost:3000/dashboard/insights
2. Expandir qualquer insight card que tenha recomendações
3. Verificar que cada recomendação tem um dropdown "Pendente / Em Progresso / Concluída / Ignorada" ao lado da badge de prioridade
4. Selecionar "Concluída" em qualquer recomendação — UI deve atualizar IMEDIATAMENTE (optimistic)
5. Recarregar a página — status deve persistir como "Concluída"
6. Selecionar "Ignorada" em outra recomendação e recarregar — deve persistir

**Teste 2 — ACT-02: Contador "X/Y concluídas" no header**
1. Com status do Teste 1 já persistido, olhar o header do insight card
2. Verificar que aparece o badge "X/Y concluídas" (ex: "1/4 concluídas")
3. Marcar mais recomendações como "Concluída" — contador deve incrementar em tempo real
4. Marcar uma recomendação como "Ignorada" — contador NÃO deve incrementar (só 'done' conta)

**Teste 3 — ACT-03: Card "O que fazer hoje"**
1. No topo da página (acima dos stats cards), verificar que o card "O que fazer hoje" está presente
2. Verificar que mostra no máximo 3 recomendações, priorizando 'high' antes de 'medium'
3. Marcar todas as 3 recomendações exibidas como "Concluída" ou "Ignorada"
4. Verificar que o card auto-atualiza para as próximas 3 pendentes SEM reload de página
5. Se não houver mais pendentes, verificar mensagem de estado vazio: "Tudo em dia!"

**Teste 4 — Rollback de erro (opcional)**
1. Abrir DevTools > Network > selecionar "Offline" ou bloquear requests para /api/insights/actions
2. Mudar um status no dropdown
3. Verificar: UI atualiza imediatamente (optimistic), após ~300ms aparece toast de erro e status reverte
  </how-to-verify>
  <resume-signal>Digite "aprovado" se todos os testes passaram, ou descreva os problemas encontrados</resume-signal>
</task>

</tasks>

<verification>
## Verificação Automática (executar antes do checkpoint humano)

```bash
# 1. TypeScript sem erros
cd E:/Projetos/Projetos/Pessoal/pulsewatch && npx tsc --noEmit --skipLibCheck

# 2. Todos os arquivos criados/modificados existem
test -f "supabase/migrations/20260401000000_add_recommendation_actions.sql" && echo "migration: OK"
test -f "src/types/recommendation-actions.ts" && echo "types: OK"
test -f "src/app/api/insights/actions/route.ts" && echo "api actions: OK"

# 3. Verificar constraint UNIQUE na migration
grep -q "UNIQUE.*insight_id.*rec_index" supabase/migrations/20260401000000_add_recommendation_actions.sql && echo "UNIQUE constraint: OK"

# 4. Verificar ON DELETE CASCADE na migration
grep -q "ON DELETE CASCADE" supabase/migrations/20260401000000_add_recommendation_actions.sql && echo "CASCADE: OK"

# 5. Verificar que actionsMap está na página
grep -q "actionsMap" src/app/dashboard/insights/page.tsx && echo "actionsMap state: OK"

# 6. Verificar que o card "O que fazer hoje" está na página
grep -q "O que fazer hoje" src/app/dashboard/insights/page.tsx && echo "TodayCard: OK"

# 7. Verificar que o endpoint de actions exporta POST
grep -q "export async function POST" src/app/api/insights/actions/route.ts && echo "POST handler: OK"

# 8. Verificar que GET /api/insights retorna actions
grep -q "actions" src/app/api/insights/route.ts && echo "GET actions: OK"
```
</verification>

<success_criteria>
1. **ACT-01:** Usuário pode selecionar qualquer um dos 4 status (pendente, em progresso, concluída, ignorada) em cada recomendação via dropdown inline. Status persiste após reload.
2. **ACT-02:** Header de cada insight card exibe badge "X/Y concluídas" que reflete apenas recomendações com status 'done'. Atualiza em tempo real ao marcar.
3. **ACT-03:** Card "O que fazer hoje" está visível no topo da página com as top 3 recomendações pendentes (alta prioridade primeiro). Auto-atualiza quando o usuário muda status das recomendações exibidas sem necessidade de reload.
4. **Performance:** Update de status não dispara chamadas de API para mudanças rápidas no mesmo item (debounce 300ms por chave).
5. **Resiliência:** Falha na API reverte o estado otimista e exibe toast de erro.
6. **TypeScript:** Nenhum erro de compilação no projeto.
</success_criteria>

<output>
Após conclusão, criar `.planning/phases/09-rastreamento-de-a-es/09-01-SUMMARY.md` com:
- Arquivos criados/modificados
- Decisões tomadas (incluindo discretionary decisions)
- Padrões estabelecidos (actionsMap shape, per-key debounce, RLS via JOIN)
- Quaisquer desvios do plano e justificativas
</output>
