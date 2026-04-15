# Phase 14: CSV Export - Research

**Researched:** 2026-04-15
**Domain:** Client-side CSV generation, React state management, browser File API
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Filtro de Data em Alertas**
- Adicionar dois campos de data (De / Até) ao lado dos filtros existentes (Todos / Não Lidos / Lidos)
- Incluir botão "Aplicar" para disparar o filtro (sem re-render a cada keystroke)
- O filtro de data se combina com o filtro de lido/não-lido em conjunto (AND)
- O CSV exporta com base nos filtros aplicados — exporta exatamente o que está visível na tela

**Analytics CSV**
- Exportar os alertas individuais brutos (data, loja, tipo, severidade) filtrados pelo timeRange já selecionado (7d/30d/90d)
- Os dados já estão carregados na página, sem necessidade de nova chamada ao Supabase
- Usar `formatAlertForExport` existente para formatar os dados

**Posicionamento do Botão de Exportar (Analytics)**
- Botão "Exportar CSV" no header da página, ao lado dos tabs 7d/30d/90d
- Exporta os dados do período atualmente selecionado

### Claude's Discretion
- Estilo do campo de data: usar `<input type="date">` nativo ou o componente Input existente do shadcn/ui
- Label do botão: "Exportar CSV" com ícone Download (já importado em alerts/page.tsx)
- Nome dos arquivos gerados: `alertas-pulsewatch` (já existente) e `analytics-pulsewatch`

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXP-01 | Usuário pode exportar alertas filtrados por período em CSV | Date range state (dateFrom/dateTo/dateApplied) added to filteredAlerts derivation; existing exportToCSV + formatAlertForExport handle the actual download |
| EXP-02 | Usuário pode exportar dados de analytics (vendas, uptime) em CSV | `alerts` variable inside loadAnalytics() must be promoted to React state (rawAlerts); button placed beside timeRange Tabs in analytics header |
| EXP-03 | Exportação é gerada client-side (sem dependência de biblioteca externa) | Already satisfied by existing exportToCSV — uses Blob + URL.createObjectURL + anchor click; no server call, no new dependency |
</phase_requirements>

## Summary

Phase 14 is a minimal-change phase: the core CSV generation infrastructure (`exportToCSV`, `formatAlertForExport`) already exists in `src/lib/export-utils.ts` and is already wired into `alerts/page.tsx`. EXP-03 is satisfied today without any new code.

The two concrete changes required are: (1) adding date-range filter state to `alerts/page.tsx` and extending the `filteredAlerts` derivation to apply it, and (2) promoting the `alerts` local variable inside `loadAnalytics()` to a React state variable in `analytics/page.tsx` so the export button in the header can access it.

No new dependencies, no server endpoints, and no new utility functions are needed. The entire phase is React state management and JSX layout work.

**Primary recommendation:** Implement as two focused edits — one per page — with no structural refactoring. Both changes are isolated and carry zero risk to existing functionality.

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (useState) | 18.2.0 | Date range state, rawAlerts state | Project framework |
| Browser File API | Native | Blob, URL.createObjectURL, anchor download | Zero dependencies, already used |
| lucide-react | 0.294.0 | Download icon | Already imported in alerts/page.tsx |
| shadcn/ui Button | project | Export trigger | Already used throughout the project |
| shadcn/ui Input / native date input | project | Date range pickers | Already available |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/export-utils.ts` | internal | exportToCSV, formatAlertForExport | Both pages use these — no changes needed to the file itself |
| `src/lib/audit-logger.ts` | internal | Audit trail for exports | Already called inside exportToCSV automatically |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<input type="date">` | shadcn/ui Input | Native is simpler and carries no extra import cost; Input component can also be used with type="date" — both valid |
| Current Blob approach | papaparse or csv-stringify | External libs add bundle weight; existing hand-rolled solution is correct and already handles BOM (UTF-8 \ufeff), quoting, and null values |

**Installation:** No new packages required.

## Architecture Patterns

### Recommended Project Structure
No new files needed. Changes are limited to:
```
src/
├── app/alerts/page.tsx       # Add dateFrom, dateTo, dateApplied state + filter logic
└── app/analytics/page.tsx    # Promote alerts to rawAlerts state + add export button
```

