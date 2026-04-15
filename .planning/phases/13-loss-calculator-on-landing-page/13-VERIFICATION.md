---
phase: 13-loss-calculator-on-landing-page
verified: 2026-04-15T14:00:00Z
status: human_needed
score: 6/6 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 4/6
  gaps_closed:
    - "Visitor sees accumulated 5h/month estimate below the result cards"
    - "CTA button appears only after a valid value is entered"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Real-time calculation correctness"
    expected: "Type '50.000' in the input field — Card 1 shows approximately R$ 69,44 (hourly loss), Card 2 shows R$ 10.000,00 (20% drop), and the accumulated box shows R$ 347,22 (5h * 69.44)."
    why_human: "UI interaction cannot be verified programmatically without a running browser"
  - test: "CTA hidden on empty input, visible after typing"
    expected: "Load landing page with empty input — the 'Proteger Minha Loja Agora' button, the contextual paragraph above it, and the disclaimer text are all hidden. After typing '50.000', all three appear."
    why_human: "Conditional rendering state transitions require browser verification"
  - test: "Accumulated 5h estimate renders correctly"
    expected: "After typing a value, the red-themed box reads: 'Com 5h/mes de downtime, sua perda estimada seria de R$ X,XX' with the value in bold destructive styling."
    why_human: "Styled text rendering must be verified visually in browser"
  - test: "R$ prefix not doubled"
    expected: "The input shows 'R$' as the positioned span on the left. Result cards display 'R$ X,XX' from formatBRL. Verify the two elements do not visually overlap or duplicate."
    why_human: "Visual rendering edge case requires browser inspection"
  - test: "Calculator section placement"
    expected: "Scrolling the landing page: stats counters appear, then the 'Calculadora de Perdas' section, then 'Recursos Premium'. The calculator is between — not before or after — these two sections."
    why_human: "Page layout position requires visual browser inspection"
---

# Phase 13: Loss Calculator on Landing Page — Verification Report

**Phase Goal:** Visitors to the landing page can estimate how much revenue they lose per hour of store downtime
**Verified:** 2026-04-15T14:00:00Z
**Status:** human_needed — all 6 automated truths verified; 5 items remain for browser confirmation
**Re-verification:** Yes — after gap closure (commit 51a5e1f)

## Re-verification Summary

| Item | Previous Status | Current Status |
|------|-----------------|----------------|
| Truth #4: Accumulated 5h/month estimate | FAILED | VERIFIED |
| Truth #5: CTA gated on hasValue | PARTIAL | VERIFIED |
| All other truths (1, 2, 3, 6) | VERIFIED | VERIFIED (no regressions) |

Both gaps documented in the previous VERIFICATION.md frontmatter are confirmed closed. No regressions detected in previously passing truths.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor sees a Loss Calculator section on the landing page between Stats and Features | VERIFIED | `page.tsx` line 7: import; line 209: `<section id="calculator">`; line 210: `<LossCalculator />` |
| 2 | Visitor types monthly revenue and immediately sees hourly downtime loss | VERIFIED | `parseRevenue(rawInput)` at line 29; `hourlyLoss = monthlyRevenue / 720` at line 31; synchronous on each keystroke via `onChange` |
| 3 | Visitor sees impact of a 20% sales drop alongside the downtime loss | VERIFIED | `salesDropImpact = monthlyRevenue * 0.20` at line 32; rendered in second card lines 107-122 |
| 4 | Visitor sees accumulated 5h/month estimate below the result cards | VERIFIED | `accumulated = hourlyLoss * 5` at line 33; rendered inside `{hasValue && (...)}` block at lines 126-133 with destructive styling |
| 5 | CTA button appears only after a valid value is entered | VERIFIED | Lines 137-153: entire block (paragraph, `<Link>`, `<Button>`, disclaimer) wrapped in `{hasValue && (<>...</>)}` |
| 6 | Widget uses destructive color tokens and existing shadcn components | VERIFIED | Card, CardContent, CardHeader, CardTitle, Input, Button, Badge all imported; `bg-destructive/5`, `border-destructive/20`, `text-destructive` present |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/loss-calculator.tsx` | Interactive loss calculator client component | VERIFIED | 159 lines, `'use client'` at line 1, exports `LossCalculator`, all calculations implemented |
| `src/app/page.tsx` | Landing page with calculator section inserted | VERIFIED | Import at line 7, `<LossCalculator />` at line 210 inside `<section id="calculator">` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/page.tsx` | `src/components/loss-calculator.tsx` | `import { LossCalculator }` | WIRED | Line 7 import; used at line 210 |
| `src/components/loss-calculator.tsx` | `@/components/ui/card.tsx` | Card, CardContent, CardHeader, CardTitle | WIRED | Line 4 import; used throughout component |
| `src/components/loss-calculator.tsx` | `/auth/signup` | CTA Link href — now gated on hasValue | WIRED + GATED | Lines 142-150: `<Link href="/auth/signup">` inside `{hasValue && (<>...</>)}` block |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `loss-calculator.tsx` | `monthlyRevenue` | `parseRevenue(rawInput)` — local state from user input | Yes | FLOWING |
| `loss-calculator.tsx` | `hourlyLoss` | `monthlyRevenue / 720` inline | Yes — derived from user input | FLOWING |
| `loss-calculator.tsx` | `salesDropImpact` | `monthlyRevenue * 0.20` inline | Yes — derived from user input | FLOWING |
| `loss-calculator.tsx` | `accumulated` | `hourlyLoss * 5` inline | Yes — derived from hourlyLoss | FLOWING |

