# Phase 9: Rastreamento de Ações - Research

**Researched:** 2026-04-01
**Domain:** React optimistic updates, Supabase UPSERT + RLS, shadcn/ui Select, derived state patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Criar nova tabela `recommendation_actions` com colunas: `id UUID PK`, `insight_id FK → ai_insights.id`, `rec_index INTEGER`, `status TEXT` (pending|in_progress|done|ignored), `updated_at TIMESTAMP`.
- **D-02:** Ausência de linha na tabela = status implicitamente `pending`. Inserir linha apenas na primeira mudança de status. Sem inserção em massa ao gerar insight.
- **D-03:** Card "O que fazer hoje" posicionado no topo da página de insights, acima dos stats cards. Sempre visível ao entrar na página.
- **D-04:** Escopo cross-store: top 3 recomendações de alta prioridade pendentes de todos os insights do usuário, independente da loja.
- **D-05:** Ao completar/ignorar as 3 exibidas, o card auto-recarrega com as próximas 3 pendentes (alta prioridade primeiro; se não houver mais alta, passa para média). Se não houver nenhuma pendente, mostrar estado vazio.
- **D-06:** Cada recomendação tem um dropdown com as 4 opções: Pendente / Em Progresso / Concluída / Ignorada. Exibido inline no card de recomendação, ao lado da badge de prioridade.
- **D-07:** O contador no header de cada insight card mostra "X/Y concluídas" contando apenas `status = 'done'`. Ignoradas não entram na contagem.
- **D-08:** Usar optimistic update no React state: atualiza imediatamente ao clicar no dropdown, chama a API em background. Se a API falhar, reverte o estado com toast de erro.
- **D-09:** O card "O que fazer hoje" deriva do mesmo estado React — atualiza automaticamente sem refetch quando uma recomendação é marcada.

### Claude's Discretion

- Estrutura do endpoint da API para salvar status (REST `POST /api/insights/actions` ou `PATCH /api/insights/[id]/recommendations/[index]`) — Claude decides.
- RLS policies para a nova tabela `recommendation_actions` — seguir padrão das políticas existentes em `ai_insights`.
- Debounce/throttle de updates se o usuário mudar status rapidamente — Claude decides.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACT-01 | Usuário pode marcar cada recomendação de insight como pendente, em progresso, concluída ou ignorada | D-06 dropdown + D-08 optimistic update + UPSERT API endpoint |
| ACT-02 | Usuário vê progresso de conclusão de recomendações no header de cada insight card (ex: "3/7 concluídas") | D-07 counter derived from actions state |
| ACT-03 | Usuário vê card "O que fazer hoje" com as top 3 recomendações de alta prioridade ainda pendentes | D-03 card position + D-04 cross-store scope + D-09 derived state |
</phase_requirements>

---

## Summary

Phase 9 adds action-tracking to the existing AI insights recommendations. The core implementation has three layers: a new Supabase table (`recommendation_actions`) that stores user-initiated status changes, a single API endpoint for UPSERT of action status, and UI changes to `insights/page.tsx` that add a dropdown per recommendation, a header counter per insight card, and a "O que fazer hoje" top card.

The design decision to treat absent rows as implicitly `pending` (D-02) keeps the database lean and avoids batch inserts on insight generation. This means the implementation must correctly fall back to `'pending'` when no row exists for a given `(insight_id, rec_index)` pair. The derived-state approach for the "O que fazer hoje" card (D-09) avoids a second API call and keeps the UI consistent with optimistic updates.

The main technical risk is stale `rec_index` values if an insight is regenerated. Since insights are never edited in place — the generate endpoint always inserts new rows — old `recommendation_actions` rows simply become orphaned (their `insight_id` FK still points to the now-deleted or superseded insight). This is not a data integrity problem, but any "delete insight" action should CASCADE-delete its actions (FK ON DELETE CASCADE), which this research recommends adding to the migration.

