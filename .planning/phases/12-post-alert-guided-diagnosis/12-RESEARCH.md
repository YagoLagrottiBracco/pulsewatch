# Phase 12: Post-Alert Guided Diagnosis - Research

**Researched:** 2026-04-14
**Domain:** React / Next.js 14 UI — inline contextual card on alerts list page
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** O card "O que fazer agora" aparece **inline expandido** diretamente abaixo do conteúdo do alerta crítico — sem accordion, sem botão de toggle, sem nova rota.
- **D-02:** Visível **somente para alertas com `severity = 'critical'`**. Alertas high, medium ou low não exibem o card.
- **D-03:** O card é **sempre visível** quando o alerta é critical — zero atrito, o usuário vê as recomendações sem precisar clicar em nada.
- **D-04:** Os itens são **hard-coded por tipo de alerta** — lista fixa de passos descritivos por tipo. Sem banco de dados adicional, sem configuração pelo usuário.
- **D-05:** Cada item é **só texto** (sem links externos, sem checkboxes interativos, sem ações). Passos descritivos e acionáveis.
- **D-06:** Tipos cobertos: `downtime` → checklist "Loja offline"; `stock_low` → checklist "Estoque baixo / zerado"; `sales_drop` → checklist "Queda nas vendas". Claude define os itens exatos.
- **D-07:** "Estoque zerado" e "estoque baixo" compartilham o **mesmo tipo `stock_low`** no banco — um único checklist cobre ambos os cenários.

### Claude's Discretion

- Texto exato dos itens de cada checklist (5-7 itens por tipo, práticos e acionáveis)
- Estilo visual do card (cor, ícone, título — seguir design system `bg-{color}-500/10`)
- Comportamento quando o alerta não tem tipo mapeado (não exibir o card)

### Deferred Ideas (OUT OF SCOPE)

- Checkboxes interativos com estado persistido (banco ou localStorage)
- Links externos para status pages das plataformas por tipo de alerta
- Checklist configurável pelo usuário por tipo de alerta
- Página de detalhe `/alerts/[id]` com histórico completo do incidente
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ALERT-01 | Ao visualizar um alerta crítico, usuário vê card "O que fazer agora" com checklist específico por tipo de problema | Card component hard-coded per alert type, rendered conditionally when `severity === 'critical'` |
| ALERT-02 | Checklist cobre os tipos: loja offline, estoque zerado, estoque baixo, queda de vendas | `downtime`, `stock_low`, `sales_drop` are the three DB types; `stock_low` covers both zero and low stock per D-07 |
| ALERT-03 | Card é contextual ao tipo do alerta — não genérico | Lookup map `Record<string, string[]>` keyed by alert type drives unique content per type |
</phase_requirements>

---

## Summary

Phase 12 is a pure front-end addition to `src/app/alerts/page.tsx`. No new routes, no database changes, no API calls. The implementation adds a static contextual checklist card ("O que fazer agora") rendered inline below the existing `CardContent` of each alert that has `severity === 'critical'`.

The alert list already renders each alert as a `Card` with `CardHeader` + `CardContent`. The new card is a second `CardContent` (or a sibling `div` with `border-t`) appended to the existing card when the `critical` + known-type conditions are met. All checklist content is hard-coded as a constant lookup map in the same file (or extracted to a co-located helper file), avoiding any new API surface.

The three covered alert types (`downtime`, `stock_low`, `sales_drop`) are confirmed in the codebase at `src/app/alert-rules/page.tsx` and match the `alerts.type` column (untyped `string` in `database.types.ts`). No DB migration is required.

**Primary recommendation:** Add a `DIAGNOSIS_CHECKLISTS` constant (keyed by alert type) and a pure `AlertDiagnosisCard` React component. Render it conditionally inside the alerts loop in `page.tsx` when `alert.severity === 'critical' && DIAGNOSIS_CHECKLISTS[alert.type]`.

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2 | Component model | Project baseline |
| Next.js | 14.0.4 | App framework | Project baseline |
| Tailwind CSS | 3.4 | Utility styling | Project baseline |
| lucide-react | 0.294 | Icons (Wrench, CheckSquare, etc.) | Already used in alerts page |
| shadcn/ui Card | n/a | Card, CardContent, CardHeader, CardTitle | Already used in alerts page |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx / cn | 2.0 | Conditional class merging | For conditional Tailwind classes |

