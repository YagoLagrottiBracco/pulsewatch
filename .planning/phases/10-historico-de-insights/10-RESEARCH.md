# Phase 10: Histórico de Insights - Research

**Researched:** 2026-04-09
**Domain:** Next.js App Router, Supabase, React state management, shadcn/ui
**Confidence:** HIGH

## Summary

Phase 10 adds two features to the existing insights page: (1) a generation selector dropdown (HIST-01) so users can browse past insight batches, and (2) a side-by-side comparison mode (HIST-02) to view two generations simultaneously. Both features build on existing infrastructure from Phases 8 and 9 — the `insight_generation_log` table already exists, the `ai_insights` table only needs a nullable `generation_id` column added, and all required UI primitives (Select, Badge, Card, Tabs) are already imported.

The primary complexity is threefold: (a) the DB migration to link `ai_insights` rows to their generation batch, (b) refactoring `POST /api/insights/generate` to write to `insight_generation_log` first and propagate that ID, and (c) the compare-mode UI layout (2-column on desktop, stacked on mobile). All patterns are well-established in the project codebase. No new packages are required.

**Primary recommendation:** Implement in three sequential layers — migration, then API changes, then UI — to keep each task independently verifiable.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Conceito de Geração**
- D-01: Adicionar coluna `generation_id UUID REFERENCES insight_generation_log(id)` na tabela `ai_insights`. Coluna nullable para compatibilidade com dados existentes (sem backfill obrigatório — dados sem generation_id são exibidos agrupados pela data `DATE(created_at)`).
- D-02: A rota `POST /api/insights/generate` deve inserir em `insight_generation_log` e propagar o `generation_id` para todos os insights criados naquele batch.
- D-03: Para o seletor, a lista de gerações disponíveis vem de `insight_generation_log` (não de `ai_insights` diretamente) — mais confiável para saber quantos batches existem.

**Navegação pelo Histórico (HIST-01)**
- D-04: Select dropdown adicionado no header da página, ao lado do botão "Gerar Insights". Opções: "Mais recente (atual)" como default + data de cada geração passada formatada como "DD/MM/YYYY HH:mm". Ao trocar o select, os insights na lista abaixo são recarregados para aquela geração.
- D-05: A geração mais recente é sempre selecionada por padrão ao entrar na página. Nenhuma mudança comportamental para o fluxo atual.
- D-06: Badge "Atual" exibido ao lado do título dos insights quando o seletor está na geração mais recente. Ao visualizar geração histórica, badge muda para "Histórico - DD/MM/YYYY".

**Comparação Lado a Lado (HIST-02)**
- D-07: Botão "Comparar" aparece no header somente quando uma geração DIFERENTE da mais recente está selecionada. Ao clicar, ativa o modo comparação.
- D-08: Em modo comparação: layout de 2 colunas. Coluna esquerda = geração selecionada no select principal. Coluna direita = geração mais recente (default) com segundo select para trocar. Header de cada coluna exibe a data da geração e badge "Atual" ou "Histórico".
- D-09: Em mobile (< lg), modo comparação empilha as colunas verticalmente (coluna A em cima, coluna B abaixo) — sem scroll horizontal.
- D-10: Botão "Sair da comparação" retorna ao modo single-column normal.

**API Changes**
- D-11: Adicionar parâmetro `?generation_id=<uuid>` ao `GET /api/insights`. Quando ausente, retorna a geração mais recente (comportamento atual preservado). Quando presente, retorna os insights daquele generation_id.
- D-12: Novo endpoint `GET /api/insights/generations` retorna lista de gerações disponíveis para o usuário: `[{ id, generated_at, insight_count }]` ordenado por `generated_at DESC`.

**Status das Ações em Histórico**
- D-13: Actions (recommendation_actions) são exibidas e editáveis em todas as gerações — não apenas na mais recente.

### Claude's Discretion
- Skeleton/loading state durante troca de geração no select
- Exact column widths no modo comparação (sugestão: 50/50 ou 55/45)
- Debounce de troca de geração no select (evitar calls rápidas consecutivas)
- Empty state quando geração histórica não tem insights (edge case de falha de geração)

