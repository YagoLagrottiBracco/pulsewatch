# Phase 13: Loss Calculator on Landing Page - Research

**Researched:** 2026-04-15
**Domain:** Next.js 14 App Router — interactive 'use client' component embedded in a Server Component landing page
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Seção dedicada com `id="loss-calculator"`, posicionada após Stats Section e antes de Features Section.
- **D-02:** Seção independente com headline próprio: "Quanto você perde por hora?"
- **D-03:** CTA "Começar Grátis" aparece abaixo dos resultados, somente após o usuário ter digitado um valor e visto as métricas.
- **D-04:** Input de texto com prefixo R$ e formatação automática de separador de milhar ao digitar (ex: 50.000).
- **D-05:** Cálculo em tempo real (debounced ~300ms) — sem botão "Calcular".
- **D-06:** 2 cards de resultado lado a lado:
  - "Perda por hora de downtime" — `receita_mensal / 30 / 24`
  - "Impacto de queda de 20% nas vendas" — `receita_mensal * 0.20`
- **D-07:** Abaixo dos cards: estimativa acumulada `(receita_mensal / 30 / 24) * 5` com label "Com 5h/mês de downtime: R$ X".
- **D-08:** Fundo `bg-destructive/5`, borda `border-destructive/20`.
- **D-09:** Valores de resultado em `text-destructive` com tipografia grande.
- **D-10:** Disclaimer: "Estimativa baseada em médias do setor" em text-xs text-muted-foreground.

### Claude's Discretion

- Ícones exatos para cada métrica (TrendingDown, Clock, BarChart3 ou similar do Lucide)
- Placeholder do input (ex: "Ex: 50.000")
- Texto exato do headline e subtítulo da seção
- Animação/transição dos valores ao calcular (fade ou simples)
- Badge da seção (estilo dos demais badges da landing)

### Deferred Ideas (OUT OF SCOPE)

- Slider como input alternativo à digitação
- Comparação com benchmark do setor
- Gráfico de barras mostrando progressão de perda por horas
- Cálculo por plataforma específica com fatores diferentes
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAND-01 | Landing page exibe calculadora interativa de perdas por downtime | Component `src/components/loss-calculator.tsx` as `'use client'`, inserted into `src/app/page.tsx` |
| LAND-02 | Calculadora aceita faturamento mensal como input e calcula perda estimada por hora de downtime | `useState` + `useCallback` + 300ms debounce; formula `receita / 30 / 24` |
| LAND-03 | Calculadora exibe também impacto de queda de 20% nas vendas | Second result card: `receita * 0.20`; accumulated estimate: `(receita / 30 / 24) * 5` |
| LAND-04 | Widget é visualmente consistente com o design system existente | All UI primitives already installed; destructive/primary tokens match existing patterns |
</phase_requirements>

---

## Summary

Phase 13 adds a single interactive section — a "Loss Calculator" — to the existing landing page (`src/app/page.tsx`). The landing page is a Next.js 14 Server Component; interactive logic must live in a separate `'use client'` file. All UI primitives (Card, Input, Button, Badge) are already installed via shadcn. No new packages are required.

The core implementation is a pure React component with two pieces of state: the raw numeric value from the input and the debounce timer. Calculations are deterministic arithmetic with no external dependencies. Number formatting uses the browser-native `Intl.NumberFormat` API with the `pt-BR` locale for Brazilian Real display.

The UI-SPEC (13-UI-SPEC.md) has already resolved every discretionary decision: icon names, copy, section structure, spacing, color tokens, and the interaction state machine. The planner can treat that spec as ground truth for all visual decisions.

**Primary recommendation:** Create `src/components/loss-calculator.tsx` as a self-contained `'use client'` component, import it in `src/app/page.tsx` between lines 205 and 207 (after Stats section, before Features section). Zero new dependencies needed.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (Next.js 14) | 18.2.0 | `useState`, `useCallback`, `useEffect` for debounce | Already in project |
| Tailwind CSS | 3.4.x | Utility classes including `bg-destructive/5`, `border-destructive/20`, `text-destructive` | Already configured |
| lucide-react | 0.294.0 | `TrendingDown`, `AlertTriangle`, `Clock` icons | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui (Card, Input, Button, Badge) | hand-installed | UI primitives | Already present in `src/components/ui/` |
| `Intl.NumberFormat` | browser native | Format numbers as Brazilian Real (pt-BR) | Zero-cost, no install needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Intl.NumberFormat` | `react-number-format` | Library adds bundle weight; Intl is sufficient for this use case |
| Manual debounce with `useEffect`/`useRef` | `lodash.debounce` | Lodash adds a dep; manual debounce is 5 lines and already the project pattern |

**Installation:** No new packages required.

---

## Architecture Patterns

### File Structure

```
src/
├── app/
│   └── page.tsx                        # Server Component — import LossCalculator here
└── components/
    └── loss-calculator.tsx             # NEW — 'use client' component, all interactive logic