**No new packages required.** Phase is entirely within the existing stack.

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── app/
│   └── alerts/
│       └── page.tsx          ← modify: add AlertDiagnosisCard render + import
├── components/
│   └── alerts/
│       └── alert-diagnosis-card.tsx   ← new: pure presentational component
└── lib/
    └── alert-checklists.ts            ← new: DIAGNOSIS_CHECKLISTS constant
```

Alternatively, the checklist constant can live directly in `alert-diagnosis-card.tsx` since it is only consumed there. Splitting into `lib/alert-checklists.ts` makes the content easier to test and update independently.

### Pattern 1: Lookup Map for Type-Specific Content

**What:** A `Record<string, string[]>` maps each alert type string to its ordered list of action items.
**When to use:** When content differs strictly by a known finite set of string keys — avoids branching logic.

```typescript
// src/lib/alert-checklists.ts
export const DIAGNOSIS_CHECKLISTS: Record<string, { title: string; items: string[] }> = {
  downtime: {
    title: 'O que fazer agora — Loja offline',
    items: [
      'Acesse a loja diretamente no navegador para confirmar a indisponibilidade.',
      'Verifique o status da plataforma (painel do provedor ou status page pública).',
      'Cheque o DNS do domínio em uma ferramenta como MXToolbox ou DNS Checker.',
      'Reinicie a integração ou sincronize manualmente se a plataforma estiver disponível.',
      'Contate o suporte da plataforma se o problema persistir por mais de 30 minutos.',
      'Comunique sua equipe e clientes se a indisponibilidade ultrapassar 1 hora.',
    ],
  },
  stock_low: {
    title: 'O que fazer agora — Estoque baixo / zerado',
    items: [
      'Identifique os SKUs afetados no painel da plataforma.',
      'Verifique o prazo de reposição com seu fornecedor.',
      'Considere pausar campanhas de tráfego pago para o produto afetado.',
      'Ative a opção "fora de estoque" para evitar vendas de produtos indisponíveis.',
      'Atualize a descrição ou aviso na página do produto se a reposição demorar.',
      'Registre a ocorrência para analisar padrões de ruptura recorrente.',
    ],
  },
  sales_drop: {
    title: 'O que fazer agora — Queda nas vendas',
    items: [
      'Verifique se a loja está online e o checkout está funcionando corretamente.',
      'Confirme se campanhas de marketing estão ativas e com orçamento disponível.',
      'Compare o período com a semana anterior para identificar sazonalidade.',
      'Analise se houve mudança de preço recente nos produtos principais.',
      'Revise avaliações e comentários recentes que possam indicar problema de confiança.',
      'Cheque concorrentes diretos por promoções que possam estar desviando tráfego.',
      'Ative um cupom ou promoção temporária para estimular conversões.',
    ],
  },
}
```

### Pattern 2: Conditional Inline Rendering in Alert Loop

**What:** Check `alert.severity === 'critical'` and presence of checklist key before rendering the diagnosis card. This keeps the condition co-located with the data and avoids prop drilling.
**When to use:** When the card is tightly coupled to a specific loop iteration and has no independent lifecycle.

```tsx
// Inside the filteredAlerts.map() in src/app/alerts/page.tsx
{alert.severity === 'critical' && DIAGNOSIS_CHECKLISTS[alert.type] && (
  <AlertDiagnosisCard
    title={DIAGNOSIS_CHECKLISTS[alert.type].title}
    items={DIAGNOSIS_CHECKLISTS[alert.type].items}
  />
)}
```

### Pattern 3: Pure Presentational Component

**What:** `AlertDiagnosisCard` accepts only `title: string` and `items: string[]` — no business logic, no Supabase calls.
**When to use:** Any UI-only card that renders static derived data.

```tsx
// src/components/alerts/alert-diagnosis-card.tsx
import { Wrench } from 'lucide-react'
import { CardContent } from '@/components/ui/card'

interface AlertDiagnosisCardProps {
  title: string
  items: string[]
}