### Deferred Ideas (OUT OF SCOPE)
- Paginação de gerações (caso usuário acumule muitas) — Phase 11 pode adicionar se necessário
- Diff visual entre gerações (destacar recomendações novas/removidas) — potencial Phase 15+
- Filtro por insight_type no modo comparação — funciona naturalmente via tabs existentes
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HIST-01 | Usuário pode navegar por gerações passadas de insights via seletor de datas na página de insights | Enabled by: D-03/D-12 (generations endpoint), D-04/D-05 (select UI), D-11 (generation_id param on GET /api/insights), D-01/D-02 (migration + generate propagation) |
| HIST-02 | Usuário pode comparar insights de duas gerações diferentes lado a lado | Enabled by: D-07/D-08/D-09/D-10 (compare mode UI), D-12 (second column uses same generations endpoint), D-13 (actions editable in all generations) |
</phase_requirements>

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.0.4 | App Router, API routes | Already in use |
| React | 18.2.0 | UI state, hooks | Already in use |
| @supabase/supabase-js | ^2.39.0 | DB queries, auth | Already in use |
| Tailwind CSS | ^3.4.0 | Layout, responsive breakpoints | Already in use |
| shadcn/ui Select | (local) | Generation selector dropdown | Already used for action status selectors |
| shadcn/ui Badge | (local) | "Atual" / "Histórico" labels | Already used for insight type/confidence |
| shadcn/ui Card | (local) | Insight cards in both columns | Already used for all insight cards |
| shadcn/ui Button | (local) | "Comparar" / "Sair da comparação" | Already used throughout page |

### No New Packages Required
This phase uses exclusively existing dependencies. No `npm install` step needed.

---

## Architecture Patterns

### Recommended Project Structure (changes only)
```
supabase/migrations/
└── 20260409000000_add_generation_id_to_ai_insights.sql  (NEW)

src/
├── app/
│   ├── api/
│   │   └── insights/
│   │       ├── route.ts              (MODIFY — add ?generation_id param)
│   │       ├── generate/route.ts     (MODIFY — propagate generation_id)
│   │       └── generations/
│   │           └── route.ts          (NEW — GET /api/insights/generations)
│   └── dashboard/
│       └── insights/
│           └── page.tsx              (MODIFY — generation select, compare mode)
└── types/
    └── recommendation-actions.ts     (MODIFY — add Generation type)
```

### Pattern 1: Nullable FK Column Migration
**What:** Add `generation_id` to `ai_insights` as nullable FK referencing `insight_generation_log(id)`.
**When to use:** When linking new concept to existing table without breaking existing data.
**Example:**
```sql
-- 20260409000000_add_generation_id_to_ai_insights.sql
ALTER TABLE ai_insights
  ADD COLUMN generation_id UUID REFERENCES insight_generation_log(id) ON DELETE SET NULL;

CREATE INDEX idx_ai_insights_generation ON ai_insights(generation_id);
```
Confidence: HIGH — standard Postgres ALTER TABLE pattern, no data loss.

### Pattern 2: Propagate generation_id in generate/route.ts
**What:** Insert into `insight_generation_log` FIRST, capture the returned `id`, then include it in every `ai_insights` row of the batch.
**When to use:** Any batch insert where rows need to be grouped under a single parent.
**Example (current code to modify):**
```typescript
// Current: log is inserted AFTER insights
await supabase.from('insight_generation_log').insert({ user_id: user.id, success: true });

// New: insert log FIRST, get ID, then use in batch insert
const { data: logEntry } = await supabase
  .from('insight_generation_log')
  .insert({ user_id: user.id, success: true })
  .select('id')
  .single();

const insightsToInsert = insights.map((insight) => ({
  ...existingFields,
  generation_id: logEntry.id,   // propagated to all rows in batch
}));
```
Confidence: HIGH — Supabase `.insert().select('id').single()` is documented standard.

### Pattern 3: GET /api/insights/generations Endpoint
**What:** New route file at `src/app/api/insights/generations/route.ts`. Auth + tier check (same as existing `/api/insights`), then query `insight_generation_log` with insight count via join.
**Example:**
```typescript
// GET /api/insights/generations
const { data: generations } = await supabase
  .from('insight_generation_log')
  .select('id, generated_at, ai_insights(count)')
  .eq('user_id', user.id)
  .eq('success', true)
  .order('generated_at', { ascending: false });

// Map to { id, generated_at, insight_count }
const result = (generations ?? []).map((g) => ({
  id: g.id,
  generated_at: g.generated_at,
  insight_count: (g.ai_insights as unknown as { count: number }[])?.[0]?.count ?? 0,
}));
```
Confidence: MEDIUM — Supabase aggregate via nested select `.select('ai_insights(count)')` is valid but syntax may require verification. Alternative: two-query approach (fetch generations, then count insights per generation_id in `ai_insights`) is HIGH confidence.