**Primary recommendation:** Use `POST /api/insights/actions` as a flat UPSERT endpoint accepting `{ insight_id, rec_index, status }`. This is simpler than a nested route, matches the flat structure of other insights API routes, and makes it easy to add bulk-status operations later without changing the route signature.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | project-existing | Server Supabase client (auth-aware) | Already used in all API routes via `createClient()` |
| @radix-ui/react-select | project-existing | Dropdown primitive | shadcn/ui Select component already installed |
| React useState | built-in | Optimistic state management | Project uses no global state library; all state is local useState |
| lucide-react | project-existing | Icons (CheckCircle2, Clock, MinusCircle, XCircle for status) | Already the icon library in use |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Select | project-existing | Status dropdown UI | Use for the 4-option status selector; already in `src/components/ui/select.tsx` |
| shadcn/ui Badge | project-existing | Priority badge next to dropdown | Already used in current recommendations rendering |
| useToast | project-existing | Error feedback on rollback | Already imported and used in `insights/page.tsx` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `POST /api/insights/actions` (flat) | `PATCH /api/insights/[id]/recommendations/[index]` (nested) | Nested is more REST-idiomatic but requires dynamic route segments; flat is consistent with existing pattern in `api/insights/route.ts` |
| React useState for action map | Zustand / React Query | Overkill for page-local state; project has no existing global store |
| No debounce | 300ms debounce on status change | Debounce reduces API calls if user clicks through options rapidly; 300ms is the right balance — see Pitfall 2 |

**Installation:** No new packages required. All dependencies already present in the project.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── insights/
│   │       ├── route.ts            # existing GET/DELETE — modify GET to join actions
│   │       ├── generate/route.ts   # existing — no changes
│   │       └── actions/
│   │           └── route.ts        # NEW: POST UPSERT for recommendation status
│   └── dashboard/
│       └── insights/
│           └── page.tsx            # modify: add TodayCard, status dropdown, counter
supabase/
└── migrations/
    └── 20260401000000_add_recommendation_actions.sql  # NEW migration
```

### Pattern 1: State Shape for Actions Map

**What:** A flat map keyed by `"${insightId}:${recIndex}"` holds the current status for every recommendation that has been touched. Untouched recommendations fall back to `'pending'` at read time.

**When to use:** This avoids nesting actions inside each `Insight` object and makes lookup O(1).

```typescript
// Source: derived from project patterns in insights/page.tsx

type ActionStatus = 'pending' | 'in_progress' | 'done' | 'ignored';

// State shape
const [actionsMap, setActionsMap] = useState<Record<string, ActionStatus>>({});

// Helper to read status with implicit-pending fallback
function getStatus(insightId: string, recIndex: number): ActionStatus {
  return actionsMap[`${insightId}:${recIndex}`] ?? 'pending';
}