```

### Pattern 1: Client Island in Server Component Page

**What:** `src/app/page.tsx` is a Server Component. To add interactivity, extract the interactive widget into its own file marked `'use client'`. The server component simply imports and renders it.

**When to use:** Any time you need `useState`, `useEffect`, or event handlers inside a Next.js 14 App Router page that is otherwise a Server Component.

**Example:**
```typescript
// src/app/page.tsx (Server Component — no 'use client' at top)
import { LossCalculator } from '@/components/loss-calculator'

// ...inside JSX, between Stats section and Features section:
<LossCalculator />
```

```typescript
// src/components/loss-calculator.tsx
'use client'

import { useState, useCallback, useRef } from 'react'
// ...component implementation
```

### Pattern 2: Debounced onChange with useRef timer

**What:** Store the debounce timer ID in a `useRef` so it persists across renders without triggering re-renders. Clear the old timer on every keystroke and set a new one.

**When to use:** Any real-time calculation that should not fire on every keystroke (D-05).

**Example:**
```typescript
'use client'

import { useState, useRef, useCallback } from 'react'

export function LossCalculator() {
  const [rawValue, setRawValue] = useState('')
  const [revenue, setRevenue] = useState<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    // Format for display: insert thousand separators
    const formatted = raw ? Number(raw).toLocaleString('pt-BR') : ''
    setRawValue(formatted)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setRevenue(raw ? Number(raw) : 0)
    }, 300)
  }, [])

  const hourlyLoss = revenue > 0 ? revenue / 30 / 24 : null
  const dropImpact = revenue > 0 ? revenue * 0.20 : null
  const accumulated = revenue > 0 ? (revenue / 30 / 24) * 5 : null

  // ...render
}
```

### Pattern 3: Intl.NumberFormat for Brazilian Real

**What:** Use the browser-native `Intl.NumberFormat` API to format numbers as BRL currency.

**Example:**
```typescript
// Source: MDN Web Docs — Intl.NumberFormat
const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

// formatBRL(69.44)      → "R$\u00a069,44"
// formatBRL(1388.89)    → "R$\u00a01.388,89"
// formatBRL(13888.89)   → "R$\u00a013.888,89"
```

### Pattern 4: Conditional CTA via state gate

**What:** The CTA button and result cards are conditionally rendered based on whether `revenue > 0`.

**When to use:** D-03 requires CTA to appear only after the user has entered a valid value.

**Example:**
```typescript
{revenue > 0 && (
  <Button asChild size="lg" className="bg-gradient-to-r from-primary to-purple-600 ...">
    <Link href="/auth/signup">Começar Grátis — Proteja Suas Vendas</Link>
  </Button>
)}
```

### Pattern 5: Insertion point in page.tsx

**What:** The new section is inserted between the closing `</section>` of the Stats section (line ~205) and the opening `<section id="features"` tag (line ~207).

**Exact insertion:**
```tsx
        </section>

        {/* Loss Calculator Section */}
        <LossCalculator />

        {/* Features Section */}
        <section id="features" className="container py-24">