### Pattern 4: GET /api/insights with ?generation_id
**What:** In `route.ts` GET handler, read `searchParams.get('generation_id')`. If present and valid UUID, filter query by `generation_id`. If absent, apply current behavior (latest by `created_at`).
**Example:**
```typescript
const generationId = searchParams.get('generation_id');

let query = supabase
  .from('ai_insights')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(limit);

if (generationId) {
  query = query.eq('generation_id', generationId);
}
// else: existing behavior (no generation_id filter = returns most recent N)
```
Confidence: HIGH — existing pattern in same file (type filter follows same approach).

### Pattern 5: Compare Mode UI State
**What:** Three new state variables in `InsightsPage`. Page renders either single-column or two-column layout depending on `compareMode`.
**Example:**
```typescript
const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null); // null = latest
const [compareMode, setCompareMode] = useState(false);
const [compareGenerationId, setCompareGenerationId] = useState<string | null>(null); // null = latest

// Two-column layout when compareMode is true
<div className={compareMode ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
  <InsightColumn generationId={selectedGenerationId} label="A" />
  {compareMode && <InsightColumn generationId={compareGenerationId} label="B" />}
</div>
```
Confidence: HIGH — standard Tailwind responsive grid, pattern already used in this codebase.

### Pattern 6: InsightColumn Extraction (Refactor)
**What:** The current list of insight cards (lines 600-770 of page.tsx) should be extracted to a reusable `InsightColumn` component or a render helper. This component receives `generationId` (nullable), fetches its own data, and renders the card list with its own loading/empty state.
**Why needed:** Compare mode requires two independent data-fetching units. Without extraction, the page would need to duplicate all fetch + render logic.
**Approach:** Either a local function component inside page.tsx or a separate file at `src/components/insights/insight-column.tsx`. Local is simpler given the existing actionsMap sharing.

### Anti-Patterns to Avoid
- **Shared actionsMap between columns:** In compare mode, `actionsMap` keys are `insight_id:rec_index`. Since insight IDs are globally unique UUIDs, the same map can safely serve both columns without collision. Do NOT create two separate actionsMap states.
- **Backfilling generation_id:** D-01 explicitly forbids mandatory backfill. Do NOT run an UPDATE on existing `ai_insights` rows. Insights without `generation_id` are grouped by `DATE(created_at)` when displayed — but this grouping is NOT required in Phase 10 (the select only shows generations from `insight_generation_log`, not legacy data).
- **Filtering GET /api/insights "latest" by generation_id:** When `generation_id` is absent, the current query (`ORDER BY created_at DESC LIMIT 10`) returns the most recent insights regardless of generation. This is the correct preserved behavior. Do NOT change this to "latest generation_id only" — that would break the default view for users with no generations yet.
- **Fetching generation list inside the insights response:** Keep `GET /api/insights/generations` as a separate endpoint (D-12). Do not embed the full generations list in `GET /api/insights` — the page needs to fetch generations independently on mount.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Generation date formatting | Custom date formatter | `new Date(ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })` | Already used in page.tsx for `created_at` display |
| Responsive 2-column layout | CSS flexbox with JS resize listener | `grid grid-cols-1 lg:grid-cols-2` (Tailwind) | Pattern already used in stats cards grid on same page |
| Debounce for generation select | Custom setTimeout logic | Already present in page.tsx (`debounceRefs`) for action updates — same pattern | Proven in-project pattern |
| UUID validation for generation_id param | Custom regex | `crypto.randomUUID()` output is always valid; trusting DB FK constraint is sufficient | Over-engineering for this scope |

---

## Runtime State Inventory

> This is NOT a rename/refactor phase — no existing runtime state needs migration. The `generation_id` column is added as nullable (no UPDATE to existing rows). This section is included briefly for clarity.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `ai_insights` rows without `generation_id` | None — nullable column, no backfill (D-01) |
| Stored data | `insight_generation_log` rows without linked insights | None — existing rows already there, new FK is one-directional |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None — no new env vars required | None |
| Build artifacts | None | None |

---

## Common Pitfalls

