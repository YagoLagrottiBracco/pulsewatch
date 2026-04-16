# Phase 14: CSV Export - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Adicionar exportação CSV na página de Alertas (com filtro de data range) e na página de Analytics (exportando alertas brutos do período selecionado). Toda a geração de arquivo acontece no browser — sem endpoint de servidor. A infraestrutura (`export-utils.ts` com `exportToCSV` e `formatAlertForExport`) já existe e está em uso.

</domain>

<decisions>
## Implementation Decisions

### Filtro de Data em Alertas
- Adicionar dois campos de data (De / Até) ao lado dos filtros existentes (Todos / Não Lidos / Lidos)
- Incluir botão "Aplicar" para disparar o filtro (sem re-render a cada keystroke)
- O filtro de data se combina com o filtro de lido/não-lido em conjunto (AND)
- O CSV exporta com base nos filtros aplicados — exporta exatamente o que está visível na tela

### Analytics CSV
- Exportar os alertas individuais brutos (data, loja, tipo, severidade) filtrados pelo timeRange já selecionado (7d/30d/90d)
- Os dados já estão carregados na página, sem necessidade de nova chamada ao Supabase
- Usar `formatAlertForExport` existente para formatar os dados

### Posicionamento do Botão de Exportar (Analytics)
- Botão "Exportar CSV" no header da página, ao lado dos tabs 7d/30d/90d
- Exporta os dados do período atualmente selecionado

### Claude's Discretion
- Estilo do campo de data: usar `<input type="date">` nativo ou o componente Input existente do shadcn/ui
- Label do botão: "Exportar CSV" com ícone Download (já importado em alerts/page.tsx)
- Nome dos arquivos gerados: `alertas-pulsewatch` (já existente) e `analytics-pulsewatch`

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/export-utils.ts` — `exportToCSV(data, filename)`, `formatAlertForExport(alert)`, `formatProductForExport`, `formatStoreForExport` — totalmente funcional
- `src/app/alerts/page.tsx` — já importa e usa `exportToCSV` + `formatAlertForExport`, já tem botão "Exportar CSV" baseado em `filteredAlerts`
- Ícone `Download` de `lucide-react` já importado em alerts/page.tsx
- Componentes `Button`, `Input`, `Label` já disponíveis via shadcn/ui

### Established Patterns
- Filtros na página de alertas: estado React local (`filter` state), array `filteredAlerts` derivado via `.filter()`
- TimeRange na página de analytics: estado `'7d' | '30d' | '90d'`, usado em `loadAnalytics()` via `useEffect`
- Alertas carregados em analytics: variável local `alerts` dentro de `loadAnalytics` — precisa ser exposta como estado para o export

### Integration Points
- **alerts/page.tsx**: adicionar estados `dateFrom` / `dateTo` / `dateApplied`, atualizar `filteredAlerts` para filtrar por data, ajustar botão CSV existente (já existe, só precisa incluir filtro de data)
- **analytics/page.tsx**: mover `alerts` de variável local para estado React (`const [rawAlerts, setRawAlerts] = useState<any[]>([])`), adicionar botão export ao lado dos Tabs

</code_context>

<specifics>
## Specific Ideas

- A página de alertas já tem o botão "Exportar CSV" implementado — a mudança é adicionar o filtro de data e garantir que o export use os filtros combinados
- A página de analytics precisa elevar `alerts` para estado para que o export possa acessá-los

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