// Populate from API on load — only rows that exist in recommendation_actions
function populateFromApi(actions: { insight_id: string; rec_index: number; status: ActionStatus }[]) {
  const map: Record<string, ActionStatus> = {};
  for (const a of actions) {
    map[`${a.insight_id}:${a.rec_index}`] = a.status;
  }
  setActionsMap(map);
}
```

### Pattern 2: Optimistic Update with Rollback (D-08)

**What:** Immediately update `actionsMap` in state, fire the API call in background, and restore the previous value if the call fails.

**When to use:** Every time the user selects a new status from the dropdown.

```typescript
// Source: derived from project patterns — no existing optimistic update in codebase
async function updateStatus(insightId: string, recIndex: number, newStatus: ActionStatus) {
  const key = `${insightId}:${recIndex}`;
  const previousStatus = actionsMap[key] ?? 'pending';

  // Optimistic update
  setActionsMap(prev => ({ ...prev, [key]: newStatus }));

  try {
    const response = await fetch('/api/insights/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insight_id: insightId, rec_index: recIndex, status: newStatus }),
    });
    if (!response.ok) throw new Error('Update failed');
  } catch {
    // Rollback
    setActionsMap(prev => ({ ...prev, [key]: previousStatus }));
    toast({ title: 'Erro', description: 'Não foi possível salvar o status', variant: 'destructive' });
  }
}
```

### Pattern 3: Derived "O que fazer hoje" Card (D-09)

**What:** Compute the top 3 pending/high-priority recommendations from the current `insights` + `actionsMap` state on every render. No additional state or API call needed.

**When to use:** Rendering the "O que fazer hoje" card. Recomputes automatically when `actionsMap` changes via `useMemo`.

```typescript
// Source: derived from project patterns
const todayActions = useMemo(() => {
  const pending: Array<{ insightId: string; insightTitle: string; rec: Recommendation; recIndex: number }> = [];

  for (const insight of insights) {
    for (let i = 0; i < (insight.recommendations?.length ?? 0); i++) {
      const rec = insight.recommendations[i];
      const status = getStatus(insight.id, i); // uses actionsMap
      if (status === 'pending' || status === 'in_progress') {
        pending.push({ insightId: insight.id, insightTitle: insight.title, rec, recIndex: i });
      }
    }
  }

  // Sort: high first, then medium, then low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  pending.sort((a, b) => priorityOrder[a.rec.priority] - priorityOrder[b.rec.priority]);

  return pending.slice(0, 3);
}, [insights, actionsMap]);
```

### Pattern 4: UPSERT API Endpoint

**What:** `POST /api/insights/actions` accepts `{ insight_id, rec_index, status }` and performs an upsert on `recommendation_actions`. Same auth pattern as `api/insights/route.ts`.

**When to use:** Called on every status change from the client.

```typescript
// Source: modeled on api/insights/route.ts auth pattern
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { insight_id, rec_index, status } = await request.json();

  // Verify the insight belongs to this user (security: prevent cross-user writes)
  const { data: insight } = await supabase
    .from('ai_insights')
    .select('id')
    .eq('id', insight_id)
    .eq('user_id', user.id)
    .single();

  if (!insight) return NextResponse.json({ error: 'Insight não encontrado' }, { status: 404 });

  const { error } = await supabase
    .from('recommendation_actions')
    .upsert(
      { insight_id, rec_index, status, updated_at: new Date().toISOString() },
      { onConflict: 'insight_id,rec_index' }
    );

  if (error) return NextResponse.json({ error: 'Erro ao salvar status' }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

### Pattern 5: Fetching Existing Actions on Page Load

**What:** The existing `GET /api/insights` is extended to also return the user's `recommendation_actions` rows alongside insights, so page load is a single round-trip.

**When to use:** In `fetchInsights()` — add a parallel query to `recommendation_actions` filtered by the user's insight IDs.

```typescript
// In GET /api/insights — after fetching insights:
const insightIds = (insights ?? []).map(i => i.id);
let actions: any[] = [];
if (insightIds.length > 0) {
  const { data: actionsData } = await supabase
    .from('recommendation_actions')
    .select('insight_id, rec_index, status')
    .in('insight_id', insightIds);
  actions = actionsData ?? [];
}

return NextResponse.json({ insights, actions, nextAvailableAt: nextAvailable, canGenerate: canGenerate || false });
```

### Recommendations Header Counter (D-07)

```typescript
// Per insight card — computed inline during render
function getDoneCount(insightId: string, totalRecs: number): number {
  let count = 0;
  for (let i = 0; i < totalRecs; i++) {
    if (getStatus(insightId, i) === 'done') count++;
  }
  return count;
}
// Usage in CardHeader:
// <Badge variant="outline">{getDoneCount(insight.id, insight.recommendations.length)}/{insight.recommendations.length} concluídas</Badge>
```

### Anti-Patterns to Avoid

- **Storing actions inside the `Insight` type:** Keep `actionsMap` separate from `insights` state. Mixing them requires rewriting the entire `insights` array on every status change, causing full re-renders of all insight cards.
- **Fetching actions in a separate `useEffect` after insights load:** Causes two sequential fetches and a flash of all-pending state. Fetch actions alongside insights in the same `fetchInsights()` call.
- **Using `rec_index` as a stable identifier across regenerations:** `rec_index` is only stable within a specific `insight_id`. Never use `rec_index` alone as a key; always use the compound `"${insightId}:${recIndex}"`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropdown UI | Custom `<div>` with click handlers | shadcn/ui `Select` (already installed) | Handles keyboard nav, focus management, accessibility, portal rendering |
| UPSERT logic | Manual INSERT + UPDATE with error handling | Supabase `.upsert()` with `onConflict` | One call handles both insert and update atomically |
| Concurrent update race | Manual request queue | 300ms debounce on `updateStatus` | Prevents multiple in-flight requests for the same key; simpler than a queue |

**Key insight:** The UPSERT pattern in Supabase requires a unique constraint on `(insight_id, rec_index)` for the `onConflict` clause to work. The migration MUST include this constraint.

---

## Runtime State Inventory

Step 2.5: SKIPPED — this is a greenfield addition (new table, new endpoint, UI additions). No rename or migration of existing data is involved.

---

## Environment Availability

Step 2.6: SKIPPED — no new external dependencies. All tools (Supabase, Next.js, shadcn/ui) are already in use and confirmed operational in the project.

---

## Common Pitfalls

### Pitfall 1: Missing UNIQUE Constraint on `(insight_id, rec_index)` Breaks UPSERT

**What goes wrong:** Supabase `.upsert()` with `onConflict: 'insight_id,rec_index'` silently falls back to INSERT if the unique constraint doesn't exist, creating duplicate rows instead of updating.

**Why it happens:** The `onConflict` parameter references a database constraint by column name, not just column presence. Without the constraint, Postgres can't detect the conflict.

**How to avoid:** Add `UNIQUE(insight_id, rec_index)` to the `recommendation_actions` table in the migration.

**Warning signs:** Multiple rows with the same `(insight_id, rec_index)` appearing in the table; status not persisting correctly after multiple changes.

---

### Pitfall 2: Rapid Dropdown Changes Fire Multiple Concurrent API Calls

**What goes wrong:** User clicks A → B → C quickly. Three in-flight requests race. The server may process them out of order (C arrives before B), leaving status at B instead of C.

**Why it happens:** No throttling on the client-side `updateStatus` function.

**How to avoid:** Debounce `updateStatus` by 300ms using `useRef` + `setTimeout`. The optimistic state updates immediately (good UX), but only the last selection in 300ms fires the API call.

**Warning signs:** Status displayed in UI differs from what is stored in the database after rapid changes.

```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout>>();

function updateStatus(insightId: string, recIndex: number, newStatus: ActionStatus) {
  const key = `${insightId}:${recIndex}`;
  const previousStatus = actionsMap[key] ?? 'pending';

  // Optimistic update fires immediately
  setActionsMap(prev => ({ ...prev, [key]: newStatus }));

  // API call is debounced
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(async () => {
    try {
      const response = await fetch('/api/insights/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight_id: insightId, rec_index: recIndex, status: newStatus }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setActionsMap(prev => ({ ...prev, [key]: previousStatus }));
      toast({ title: 'Erro', description: 'Não foi possível salvar o status', variant: 'destructive' });
    }
  }, 300);
}
```

Note: A single debounce ref works for the whole page since each key is unique. If two different recommendations are changed within 300ms of each other, the debounce would cancel the first one's API call. For a page with potentially many simultaneous changes, use a per-key debounce map instead: `const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})`.

---

### Pitfall 3: Stale rec_index After Insight Deletion Then Regeneration

**What goes wrong:** User has insight A with 4 recommendations, marks rec_index=2 as done. User deletes insight A, generates new insights — a new insight A' is created with a different recommendations array. The old `recommendation_actions` rows are now orphaned (FK points to deleted insight A, which is gone due to ON DELETE CASCADE). No data integrity issue. However, if the *same insight is regenerated by overwriting* (not deleting), old actions would apply to wrong recommendations.

**Why it happens:** The project's generate endpoint always INSERTs new insight rows; it does not update existing ones. So "regenerating" creates a new `insight_id`. Old actions are orphaned and cleaned up by CASCADE.

**How to avoid:** Confirm the FK is defined as `insight_id UUID NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE`. This ensures orphaned action rows are deleted when an insight is deleted. Since regeneration creates a new insight row with a new UUID, there is no risk of stale action mappings being applied to new recommendations.

**Warning signs:** Only if the generate endpoint is ever changed to UPDATE existing insight rows (in-place regeneration) — then rec_index stability would need to be re-evaluated.

---

### Pitfall 4: RLS on `recommendation_actions` — Users Must Only Write Their Own Data

**What goes wrong:** Without proper RLS, a user could UPSERT an action for an `insight_id` that belongs to another user.

**Why it happens:** The `recommendation_actions` table has no `user_id` column — ownership is inherited through the FK to `ai_insights`. A naive RLS policy using `auth.uid()` directly won't work.

**How to avoid:** The RLS `WITH CHECK` must verify ownership by joining through `ai_insights`:

```sql
-- SELECT: user can read actions for their own insights
CREATE POLICY "Users can view own recommendation actions"
  ON recommendation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_insights
      WHERE ai_insights.id = recommendation_actions.insight_id
        AND ai_insights.user_id = auth.uid()
    )
  );

-- INSERT/UPDATE: user can only write actions for their own insights
CREATE POLICY "Users can upsert own recommendation actions"
  ON recommendation_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_insights
      WHERE ai_insights.id = recommendation_actions.insight_id
        AND ai_insights.user_id = auth.uid()
    )
  );

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

The API endpoint adds a second layer of defense (explicit ownership check before upsert), but RLS must be in place as the authoritative guard.

---

### Pitfall 5: `InsightsResponse` Type Not Updated to Include `actions`

**What goes wrong:** The GET endpoint returns `actions` but the TypeScript interface `InsightsResponse` only has `insights`. The page silently ignores actions and starts with all-pending state every time.

**How to avoid:** Update `InsightsResponse` in `page.tsx` to include `actions: Array<{ insight_id: string; rec_index: number; status: ActionStatus }>`.

---

## Code Examples

Verified patterns from project source:

### Auth + Plan Gate (from `api/insights/route.ts`)

```typescript
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

### Supabase UPSERT Pattern

```typescript
// Requires UNIQUE(insight_id, rec_index) constraint in migration
const { error } = await supabase
  .from('recommendation_actions')
  .upsert(
    { insight_id, rec_index, status, updated_at: new Date().toISOString() },
    { onConflict: 'insight_id,rec_index' }
  );
```

### shadcn/ui Select Usage (from `src/components/ui/select.tsx`)

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={currentStatus} onValueChange={(val) => updateStatus(insightId, recIndex, val as ActionStatus)}>
  <SelectTrigger className="w-[160px] h-8 text-xs">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pending">Pendente</SelectItem>
    <SelectItem value="in_progress">Em Progresso</SelectItem>
    <SelectItem value="done">Concluída</SelectItem>
    <SelectItem value="ignored">Ignorada</SelectItem>
  </SelectContent>
</Select>
```

### Migration Template (following project convention)

```sql
-- Phase 9: Rastreamento de Ações
-- Adds recommendation_actions table for tracking status of AI insight recommendations

CREATE TABLE IF NOT EXISTS recommendation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
  rec_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done', 'ignored')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(insight_id, rec_index)  -- required for UPSERT onConflict
);