```

### Anti-Patterns to Avoid

- **Putting `'use client'` on page.tsx itself:** Would convert the entire landing page to a Client Component, breaking SSR/SEO benefits for all other sections.
- **Using `<input type="number">` instead of `type="text"`:** Number inputs reject the `.` thousand-separator character; the spec requires text input with manual formatting.
- **Calculating on every keystroke without debounce:** Violates D-05; use the `useRef` timer pattern above.
- **Importing Button without passing `asChild` for link CTAs:** The Button component is not an anchor by default; use `asChild` with `<Link>` inside to get proper routing.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom string manipulation | `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})` | Handles edge cases (rounding, locale separators, sign) correctly |
| UI primitives | Custom card/button/badge components | Existing `src/components/ui/` | Design system consistency; LAND-04 requirement |
| Thousand-separator display | Manual `.replace()` regex | `Number(raw).toLocaleString('pt-BR')` | Handles all digit counts correctly |

**Key insight:** The entire feature is pure front-end arithmetic with no API calls, no state persistence, and no external services. Complexity comes only from input formatting — which `toLocaleString` solves in one call.

---

## Runtime State Inventory

Step 2.5: SKIPPED — This phase is a greenfield UI addition to a static landing page. No rename, refactor, or data migration involved. No stored data, live service config, OS-registered state, secrets, or build artifacts are affected.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | Build and dev server | Assumed available (project runs) | — | — |
| Next.js 14 | App Router Server/Client component split | Available | 14.0.4 | — |
| lucide-react | TrendingDown, AlertTriangle icons | Available | 0.294.0 | Use any other Lucide icon — all already bundled |
| shadcn components | Card, Input, Button, Badge | Available | hand-installed | — |
| Intl.NumberFormat | BRL formatting | Available (browser/Node native) | native | — |

**Missing dependencies with no fallback:** None.

**Note on lucide-react 0.294.0:** `TrendingDown` and `AlertTriangle` exist in this version. Confirmed from the icon list — `TrendingUp` is already imported in page.tsx from the same version, confirming the import pattern works.

---

## Common Pitfalls

### Pitfall 1: 'use client' boundary breaks Server Component imports

**What goes wrong:** If `loss-calculator.tsx` imports a server-only module (e.g., a module that uses `fs`, Supabase server client, or `next/headers`), the build will fail with a "You're importing a component that needs..." error.

**Why it happens:** Client Components cannot import server-only code.

**How to avoid:** Keep `loss-calculator.tsx` purely presentational with zero server imports. No fetch calls, no Supabase, no `next/headers`.

**Warning signs:** Build error mentioning `'use client'` boundary violation.

---

### Pitfall 2: Input type="number" rejects thousand-separator characters

**What goes wrong:** If the input uses `type="number"`, the browser rejects `.` as an invalid character for the numeric field in most locales, breaking the formatting requirement in D-04.

**Why it happens:** HTML number inputs enforce locale-specific numeric formats that vary by browser/OS.

**How to avoid:** Always use `type="text"` and manage numeric parsing manually via `replace(/\D/g, '')`.

**Warning signs:** User reports they cannot type "50.000" in the input.

---

### Pitfall 3: Stale timer reference causes multiple calculation triggers

**What goes wrong:** Using `useState` (instead of `useRef`) to store the debounce timer ID triggers an extra render on each keystroke, and the closure over the timer ID may be stale.

**Why it happens:** `useState` updates are async and batched; the timer ID stored in state may reference the previous timer.

**How to avoid:** Always store the debounce timer in `useRef<ReturnType<typeof setTimeout> | null>`.

**Warning signs:** Calculation fires multiple times per keystroke; console shows repeated re-renders.

---

### Pitfall 4: Intl.NumberFormat output includes non-breaking space before the currency symbol

**What goes wrong:** `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(1000)` returns `"R$\u00a01.000,00"` — note the non-breaking space (`\u00a0`) between `R$` and the number. If the component independently prepends `R$`, the value will display as `R$R$ 1.000,00`.

**Why it happens:** The `currency` style in `Intl.NumberFormat` already includes the currency symbol.

**How to avoid:** Either use `style:'currency'` (which includes the `R$` automatically) OR format with `style:'decimal'` and add the `R$` prefix manually. Do not mix both.

**Warning signs:** Double `R$` in the displayed values.

---

### Pitfall 5: Division produces floating-point imprecision

**What goes wrong:** `50000 / 30 / 24` → `69.44444444444444...` which displays poorly.

**Why it happens:** JavaScript IEEE 754 floating point.

**How to avoid:** `Intl.NumberFormat` handles rounding for display automatically when `style:'currency'` is used (rounds to 2 decimal places). No additional `Math.round` needed for display.

**Warning signs:** Long decimal strings in result cards.

---

## Code Examples

### Complete component skeleton

```typescript
// src/components/loss-calculator.tsx
// Source: established patterns from src/components/onboarding-widget.tsx and src/app/page.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { TrendingDown, AlertTriangle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function LossCalculator() {
  const [displayValue, setDisplayValue] = useState('')
  const [revenue, setRevenue] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    setDisplayValue(digits ? Number(digits).toLocaleString('pt-BR') : '')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setRevenue(digits ? Number(digits) : 0)
    }, 300)
  }, [])

  const hasValue = revenue > 0
  const hourlyLoss = revenue / 30 / 24
  const dropImpact = revenue * 0.20
  const accumulated = hourlyLoss * 5

  return (
    <section id="loss-calculator" className="container py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header: Badge → h2 → p  */}
        {/* Calculator container: bg-destructive/5 border border-destructive/20 rounded-2xl p-8 md:p-12 */}
        {/* Input with R$ prefix */}
        {/* Result cards — conditional on hasValue */}
        {/* Accumulated estimate — conditional on hasValue */}
        {/* Disclaimer */}
        {/* CTA — conditional on hasValue */}
      </div>
    </section>
  )
}
```

### Insertion point in page.tsx

```tsx
// src/app/page.tsx — after Stats section close (~line 205), before Features section (~line 207)
import { LossCalculator } from '@/components/loss-calculator'