### Pattern 1: Date Range State in Alerts Page
**What:** Three new state variables gate date filtering without live re-rendering on each keystroke.
**When to use:** User types freely in "De" and "Até" inputs; only clicks "Aplicar" triggers filter.

```typescript
// In alerts/page.tsx
const [dateFrom, setDateFrom] = useState<string>('')
const [dateTo, setDateTo] = useState<string>('')
const [dateApplied, setDateApplied] = useState<{ from: string; to: string } | null>(null)

const filteredAlerts = alerts.filter((alert) => {
  if (filter === 'unread' && alert.is_read) return false
  if (filter === 'read' && !alert.is_read) return false
  if (dateApplied) {
    const created = new Date(alert.created_at)
    if (dateApplied.from) {
      const from = new Date(dateApplied.from)
      from.setHours(0, 0, 0, 0)
      if (created < from) return false
    }
    if (dateApplied.to) {
      const to = new Date(dateApplied.to)
      to.setHours(23, 59, 59, 999)
      if (created > to) return false
    }
  }
  return true
})
```

### Pattern 2: Promoting Local Variable to State in Analytics Page
**What:** `alerts` inside `loadAnalytics()` is a local variable that disappears after the function returns. Promote to state so the export button in the header can reach it.
**When to use:** Any time data loaded in an async function needs to outlive that function call.

```typescript
// In analytics/page.tsx
const [rawAlerts, setRawAlerts] = useState<any[]>([])

// Inside loadAnalytics(), after the Supabase fetch:
// Change: const { data: alerts } = ...
// To:
const { data: alertsData } = await supabase
  .from('alerts')
  .select('*, stores(name)')
  .in('store_id', storeIds)
  .gte('created_at', startDate.toISOString())
  .order('created_at', { ascending: true })

setRawAlerts(alertsData || [])
// then continue using alertsData locally for chart aggregation
```

### Pattern 3: Export Button in Analytics Header
**What:** Placing the export button beside the existing Tabs component in the page header flex row.
**When to use:** This layout pattern is already established — the header uses `flex items-center justify-between`.

```tsx
// In analytics/page.tsx header section — extend the existing flex row
<div className="flex items-center gap-2">
  <Tabs value={timeRange} onValueChange={(v: string) => setTimeRange(v as any)}>
    <TabsList>
      <TabsTrigger value="7d">7 dias</TabsTrigger>
      <TabsTrigger value="30d">30 dias</TabsTrigger>
      <TabsTrigger value="90d">90 dias</TabsTrigger>
    </TabsList>
  </Tabs>
  {rawAlerts.length > 0 && (
    <Button
      variant="outline"
      onClick={() => {
        const exportData = rawAlerts.map(formatAlertForExport)
        exportToCSV(exportData, 'analytics-pulsewatch')
      }}
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  )}
</div>
```

### Pattern 4: Date Filter UI in Alerts Page
**What:** Inline date inputs beside the existing read/unread filter buttons.

```tsx
// In alerts/page.tsx filter row — extend the existing "Filter Tabs" section
<div className="flex gap-2 flex-wrap items-center justify-between">
  <div className="flex gap-2 flex-wrap items-center">
    {/* existing filter buttons ... */}
    <div className="flex items-center gap-2 border rounded-md px-3 py-1">
      <Label htmlFor="dateFrom" className="text-sm whitespace-nowrap">De</Label>
      <Input
        id="dateFrom"
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="h-8 w-auto"
      />
      <Label htmlFor="dateTo" className="text-sm whitespace-nowrap">Até</Label>
      <Input
        id="dateTo"
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="h-8 w-auto"
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setDateApplied({ from: dateFrom, to: dateTo })}
      >
        Aplicar
      </Button>
      {dateApplied && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setDateFrom(''); setDateTo(''); setDateApplied(null) }}
        >
          Limpar
        </Button>
      )}
    </div>
  </div>
  {/* existing export CSV button stays here, uses filteredAlerts */}
</div>
```