CREATE INDEX IF NOT EXISTS idx_recommendation_actions_insight_id
  ON recommendation_actions(insight_id);

ALTER TABLE recommendation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendation actions"
  ON recommendation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_insights
      WHERE ai_insights.id = recommendation_actions.insight_id
        AND ai_insights.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own recommendation actions"
  ON recommendation_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_insights
      WHERE ai_insights.id = recommendation_actions.insight_id
        AND ai_insights.user_id = auth.uid()
    )
  );

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

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Each recommendation is read-only, no tracking | Status tracked per recommendation via `recommendation_actions` table | Users can monitor their action backlog |
| "O que fazer hoje" nonexistent | Derived card from React state showing top 3 pending high-priority | Daily focus surface; updates in real-time |
| No feedback on completion progress | "X/Y concluídas" counter in insight card header | Visual sense of progress per insight category |

---

## Open Questions

1. **Should the `actions` query in GET be scoped to non-expired insights only?**
   - What we know: `ai_insights` has an `expires_at` column. The current GET does not filter by `expires_at`.
   - What's unclear: Whether expired insights are shown on the page (the current query doesn't filter them out).
   - Recommendation: Do not filter by `expires_at` in the actions query for now — match whatever the insights query does.

2. **Per-key vs single debounce ref?**
   - What we know: A single debounce ref cancels the previous call regardless of which key was changed. If two different recs are changed within 300ms, the first one's API call is cancelled.
   - What's unclear: In practice, users are unlikely to change two different recommendations within 300ms.
   - Recommendation: Use per-key debounce map (`Record<string, ReturnType<typeof setTimeout>>`) to be safe. Small complexity increase, avoids the edge case entirely.