### Pitfall 1: generate/route.ts — Log Order Matters
**What goes wrong:** If `insight_generation_log` is inserted AFTER the insights (current code), you cannot obtain the `generation_id` before inserting the insights batch.
**Why it happens:** Current code inserts the log entry as a side-effect after success. It was not designed to propagate IDs.
**How to avoid:** Restructure `generate/route.ts` to: (1) insert log entry first with `.select('id').single()`, (2) use returned `id` in the batch insert, (3) on failure, update the log entry to `success: false` instead of inserting a new failed row.
**Warning signs:** If `generation_id` is NULL on newly generated insights after the phase, the log-first order was not applied correctly.

### Pitfall 2: insight_generation_log Unique Constraint
**What goes wrong:** The existing table has `UNIQUE (user_id, generated_at)` which uses `NOW()` as default. Two rapid calls within the same millisecond would conflict.
**Why it happens:** The constraint was designed for rate limiting, not for use as a grouping key.
**How to avoid:** The new code inserts ONE row per batch (not per insight), so conflicts are extremely unlikely. No schema change needed. If conflict occurs, the `generate` route already has a try/catch that logs the error.

### Pitfall 3: "Latest" Behavior When No Generations Exist
**What goes wrong:** A user with existing insights (pre-Phase 10) opens the page. `GET /api/insights/generations` returns an empty list. The generation selector shows nothing. But `GET /api/insights` (no `generation_id`) still correctly returns their insights.
**Why it happens:** Legacy insights have no `generation_id` — they won't appear in `insight_generation_log`-based lists.
**How to avoid:** When `generations` list is empty, hide the generation selector entirely and show no badge (or show a static "Dados anteriores" label). The main insights list still loads normally via the default behavior of `GET /api/insights`.

### Pitfall 4: actionsMap Collision in Compare Mode
**What goes wrong:** (Non-issue but worth documenting.) Two columns might display the same insight from different perspectives.
**Why it's not an issue:** Insight IDs are UUIDs — globally unique. The same insight cannot appear in two different generations. The shared `actionsMap` keyed by `insight_id:rec_index` is safe for both columns.

### Pitfall 5: Compare Mode "Sair" Resets Both Selects
**What goes wrong:** When the user exits compare mode, if the compare column had a different generation selected, the state is left dirty.
**How to avoid:** `setCompareMode(false)` should also reset `setCompareGenerationId(null)` (back to "latest") so re-entering compare mode starts clean.

### Pitfall 6: Supabase Nested Count Syntax
**What goes wrong:** `supabase.from('insight_generation_log').select('id, generated_at, ai_insights(count)')` may not return the expected shape depending on Supabase JS SDK version (^2.39.0).
**How to avoid:** Test with a two-query fallback: first fetch all generation IDs, then separately `count` ai_insights grouped by generation_id. Document the verified shape in the task that implements this endpoint.

---

## Code Examples

### Generation Select Rendering
```typescript
// Source: CONTEXT.md D-04, project patterns
type Generation = { id: string; generated_at: string; insight_count: number };

// Format for display (pt-BR locale, matches existing date patterns in page.tsx)
function formatGenerationDate(isoString: string): string {
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// In JSX — generation selector in header
<Select
  value={selectedGenerationId ?? 'latest'}
  onValueChange={(val) => setSelectedGenerationId(val === 'latest' ? null : val)}
>
  <SelectTrigger className="w-[220px]">
    <SelectValue placeholder="Mais recente (atual)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="latest">Mais recente (atual)</SelectItem>
    {generations.map((g) => (
      <SelectItem key={g.id} value={g.id}>
        {formatGenerationDate(g.generated_at)}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Generation Badge
```typescript
// Source: CONTEXT.md D-06
const isLatest = selectedGenerationId === null;

<Badge variant={isLatest ? 'default' : 'secondary'}>
  {isLatest
    ? 'Atual'
    : `Histórico - ${new Date(selectedGeneration?.generated_at ?? '').toLocaleDateString('pt-BR')}`}
</Badge>
```

### Compare Button (D-07)
```typescript
// Only shown when a historical generation is selected
{selectedGenerationId !== null && !compareMode && (
  <Button variant="outline" onClick={() => setCompareMode(true)}>
    Comparar
  </Button>
)}
{compareMode && (
  <Button variant="ghost" onClick={() => { setCompareMode(false); setCompareGenerationId(null); }}>
    Sair da comparação
  </Button>
)}
```

### Two-Column Layout (D-08, D-09)
```typescript
// Tailwind: stacks on mobile, side-by-side on lg+
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div>
    {/* Column A: selectedGenerationId */}
  </div>
  <div>
    {/* Column B: compareGenerationId (default = null = latest) */}
    <Select value={compareGenerationId ?? 'latest'} onValueChange={...}>
      {/* same options as primary selector */}
    </Select>
  </div>