### Anti-Patterns to Avoid
- **Calling Supabase again for the analytics export:** The data is already in rawAlerts state — do not add a second fetch.
- **Triggering filter on every date keystroke:** The "Aplicar" button pattern prevents janky UI while the user is mid-typing a date. Never drive filteredAlerts directly from the raw input values.
- **Modifying export-utils.ts:** The existing functions are correct and complete. No changes needed there.
- **Adding the date filter to loadAlerts():** The date filter is a client-side filter on already-loaded data. Do not add Supabase `.gte/.lte` calls — this would break the pattern that all alerts are loaded once, and all filtering is pure JS.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV generation | Custom serializer | `exportToCSV` in export-utils.ts | Already handles BOM, quoting, null/undefined, audit logging |
| Date comparison | Custom date parsing | `new Date(string)` + `setHours` boundary normalization | Native JS Date is sufficient; full-day boundary (00:00 to 23:59:59) is the only edge to handle |
| File download | Fetch to server route | Blob + URL.createObjectURL pattern (already in export-utils.ts) | Zero server cost, works offline, already implemented |

**Key insight:** The only genuine work in this phase is state plumbing — wiring new state variables to existing UI components and an already-correct export function.

## Common Pitfalls

### Pitfall 1: Off-by-One on the "Até" Date Boundary
**What goes wrong:** Filtering `created_at <= dateTo` using `new Date(dateTo)` compares to midnight (00:00:00) of the target day, which excludes all alerts that occurred on that day.
**Why it happens:** `new Date('2026-04-15')` resolves to `2026-04-15T00:00:00.000Z` — alerts from 08:00 that day fail the `<=` check.
**How to avoid:** Set `to.setHours(23, 59, 59, 999)` before comparing, making the range inclusive of the full target day.
**Warning signs:** User selects today's date as "Até" but sees no alerts from today in the export.

### Pitfall 2: rawAlerts State Initialized as Empty Array — Export Button Shows During Loading
**What goes wrong:** If the export button renders whenever `rawAlerts.length > 0`, there is a flash-of-wrong-state after the first render but before `loadAnalytics` completes — but rawAlerts starts empty so the button is hidden during load. This is actually correct behavior.
**How to avoid:** Gate the button on `rawAlerts.length > 0` (not on `!loading`), which already handles both cases naturally.

### Pitfall 3: `alerts` Variable Name Collision in Analytics Page
**What goes wrong:** `loadAnalytics()` uses the local name `alerts` for the Supabase result. Renaming the state to `rawAlerts` and the local variable to `alertsData` (or any other name) avoids collision — but the existing uses of `alerts` inside the function (the forEach loop) must all be updated to `alertsData`.
**How to avoid:** Rename consistently: `const { data: alertsData } = await supabase...` and update all references inside `loadAnalytics()`. The state variable is `rawAlerts`.

### Pitfall 4: Download icon not imported in analytics/page.tsx
**What goes wrong:** `Download` from `lucide-react` is already imported in `alerts/page.tsx` but NOT in `analytics/page.tsx`. Adding the export button without updating the import list causes a TypeScript/build error.
**How to avoid:** Add `Download` to the lucide-react import in `analytics/page.tsx`. Current import is: `import { TrendingUp, Package, DollarSign, AlertCircle } from 'lucide-react'`.
Also import `Button`, `exportToCSV`, and `formatAlertForExport` which are not currently imported in analytics/page.tsx.

### Pitfall 5: `formatAlertForExport` expects `stores(name)` relation to be present
**What goes wrong:** `formatAlertForExport` accesses `alert.stores?.name`. The analytics page already selects `'*, stores(name)'` on the alerts query, so the join is present. If the query is changed to not include the stores join, the store name column in the export becomes "N/A" for all rows.
**How to avoid:** Do not change the analytics page Supabase query. The current select includes the join and must stay as-is.

## Code Examples

### exportToCSV call pattern (verified from src/lib/export-utils.ts)
```typescript
// Source: src/lib/export-utils.ts
// Signature: exportToCSV(data: any[], filename: string): Promise<void>
// - Adds UTF-8 BOM (\ufeff) for Excel compatibility
// - Handles commas, double-quotes, and newlines in values
// - Automatically appends ISO date to filename: `${filename}_YYYY-MM-DD.csv`
// - Calls logAudit internally — no need to call it separately

const exportData = filteredAlerts.map(formatAlertForExport)
await exportToCSV(exportData, 'alertas-pulsewatch')
// Generates: alertas-pulsewatch_2026-04-15.csv
```

