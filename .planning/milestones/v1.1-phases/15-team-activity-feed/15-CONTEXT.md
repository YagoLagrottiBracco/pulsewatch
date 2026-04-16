# Phase 15: Team Activity Feed - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Owners veem um feed cronológico de ações de membros do time na página `/activity` existente (nova aba "Time"). O feed mostra quem fez o quê e quando, limitado a ações de alertas. O tracking de "visualizou alerta" é adicionado via nova auditoria. A funcionalidade de "nota" não existe no sistema — ignorada nesta fase.

</domain>

<decisions>
## Implementation Decisions

### UI — Onde exibir
- Nova aba "Time" na página `/activity` existente ao lado da aba "Minha Atividade"
- Apenas owners veem a aba "Time" — managers e viewers só veem a própria atividade
- Feed unificado cronológico (não filtrado por membro)
- 50 entradas mais recentes, sem paginação
- Cada entrada mostra: email do membro (de `account_members.email`), ação, timestamp

### Ações rastreadas no feed do time
- `ALERT_DISMISSED` — já existe e já é chamado (alerta arquivado/dispensado)
- `ALERT_DELETED` — já existe e já é chamado (alerta deletado)
- `ALERT_VIEWED` — NOVO: adicionar ao `AuditActions` e chamar em `markAsRead` na página de alertas
- "Nota adicionada" — NÃO existe no sistema; ignorar nesta fase

### Schema e RLS
- Nova migration Supabase: adicionar política RLS para owner ler `audit_logs` de todos os seus membros
  - Política: `account_owner_id` do `account_members` permite SELECT nos logs onde `user_id` é membro do time
  - Usar SECURITY DEFINER function ou policy com subquery em `account_members`
- Sem nova tabela — reutilizar `audit_logs` existente
- A query do feed: buscar `audit_logs` onde `user_id IN (SELECT user_id FROM account_members WHERE account_owner_id = auth.uid() AND status = 'active')` para ações de alertas

### Claude's Discretion
- Nome do ícone para "visualizou alerta" na UI (sugestão: `Eye` do lucide-react)
- Tradução da ação `alert.viewed` em português para o label do feed
- Exato texto do label da aba ("Time" vs "Atividade do Time" — preferir curto)
- Formato do timestamp no feed (relativo "há 2h" vs absoluto)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/activity/page.tsx` — página de atividade existente, já lê `audit_logs`, já tem `getActionIcon` e `getActionLabel`
- `src/lib/audit-logger.ts` — `logAudit()`, `AuditActions`, `EntityTypes` — basta adicionar `ALERT_VIEWED`
- `src/app/alerts/page.tsx` — `markAsRead()` função existente — adicionar `logAudit` ali
- `supabase/migrations/20250117000000_add_audit_logs.sql` — schema e RLS de referência
- `supabase/migrations/20260331000000_add_teams_multi_user.sql` — schema `account_members` de referência

### Established Patterns
- Audit logging: `await logAudit({ action: AuditActions.X, entity_type: EntityTypes.Y, entity_id: id })`
- RLS policies: ver padrão em `20250117000000_add_audit_logs.sql` — usar SECURITY DEFINER ou subquery
- Tabs na UI: ver `/analytics` page — usa `<Tabs>`, `<TabsList>`, `<TabsTrigger>` do shadcn/ui
- RLS query pattern: `account_members WHERE account_owner_id = auth.uid() AND status = 'active'`

### Integration Points
- **`audit-logger.ts`**: adicionar `ALERT_VIEWED: 'alert.viewed'` em `AuditActions`
- **`alerts/page.tsx`**: na função `markAsRead()`, após update do Supabase, chamar `logAudit`
- **`activity/page.tsx`**: adicionar Tabs (Minha Atividade / Time), lógica condicional por role, nova query para feed do time
- **`supabase/migrations/`**: nova migration com RLS policy para owner acessar logs de membros

</code_context>

<specifics>
## Specific Ideas

- A página `/activity` já tem o ícone `User` importado — útil para identificar entradas de membros no feed
- A query do feed do time deve filtrar apenas ações de alertas: `action LIKE 'alert.%'`
- O owner deve ver o próprio email identificado (ou "Você") se a ação vier do próprio owner logado

</specifics>

<deferred>
## Deferred Ideas

- Filtro por membro no feed — adiado, complexidade não justificada para v1.1
- "Nota adicionada" — não existe funcionalidade de nota no sistema; fica para versão futura
- Feed em tempo real via Supabase Realtime — adiado (polling on-load suficiente para v1.1)

</deferred>