</div>
```

### SQL Migration
```sql
-- supabase/migrations/20260409000000_add_generation_id_to_ai_insights.sql
ALTER TABLE ai_insights
  ADD COLUMN IF NOT EXISTS generation_id UUID
    REFERENCES insight_generation_log(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ai_insights_generation
  ON ai_insights(generation_id);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual per-field state updates | React `useState` + `useMemo` derived state | Phase 9 | `actionsMap` and `todayActions` are derived, no extra fetches |
| Direct mutation on action save | Optimistic update + debounce rollback | Phase 9 | Pattern must be preserved for actions in historical generations |

---

## Open Questions

1. **Supabase nested aggregate count syntax**
   - What we know: `select('id, generated_at, ai_insights(count)')` is the documented approach for Supabase embedded counts, but behavior with SDK ^2.39.0 needs to be verified at implementation time.
   - What's unclear: Whether the `count` returns `[{count: N}]` or a raw integer in this version.
   - Recommendation: Implement `GET /api/insights/generations` with a two-query fallback (fetch generations + separate count query) and verify the nested count shape in the task. Document the working shape in a code comment.

2. **insight_generation_log `success` filter in generations list**
   - What we know: The table stores failed generations with `success: false`. D-12 says the endpoint returns "available generations" — which implies only successful ones.
   - What's unclear: Whether failed generations (with 0 insights) should be hidden or shown with `insight_count: 0`.
   - Recommendation: Filter `WHERE success = true` in the generations endpoint. Consistent with D-03 intent ("more reliable to know how many batches exist").

---

## Environment Availability

Step 2.6: SKIPPED (no new external dependencies — all tools and services already running for the project).

---

## Validation Architecture

> No `.planning/config.json` found — treating `nyquist_validation` as enabled (absent = enabled).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — project has no test config files or test directories |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIST-01 | GET /api/insights/generations returns list for authenticated business user | manual-only | N/A | No test infra |
| HIST-01 | GET /api/insights?generation_id=X returns insights filtered to that generation | manual-only | N/A | No test infra |
| HIST-01 | Generation select in UI loads and switches generation correctly | manual-only | N/A | No test infra |
| HIST-02 | Compare mode activates showing two columns | manual-only | N/A | No test infra |
| HIST-02 | Compare mode stacks on mobile (< lg breakpoint) | manual-only | N/A | No test infra |

### Wave 0 Gaps
No test infrastructure exists in this project. Manual verification is the established pattern for all phases (consistent with Phases 8 and 9). No Wave 0 test setup required.

---

## Sources

### Primary (HIGH confidence)
- Direct source code read: `src/app/dashboard/insights/page.tsx` — full implementation of current insights page
- Direct source code read: `src/app/api/insights/route.ts` — existing GET handler patterns
- Direct source code read: `src/app/api/insights/generate/route.ts` — current generation flow (log insert order)
- Direct schema read: `supabase/migrations/20250118000000_create_ai_insights_system.sql` — ai_insights and insight_generation_log schema
- Direct schema read: `supabase/migrations/20260401000000_add_recommendation_actions.sql` — Phase 9 migration pattern (nullable FK, index style)
- Direct type read: `src/types/recommendation-actions.ts` — existing type contracts

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions D-01 through D-13 — all architectural decisions pre-made by project author

### Tertiary (LOW confidence)
- Supabase nested aggregate count syntax (`ai_insights(count)`) — not verified against running instance; flagged in Open Questions

---

## Metadata

**Confidence breakdown:**
- DB migration: HIGH — standard Postgres ALTER TABLE, mirrors Phase 9 migration exactly
- generate/route.ts propagation: HIGH — Supabase `.insert().select().single()` is documented standard
- GET /api/insights generations endpoint: MEDIUM — aggregate count syntax needs runtime verification
- UI state management: HIGH — follows established Phase 9 patterns (actionsMap, debounce, optimistic update)
- Compare mode layout: HIGH — standard Tailwind responsive grid, well-established in project

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable tech stack — Next.js 14, Supabase JS SDK fixed at ^2.39.0)
