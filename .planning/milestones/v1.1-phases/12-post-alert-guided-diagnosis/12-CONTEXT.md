# Phase 12: Post-Alert Guided Diagnosis - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Exibir um card estático "O que fazer agora" com checklist de passos recomendados, diretamente inline abaixo de alertas com `severity = 'critical'` na página `/alerts`. O card aparece automaticamente (sem interação) para os 3 tipos cobertos: `downtime`, `stock_low`, `sales_drop`.

**O que NÃO é escopo desta fase:**
- Página de detalhe `/alerts/[id]` (nova rota)
- Drawer/modal ao clicar no alerta
- Itens de checklist configuráveis pelo usuário
- Checkboxes interativos com estado persistido
- Links externos dentro dos itens

</domain>

<decisions>
## Implementation Decisions

### Localização do card
- **D-01:** O card "O que fazer agora" aparece **inline expandido** diretamente abaixo do conteúdo do alerta crítico — sem accordion, sem botão de toggle, sem nova rota.
- **D-02:** Visível **somente para alertas com `severity = 'critical'`**. Alertas high, medium ou low não exibem o card.

### Visibilidade
- **D-03:** O card é **sempre visível** quando o alerta é critical — zero atrito, o usuário vê as recomendações sem precisar clicar em nada.

### Conteúdo dos checklists
- **D-04:** Os itens são **hard-coded por tipo de alerta** — lista fixa de passos descritivos por tipo. Sem banco de dados adicional, sem configuração pelo usuário.
- **D-05:** Cada item é **só texto** (sem links externos, sem checkboxes interativos, sem ações). Passos descritivos e acionáveis.
- **D-06:** Tipos cobertos e seus checklists (Claude define os itens exatos com base no domínio de e-commerce):
  - `downtime` → checklist "Loja offline"
  - `stock_low` → checklist "Estoque baixo / zerado" (único checklist para ambos os casos)
  - `sales_drop` → checklist "Queda nas vendas"

### Tipos de alerta
- **D-07:** "Estoque zerado" e "estoque baixo" compartilham o **mesmo tipo `stock_low`** no banco — um único checklist cobre ambos os cenários.

### Claude's Discretion
- Texto exato dos itens de cada checklist (5-7 itens por tipo, práticos e acionáveis)
- Estilo visual do card (cor, ícone, título — seguir design system `bg-{color}-500/10`)
- Comportamento quando o alerta não tem tipo mapeado (não exibir o card)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Página de alertas (arquivo a modificar)
- `src/app/alerts/page.tsx` — Lista de alertas, estrutura do card existente, `getAlertIcon`, `getSeverityColor`, filtros de `severity`

### Tipos de alerta no codebase
- `src/app/alert-rules/page.tsx` — `getRuleTypeLabel` e `getRuleIcon` definem os tipos: `stock_low`, `downtime`, `sales_drop`

### Design system (padrões a seguir)
- `src/components/ui/card.tsx` — Componente Card com CardHeader, CardContent, CardTitle
- `src/components/ui/badge.tsx` — Badge com variants (default, secondary, destructive)

### Banco de dados / Tipos
- `src/lib/database.types.ts` — Tipos do banco, estrutura da tabela `alerts`

</canonical_refs>

<specifics>
## Specific Ideas

- O card "O que fazer agora" deve ter visual discreto mas distinto — sugestão: borda colorida ou `bg-orange-500/5` com ícone de wrench/tool no título
- O card deve estar visualmente separado da mensagem do alerta (não misturado com o corpo) — pode ser um `<CardContent>` adicional com `border-t`
- Exemplo de itens para `downtime`:
  1. Verifique o status da loja diretamente no navegador
  2. Confirme se o problema é da plataforma (acesse o status page da plataforma)
  3. Cheque o DNS do domínio (ferramentas como MXToolbox ou DNS Checker)
  4. Contate o suporte da plataforma se o problema persistir por mais de 30 minutos
  5. Comunique sua equipe e clientes se a indisponibilidade ultrapassar 1h

</specifics>

<deferred>
## Deferred Ideas

- Checkboxes interativos com estado persistido (banco ou localStorage)
- Links externos para status pages das plataformas por tipo de alerta
- Checklist configurável pelo usuário por tipo de alerta
- Página de detalhe `/alerts/[id]` com histórico completo do incidente

</deferred>

---

*Phase: 12-post-alert-guided-diagnosis*
*Context gathered: 2026-04-14 via discuss-phase*
