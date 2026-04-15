# Phase 13: Loss Calculator on Landing Page - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Adicionar uma seção interativa "Calculadora de Perdas" na landing page (`src/app/page.tsx`) onde visitantes digitam sua receita mensal e veem imediatamente quanto perdem por hora de downtime e o impacto de uma queda de 20% nas vendas.

**O que é escopo desta fase:**
- Seção dedicada na landing page com headline e calculadora interativa
- Client component separado para a lógica interativa
- 2 métricas principais: perda por hora de downtime + impacto de queda de 20%
- Estimativa acumulada mensal (ex: 5h/mês de downtime)
- CTA após resultados linkando para signup

**O que NÃO é escopo:**
- Integração com dados reais do usuário
- Persistência de valores calculados
- Comparação com benchmark do setor
- Gráficos ou visualizações avançadas

</domain>

<decisions>
## Implementation Decisions

### Posicionamento na Página
- **D-01:** Seção dedicada com `id="loss-calculator"`, posicionada **após Stats Section e antes de Features Section** — momento de "dor" antes de apresentar a solução.
- **D-02:** Seção independente com headline próprio: "Quanto você perde por hora?" com subtítulo contextualizando o custo de downtime.
- **D-03:** CTA "Começar Grátis" aparece **abaixo dos resultados**, somente após o usuário ter digitado um valor e visto as métricas.

### UX da Calculadora
- **D-04:** Input de texto com prefixo **R$** e formatação automática de separador de milhar ao digitar (ex: 50.000).
- **D-05:** Cálculo em **tempo real** (debounced ~300ms) — resultados aparecem enquanto o usuário digita, sem botão "Calcular".
- **D-06:** **2 cards de resultado** lado a lado:
  - "Perda por hora de downtime" — `receita_mensal / 30 / 24`
  - "Impacto de queda de 20% nas vendas" — `receita_mensal * 0.20` (impacto mensal)
- **D-07:** Abaixo dos cards principais, texto menor com estimativa acumulada: "Se ocorrer 5h/mês de downtime: R$ X" — calculado como `(receita_mensal / 30 / 24) * 5`.

### Design Visual
- **D-08:** Visual com **fundo `bg-destructive/5`** e borda `border-destructive/20` para evocar urgência/perda — contraste intencional com as seções neutras.
- **D-09:** Valores de resultado exibidos em **tipografia grande com `text-destructive`** (vermelho) para enfatizar a dor do downtime.
- **D-10:** Disclaimer abaixo dos resultados: _"Estimativa baseada em médias do setor"_ em texto pequeno muted.

### Claude's Discretion
- Ícones exatos para cada métrica (TrendingDown, Clock, BarChart3 ou similar do Lucide)
- Placeholder do input (ex: "Ex: 50.000")
- Texto exato do headline e subtítulo da seção
- Animação/transição dos valores ao calcular (fade ou simples)
- Badge da seção (estilo dos demais badges da landing)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/page.tsx` — Server component; calculadora deve ser extraída como `'use client'` component separado em `src/components/loss-calculator.tsx`
- `src/components/ui/card.tsx` — Card, CardContent, CardHeader, CardTitle, CardDescription
- `src/components/ui/input.tsx` — Input component com suporte a className
- `src/components/ui/button.tsx` — Button com variants e sizes
- `src/components/ui/badge.tsx` — Badge com variant="outline" (padrão de seção)
- Ícones do Lucide já importados: TrendingUp, BarChart3, Timer, Activity, ArrowRight, Sparkles

### Established Patterns
- Seções com `<section className="container py-24">` + `<div className="mx-auto max-w-6xl">`
- Headers de seção: Badge outline → h2 com gradiente → p muted
- Cards com `hover:shadow-2xl hover:border-primary/50 transition-all duration-300`
- Gradientes: `bg-gradient-to-r from-primary to-purple-600`
- Estilos de destaque: `bg-{color}-500/10`, `text-{color}-600` (padrão também em Phase 12)

### Integration Points
- Inserir nova seção em `src/app/page.tsx` entre Stats Section (linha ~205) e Features Section (linha ~207)
- Importar o client component `LossCalculator` no server component da landing page

</code_context>

<specifics>
## Specific Ideas

- Fórmulas:
  - Perda/hora: `receita / 30 / 24`
  - Impacto queda 20%: `receita * 0.20` (mensal)
  - Estimativa acumulada (5h/mês): `(receita / 30 / 24) * 5`
- Os 2 cards de resultado devem ser visualmente simétricos e proeminentes — números grandes em text-destructive
- O CTA abaixo dos resultados deve aparecer apenas quando há um valor válido digitado (condicional no estado)

</specifics>

<deferred>
## Deferred Ideas

- Slider como input alternativo à digitação
- Comparação com benchmark do setor (ex: "média do setor perde R$ X/hora")
- Gráfico de barras mostrando progressão de perda por horas
- Cálculo por plataforma específica com fatores diferentes

</deferred>

---

*Phase: 13-loss-calculator-on-landing-page*
*Context gathered: 2026-04-15 via smart discuss (autonomous mode)*