3. **Does `GET /api/insights` need the `business`/`agency` plan gate for the actions join?**
   - What we know: The existing gate returns `{ upgradeRequired: true }` for non-plan users, which prevents `insights` from loading at all.
   - What's unclear: Nothing — since the actions query is conditional on insights being loaded (gated), it inherits the same gate automatically.
   - Recommendation: No separate gate check needed for the actions join.

---

## Validation Architecture

No automated test infrastructure was found in the project (no `jest.config.*`, `vitest.config.*`, `pytest.ini`, or `tests/` directory). Manual validation applies.

### Phase Requirements → Validation Map

| Req ID | Behavior | Validation Type | How to Verify |
|--------|----------|-----------------|---------------|
| ACT-01 | Status dropdown changes persist | Manual | Change status, reload page, confirm status is preserved |
| ACT-01 | Optimistic update fires immediately | Manual | Change status, observe UI updates before API returns |
| ACT-01 | Rollback on API error | Manual | Mock API failure (disconnect), confirm toast + state revert |
| ACT-02 | "X/Y concluídas" counter increments | Manual | Mark recs as done, confirm counter changes in card header |
| ACT-02 | Ignored recs do not increment counter | Manual | Mark rec as ignored, confirm counter unchanged |
| ACT-03 | "O que fazer hoje" shows top 3 high-priority pending | Manual | Load page with insights, confirm card shows high-priority recs |
| ACT-03 | Card auto-updates when recs are completed | Manual | Complete all 3 shown, confirm next 3 appear (or empty state) |
| ACT-03 | Card falls through to medium priority when no high pending | Manual | Complete all high-priority recs, confirm medium appear |