No external API or database dependency — all calculations are purely client-side from user input. Data flow is real and complete for all displayed values.

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — component is a React client component; meaningful behavioral checks require a running browser. Static checks (artifact existence, line-level code inspection) serve as the verification surrogate. Commit 51a5e1f confirmed in git history with correct diff.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| LAND-01 | 13-01-PLAN.md | Landing page exibe calculadora interativa de perdas por downtime | SATISFIED | `<section id="calculator">` with `<LossCalculator />` in `page.tsx` |
| LAND-02 | 13-01-PLAN.md | Calculadora aceita faturamento mensal como input e calcula perda estimada por hora de downtime | SATISFIED | `parseRevenue` + `hourlyLoss = monthlyRevenue / 720`; synchronous on keypress |
| LAND-03 | 13-01-PLAN.md | Calculadora exibe tambem impacto de queda de 20% nas vendas | SATISFIED | `salesDropImpact = monthlyRevenue * 0.20` rendered in second result card |
| LAND-04 | 13-01-PLAN.md | Widget e visualmente consistente com o design system existente | SATISFIED | shadcn Card/Input/Button/Badge components; destructive color tokens; no custom CSS |

All four requirement IDs (LAND-01..04) satisfied. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/loss-calculator.tsx` | 99, 117 | `{hasValue ? formatBRL(...) : 'R$ 0,00'}` — result cards always visible, show "R$ 0,00" before input | Warning | Cards are always rendered with a zero-state fallback rather than being hidden until input is provided. Plan specified conditional rendering `{hasValue && (...)}`. Not a blocker: zero display is not misleading and the important CTA gating is now correctly implemented. |
| `src/components/loss-calculator.tsx` | 3 | Only `useState` imported — no `useRef`/`useCallback` | Info | Plan specified a 300ms debounce via `useRef`. Component performs synchronous live calculation instead. Functionally equivalent or better for UX; not a regression. |

No blocker anti-patterns remain. Both previous blockers (missing accumulated estimate, ungated CTA) are resolved.

---

### Human Verification Required

#### 1. Real-time calculation correctness

**Test:** Open the landing page in a browser. Type `50.000` into the faturamento mensal input.
**Expected:** Card 1 shows approximately R$ 69,44 (50000 / 720 = 69.44). Card 2 shows R$ 10.000,00 (50000 * 0.20). The accumulated box shows approximately R$ 347,22 (69.44 * 5).
**Why human:** UI interaction and exact number formatting cannot be verified statically.

#### 2. CTA visibility gating

**Test:** Load the landing page with an empty input. Scroll to the Calculadora de Perdas section. Observe whether the "Proteger Minha Loja Agora" button is visible. Then type any value and observe whether the button appears.
**Expected:** Button is hidden before input; button, contextual paragraph, and disclaimer all appear after typing a valid value. The gap from the previous verification is now closed.
**Why human:** Conditional rendering state transitions require browser verification.

#### 3. Accumulated 5h estimate renders correctly

**Test:** After typing a value, observe the box below the two result cards.
**Expected:** A red-themed box appears reading "Com 5h/mes de downtime, sua perda estimada seria de R$ X,XX" with the value bold and in destructive (red) color.
**Why human:** Styled text content and visual presentation require browser inspection.

#### 4. R$ prefix not doubled in result cards

**Test:** Type a value and inspect whether "R$" appears once or twice in the result card display values.
**Expected:** The input field's positioned "R$" span is the input prefix only. The result cards show "R$ X,XX" from `formatBRL` — these are distinct UI elements and should not produce duplication.
**Why human:** Visual rendering edge case requires browser inspection.

#### 5. Section placement between Stats and Features

**Test:** Scroll the landing page from top to bottom.
**Expected:** Stats counters appear, then the "Calculadora de Perdas" section, then "Recursos Premium". The calculator section sits between these two, not adjacent to hero or footer.
**Why human:** Page layout position requires visual browser inspection.

---

### Gaps Summary

No gaps remain. Both gaps from the initial verification have been closed by commit 51a5e1f:

- **Gap 1 (Truth #4) — CLOSED:** `accumulated = hourlyLoss * 5` computed at line 33; rendered in a destructive-themed box at lines 126-133, correctly gated by `{hasValue && (...)}`.
- **Gap 2 (Truth #5) — CLOSED:** The entire CTA block (contextual paragraph, `<Link>`, `<Button>`, disclaimer) is now wrapped in `{hasValue && (<>...</>)}` at lines 137-153. The CTA is fully hidden until a valid revenue value is entered.

Phase 13 goal is achieved at the code level. Remaining items are browser-level confirmations that cannot be automated.

---

_Verified: 2026-04-15T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification of initial gaps_found result — both gaps confirmed closed_