### formatAlertForExport output shape (verified from src/lib/export-utils.ts)
```typescript
// Source: src/lib/export-utils.ts
// Returns object with Portuguese column headers:
{
  'Data': string,        // toLocaleString('pt-BR')
  'Loja': string,        // alert.stores?.name || 'N/A'
  'Tipo': string,
  'Severidade': string,
  'Título': string,
  'Mensagem': string,
  'Lido': 'Sim' | 'Não',
  'Email Enviado': 'Sim' | 'Não',
  'Telegram Enviado': 'Sim' | 'Não',
}
```

### Imports needed in analytics/page.tsx (additions only)
```typescript
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportToCSV, formatAlertForExport } from '@/lib/export-utils'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side CSV generation (API route) | Client-side Blob + anchor download | Already established in this project | No server cost, no latency, works offline |
| Filtering with server query params | Client-side JS array filter | Already established in alerts/page.tsx | Instant response, no extra Supabase calls |

**No deprecated approaches apply to this phase.** The existing pattern is already current best practice for this scale of project.

## Open Questions

1. **`<input type="date">` vs shadcn/ui Input with type="date"**
   - What we know: shadcn/ui `Input` component renders as `<input>` and accepts all native input props including `type="date"`.
   - What's unclear: Whether the shadcn/ui Input applies styles that conflict with date picker rendering on certain browsers.
   - Recommendation: Use `<Input type="date" />` from shadcn/ui for consistency with the rest of the form; fall back to native `<input type="date" className="...">` if styling is problematic. Both are valid per Claude's Discretion.

2. **"Limpar" button visibility**
   - What we know: Users need a way to clear the date filter after applying it.
   - What's unclear: Whether the CONTEXT.md intends a "Limpar" affordance or just emptying the inputs resets on next "Aplicar".
   - Recommendation: Include a "Limpar" button that appears only when `dateApplied !== null`. This is the clearest UX and adds minimal code.

## Environment Availability

Step 2.6: SKIPPED — Phase is purely client-side React state and JSX changes. No external tools, services, CLIs, runtimes, or databases beyond the already-running project are required.

## Validation Architecture

`workflow.nyquist_validation` is not present in `.planning/config.json` — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — project has no test configuration files |
| Config file | None |
| Quick run command | `npm run type-check` (TypeScript validates component correctness) |
| Full suite command | `npm run build` (full Next.js build catches import errors and type errors) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXP-01 | Alerts export filtered by date range | manual | `npm run type-check` (validates state types) | N/A |
| EXP-02 | Analytics export with current timeRange data | manual | `npm run type-check` | N/A |
| EXP-03 | No server call during export | manual (Network tab check) | `npm run build` | N/A |

All three requirements involve browser interaction (file download, date input, button click) that cannot be meaningfully automated without a browser test framework (Playwright/Cypress). Manual verification is appropriate.

### Sampling Rate
- **Per task commit:** `npm run type-check`
- **Per wave merge:** `npm run build`
- **Phase gate:** `npm run build` green + manual browser verification of download before `/gsd:verify-work`

### Wave 0 Gaps
None — no test infrastructure exists in the project and none is required by the existing coding conventions. TypeScript type-checking via `npm run type-check` serves as the automated gate.

## Sources

### Primary (HIGH confidence)
- Direct code reading: `src/lib/export-utils.ts` — full function signatures, behavior, and audit logging verified
- Direct code reading: `src/app/alerts/page.tsx` — existing state shape, filter pattern, existing CSV button verified
- Direct code reading: `src/app/analytics/page.tsx` — loadAnalytics() structure, alerts local variable, Tabs component location verified
- Direct code reading: `package.json` — confirmed no CSV library dependency; Blob API is native

### Secondary (MEDIUM confidence)
- `14-CONTEXT.md` — user decisions on date filter UX, button placement, file naming (verified against code to confirm feasibility)
- MDN Web API documentation pattern for `URL.createObjectURL` + anchor download — well-established browser API, unchanged for years

### Tertiary (LOW confidence)
None — all claims in this research are backed by direct code reading.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by reading actual project files
- Architecture: HIGH — patterns derived from existing code already in the project
- Pitfalls: HIGH — identified by reading actual code and spotting specific gaps (missing imports, variable collision, date boundary)
- Open questions: LOW by nature — discretion items with no wrong answer

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable — no external dependencies)