### Wave 0 Gaps

None — no test framework detected. All validation is manual smoke testing.

---

## Sources

### Primary (HIGH confidence)

- `src/app/api/insights/route.ts` — auth pattern, plan gate, Supabase query structure
- `src/app/api/insights/generate/route.ts` — business/agency gate pattern
- `src/app/dashboard/insights/page.tsx` — existing React state patterns, recommendation rendering, toast usage
- `supabase/migrations/20250118000000_create_ai_insights_system.sql` — `ai_insights` schema, RLS policy structure
- `supabase/migrations/20240101000001_rls_policies.sql` — canonical RLS patterns for user-owned resources
- `supabase/migrations/20260331000000_add_teams_multi_user.sql` — RLS via JOIN pattern for indirect ownership
- `src/components/ui/select.tsx` — Select component API (Radix UI based)
- Supabase docs (upsert with onConflict) — MEDIUM (widely verified, matches Supabase JS v2 behavior)

### Secondary (MEDIUM confidence)

- Project migration naming convention observed across 20+ migration files: `YYYYMMDDHHMMSS_description.sql`
- Debounce pattern for optimistic updates: standard React community practice, no library needed

### Tertiary (LOW confidence)

None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already present in project
- Architecture: HIGH — derived from reading actual project source files
- Pitfalls: HIGH — identified from direct code analysis (UPSERT constraint, RLS ownership join, rapid-click race)
- Migration SQL: HIGH — follows exact patterns from existing migration files

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable stack; Supabase JS v2 API unlikely to change)