export function AlertDiagnosisCard({ title, items }: AlertDiagnosisCardProps) {
  return (
    <CardContent className="border-t pt-4">
      <div className="rounded-md bg-orange-500/5 border border-orange-500/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-semibold text-orange-700">{title}</span>
        </div>
        <ol className="space-y-1.5 list-decimal list-inside">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ol>
      </div>
    </CardContent>
  )
}
```

### Anti-Patterns to Avoid

- **Using CardHeader for the diagnosis section:** The diagnosis card is secondary content within an existing alert card. Use `CardContent` with `border-t`, not a second `CardHeader`, which implies a new top-level card section.
- **Fetching checklist content from an API:** Content is static and hard-coded per D-04. No async loading needed.
- **Rendering for non-critical alerts:** Guard with `alert.severity === 'critical'` strictly. High/medium/low alerts must not show the card per D-02.
- **Using accordion or toggle:** D-01 and D-03 explicitly prohibit any interaction before the card is visible.
- **Creating a new route or drawer:** Out of scope per phase boundary.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional class styling | Custom CSS logic | Tailwind utility classes (`bg-orange-500/5`, `border-orange-500/20`) | Already used in the codebase, consistent with `bg-{color}-500/10` pattern from design system |
| Icon rendering | Custom SVG | `lucide-react` (`Wrench` or `Wrench` + `CheckSquare`) | Already imported elsewhere; zero bundle cost |
| Component composition | Inline JSX in page | Extracted `AlertDiagnosisCard` component | Keeps `page.tsx` readable; enables future reuse |

---

## Common Pitfalls

### Pitfall 1: Alert `type` field is untyped `string` in the DB schema

**What goes wrong:** `alerts.type` is typed as `string` in `database.types.ts`, not a union. TypeScript won't catch invalid type values at compile time.
**Why it happens:** The DB schema was intentionally kept flexible to support future alert types.
**How to avoid:** Use the lookup map pattern — `DIAGNOSIS_CHECKLISTS[alert.type]` returns `undefined` for unmapped types, which the conditional guard handles cleanly. Never use a `switch` without a default case.
**Warning signs:** A new alert type appearing in the DB but not in the map — the card simply does not render, which is the correct fallback per Claude's Discretion.

### Pitfall 2: `CardContent` already exists on each alert card

**What goes wrong:** Adding a second `CardContent` without a visual separator creates layout confusion — the diagnosis section merges visually with the actions row.
**Why it happens:** `CardContent` has `p-6 pt-0` by default, so stacking two creates awkward spacing.
**How to avoid:** Add `border-t` and `pt-4` to the diagnosis `CardContent` class, or wrap the diagnosis block inside the existing `CardContent` as a child `div` with `border-t mt-4 pt-4`. Test visually with both a read and unread alert.
**Warning signs:** Design review shows diagnosis section appearing immediately after the store name / timestamp row with no visual separation.

### Pitfall 3: Import path for the new component

**What goes wrong:** Using a relative path `../../components/alerts/alert-diagnosis-card` instead of the `@/` alias.
**Why it happens:** The project uses `@/` alias for `src/`. Inconsistent imports trigger lint warnings.
**How to avoid:** Always use `import { AlertDiagnosisCard } from '@/components/alerts/alert-diagnosis-card'`.

### Pitfall 4: Shared type `stock_low` covers two alert messages

**What goes wrong:** The diagnosis card title says "Estoque baixo / zerado" but the alert itself might say "Estoque zerado" or "Estoque baixo" — potentially confusing.
**Why it happens:** D-07 merges them into one type; the alert `title` field captures the specific message.
**How to avoid:** Keep the checklist title generic ("Estoque baixo / zerado") as defined in the constant. The alert's own `title` field already shows the specific condition to the user.

---

## Code Examples

### Confirmed alert card structure in `page.tsx` (existing, line 720-793)

The alert loop renders each alert as a `<Card>` containing `<CardHeader>` then `<CardContent>`. The diagnosis card slots in as a conditional child after the existing `<CardContent>`.

```tsx
// Existing structure (do not modify inner CardHeader/CardContent)
<Card key={alert.id} className={...}>
  <CardHeader>
    {/* icon, title, badges */}
  </CardHeader>
  <CardContent>
    {/* store name, timestamp, mark-read / delete buttons */}
  </CardContent>
  {/* NEW: insert here */}
  {alert.severity === 'critical' && DIAGNOSIS_CHECKLISTS[alert.type] && (
    <AlertDiagnosisCard
      title={DIAGNOSIS_CHECKLISTS[alert.type].title}
      items={DIAGNOSIS_CHECKLISTS[alert.type].items}
    />
  )}
