# Project Retrospective

*Documento vivo atualizado após cada milestone. Lições alimentam o planejamento futuro.*

---

## Milestone: v1.1 — Insights IA + Melhorias de Produto

**Shipped:** 2026-04-16
**Phases:** 5 | **Plans:** 7 | **Commits neste milestone:** ~30

### What Was Built

- **AI Insights automático** — geração semanal para business+ via cron externo (cron-job.org), com deduplicação de 6 dias e badge visual "Geração automática" no histórico
- **Diagnóstico guiado pós-alerta** — card "O que fazer agora" com checklists hardcoded por tipo de alerta (loja offline, estoque zerado, estoque baixo, queda de vendas)
- **Calculadora de perdas na landing page** — componente Client-side com cálculo de perda por hora de downtime e impacto de queda de 20%, visualmente consistente com o design system
- **Exportação CSV client-side** — alertas com filtro de período + dados de analytics, gerado inteiramente no browser sem endpoint
- **Feed de atividade de time** — owner vê ações de membros (ALERT_VIEWED, archived, noted) com email, label e timestamp; lazy-loaded; RLS aditiva no Supabase

### What Worked

- **GSD workflow** — discuss → plan → execute funcionou bem para fases de tamanho médio; contexto acumulado no STATE.md evitou retrabalho
- **Hardcode intencional** — checklists de diagnóstico hardcoded em vez de tabela no banco: decisão correta para o momento, sem overhead desnecessário
- **Client-side CSV** — evitar endpoint de geração simplificou implementação e eliminou dependência de infra
- **Tri-state isOwner (null/true/false)** — padrão elegante para evitar flash de UI antes do fetch resolver
- **Lazy-load do team feed** — carregar apenas no clique da aba evita fetch desnecessário no mount

### What Was Inefficient

- **Audit de milestone não foi feito** — milestone concluído sem `/gsd:audit-milestone`; próximo milestone deve incluir audit antes do complete
- **SUMMARY one-liners incompletos** — fases 13 e 14 não tinham `one_liner` populado no frontmatter; afetou extração automática de accomplishments

### Patterns Established

- `renderGenerationLabel` retorna `React.ReactNode` (não string) para suportar JSX badges dentro de Radix SelectItem
- RLS aditiva com subquery em `account_members` (não SECURITY DEFINER) — padrão para futuras políticas de time
- `logAudit` chamado imediatamente após operações de alerta — padrão de auditoria sem step extra do usuário
- Componentes calculadores na landing page como Client Components separados para não converter a página inteira

### Key Lessons

- **Audit antes de complete** — mesmo com todos os requirements marcados, o audit valida integração entre fases (ex: fluxos E2E cross-phase). Fazer em v1.2.
- **Preencher `one_liner` no SUMMARY** — o campo é usado na extração automática de accomplishments no `milestone complete`. Garantir que o executor preencha.
- **Cron jobs sempre externos** — nenhuma tentação de usar node-cron no código; cron-job.org funciona bem para a escala atual.

### Cost Observations

- Milestone executado com Claude Sonnet 4.6 (via GSD autonomous)
- 5 fases, 7 plans, entrega em ~2 dias de sessões
- Sem retrabalho significativo — planejamento GSD evitou loops de debug

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Days | Rework |
|-----------|--------|-------|------|--------|
| v1.0 MVP | 10 | ~20 | ~115 | baixo |
| v1.1 | 5 | 7 | ~2 | mínimo |

**Tendências:**
- Fases menores e mais focadas → execução mais rápida e menos ambiguidade
- GSD context acumulado no STATE.md → decisões de implementação mais consistentes entre fases
- Cron jobs externos → zero issues de infra em ambos os milestones