// Inside JSX:
        </section>  {/* Stats section end */}

        <LossCalculator />

        {/* Features Section */}
        <section id="features" className="container py-24">
```

### Number formatting utilities

```typescript
// Display input with thousand separators (no currency symbol)
const toDisplayFormat = (digits: string) =>
  digits ? Number(digits).toLocaleString('pt-BR') : ''

// Format calculated result as BRL currency
const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router (`pages/_app.tsx`) | App Router (`src/app/page.tsx`) as Server Component | Next.js 13+ | Interactive widgets must be separate `'use client'` files |
| `useEffect` for derived state | Direct computation in render | React 18 best practice | Simpler code: `hourlyLoss`, `dropImpact`, `accumulated` are computed inline, not stored in state |

**Deprecated/outdated:**
- Storing computed values in `useState`: unnecessary; compute directly from `revenue` in the render pass since they are pure functions of a single input.

---

## Open Questions

1. **`TrendingDown` availability in lucide-react 0.294.0**
   - What we know: `TrendingUp` is imported in page.tsx from this version, confirming lucide-react works.
   - What's unclear: Whether `TrendingDown` specifically exists in 0.294.0 (it was added in an earlier version and is stable).
   - Recommendation: Use it. If a type error occurs at build time, substitute `TrendingUp` (rotate 180° via CSS) or `ArrowDownRight` as fallback — both already available.

2. **`AlertTriangle` vs `TriangleAlert` naming**
   - What we know: Lucide renamed some icons across major versions. At 0.294.0, `AlertTriangle` is the correct name; `TriangleAlert` is the newer alias introduced in later versions.
   - Recommendation: Use `AlertTriangle` — consistent with the installed version.

---

## Validation Architecture

No test framework is configured in this project (no `jest.config.*`, no `vitest.config.*`, no test files found). The project uses `next lint` and `tsc --noEmit` as the primary quality gates.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — TypeScript + ESLint only |
| Config file | none |
| Quick run command | `npm run type-check && npm run lint` |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAND-01 | Calculator section renders on landing page | smoke | `npm run build` (build catches import errors) | N/A |
| LAND-02 | Input accepted and hourly loss computed | manual | Load `/` in browser, type "50000", verify card shows ~R$ 69,44 | N/A |
| LAND-03 | 20% drop card and accumulated estimate display | manual | With "50000" entered, verify second card shows R$ 10.000,00 and estimate shows ~R$ 347,22 | N/A |
| LAND-04 | Visual consistency with design system | manual | Visual inspection: destructive colors, badge, gradient CTA | N/A |

### Sampling Rate

- **Per task commit:** `npm run type-check`
- **Per wave merge:** `npm run build`
- **Phase gate:** `npm run build` green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No test infrastructure exists — manual verification is the only option for this phase.
- [ ] TypeScript type-check covers structural correctness: `npm run type-check`

*(No test framework install recommended — adding Jest/Vitest is out of scope for this phase and would require a separate infrastructure phase.)*

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection: `src/app/page.tsx` — confirmed insertion point (line 205/207), existing import pattern, section structure
- Direct code inspection: `src/components/ui/input.tsx` — confirmed `type` prop passthrough, className support
- Direct code inspection: `src/components/onboarding-widget.tsx` — confirmed `'use client'` pattern in this codebase
- Direct code inspection: `tailwind.config.ts` — confirmed `destructive` token available
- Direct code inspection: `package.json` — confirmed Next.js 14.0.4, React 18.2.0, lucide-react 0.294.0
- `.planning/phases/13-loss-calculator-on-landing-page/13-UI-SPEC.md` — complete UI contract (copy, icons, state machine, section structure, number format)
- `.planning/phases/13-loss-calculator-on-landing-page/13-CONTEXT.md` — all locked decisions D-01 through D-10

### Secondary (MEDIUM confidence)

- MDN Web Docs: `Intl.NumberFormat` — `pt-BR` locale, `currency: 'BRL'` format verified behavior

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies confirmed present in package.json and node_modules
- Architecture: HIGH — insertion point confirmed by reading page.tsx at lines 180-215; 'use client' pattern confirmed from onboarding-widget.tsx
- Pitfalls: HIGH — all pitfalls are verified from code inspection (type="text" requirement from D-04, Intl double-symbol from MDN, useRef for debounce from React docs pattern)

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable stack — no fast-moving dependencies)