</Card>
```

### Existing design system color pattern (from STATE.md and codebase)

The project uses `bg-{color}-500/10` / `text-{color}-600` for tinted badge-like backgrounds:
- Auto insights badge: `bg-blue-500/10 text-blue-600`
- Alert triggered badge: `bg-amber-500/10 text-amber-600`
- Suggested for diagnosis card: `bg-orange-500/5 border border-orange-500/20 text-orange-700` (slightly lighter than badges, distinct from unread alert `bg-primary/5`)

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — phase is purely client-side React/TSX changes within the existing Next.js app, no CLI tools, services, or databases beyond what is already running).

---

## Validation Architecture

`workflow.nyquist_validation` key is absent from `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test config file (jest.config.*, vitest.config.*, pytest.ini) found in project |
| Config file | None — Wave 0 would need to create one |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ALERT-01 | Critical alert renders diagnosis card | unit (component render) | `npx vitest run src/components/alerts/alert-diagnosis-card.test.tsx` | No — Wave 0 |
| ALERT-02 | All three types render distinct checklist content | unit (snapshot / content check) | `npx vitest run src/lib/alert-checklists.test.ts` | No — Wave 0 |
| ALERT-03 | Non-critical alert (high/medium/low) does NOT render diagnosis card | unit (conditional render) | Same test file as ALERT-01 | No — Wave 0 |

> Note: Given the project has no test infrastructure today, the planner should budget a Wave 0 task to install and configure a test runner (Vitest is the natural fit for a Next.js + Vite-adjacent stack) OR decide to validate manually via visual inspection. Manual validation is low-risk here because the component is purely presentational with no async logic.

### Sampling Rate
- **Per task commit:** Manual visual check in dev (`npm run dev`, navigate to `/alerts`)
- **Per wave merge:** If Vitest is installed, `npx vitest run`
- **Phase gate:** All three alert types render correct checklist; high/medium/low alerts show no card

### Wave 0 Gaps
- [ ] `src/components/alerts/alert-diagnosis-card.test.tsx` — covers ALERT-01, ALERT-03
- [ ] `src/lib/alert-checklists.test.ts` — covers ALERT-02
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react` — if test automation desired

*(If test automation is deferred, state so in the plan and use manual visual verification as the gate.)*

---

## Sources

### Primary (HIGH confidence)
- `src/app/alerts/page.tsx` — Confirmed: alert card structure, `getSeverityColor`, `getAlertIcon`, loop at line 720, existing imports
- `src/app/alert-rules/page.tsx` — Confirmed: `getRuleTypeLabel` and `getRuleIcon` define the three canonical types (`stock_low`, `downtime`, `sales_drop`)
- `src/lib/database.types.ts` — Confirmed: `alerts.severity` is `'low' | 'medium' | 'high' | 'critical'`; `alerts.type` is untyped `string`
- `src/components/ui/card.tsx` — Confirmed: `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardFooter`, `CardDescription` API
- `src/components/ui/badge.tsx` — Confirmed: variants `default`, `secondary`, `destructive`, `outline`
- `package.json` — Confirmed: lucide-react 0.294, Tailwind 3.4, Next.js 14.0.4, React 18.2

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Color token conventions (`bg-blue-500/10`, `bg-amber-500/10`) observed in production code (badges)
- `12-CONTEXT.md` — Design suggestion: `bg-orange-500/5` with wrench icon for the card

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified directly from `package.json` and existing component files
- Architecture: HIGH — verified against actual card structure in `page.tsx` (lines 720-793); pattern is identical to existing usage
- Pitfalls: HIGH — derived from static analysis of the code (untyped `type` field, existing `CardContent` spacing)
- Checklist content: HIGH — Claude discretion per CONTEXT.md; items follow e-commerce domain knowledge with no external dependency

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable stack — Next.js 14, Tailwind 3, no external APIs)
