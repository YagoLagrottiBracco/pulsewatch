# Phase 15: Team Activity Feed - Research

**Researched:** 2026-04-15
**Domain:** Supabase RLS + audit logging + Next.js client-side tabs
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- UI: Nova aba "Time" na pagina `/activity` existente ao lado da aba "Minha Atividade"
- Apenas owners veem a aba "Time" — managers e viewers so veem a propria atividade
- Feed unificado cronologico (nao filtrado por membro)
- 50 entradas mais recentes, sem paginacao
- Cada entrada mostra: email do membro (de `account_members.email`), acao, timestamp
- `ALERT_DISMISSED` — ja existe e ja e chamado
- `ALERT_DELETED` — ja existe e ja e chamado
- `ALERT_VIEWED` — NOVO: adicionar ao `AuditActions` e chamar em `markAsRead` na pagina de alertas
- "Nota adicionada" — NAO existe no sistema; ignorar nesta fase
- Nova migration Supabase: adicionar politica RLS para owner ler `audit_logs` de todos os seus membros
  - Politica: `account_owner_id` do `account_members` permite SELECT nos logs onde `user_id` e membro do time
  - Usar SECURITY DEFINER function ou policy com subquery em `account_members`
- Sem nova tabela — reutilizar `audit_logs` existente
- A query do feed: buscar `audit_logs` onde `user_id IN (SELECT user_id FROM account_members WHERE account_owner_id = auth.uid() AND status = 'active')` para acoes de alertas

### Claude's Discretion

- Nome do icone para "visualizou alerta" na UI (sugestao: `Eye` do lucide-react)
- Traducao da acao `alert.viewed` em portugues para o label do feed
- Exato texto do label da aba ("Time" vs "Atividade do Time" — preferir curto)
- Formato do timestamp no feed (relativo "ha 2h" vs absoluto)

### Deferred Ideas (OUT OF SCOPE)

- Filtro por membro no feed — adiado, complexidade nao justificada para v1.1
- "Nota adicionada" — nao existe funcionalidade de nota no sistema; fica para versao futura
- Feed em tempo real via Supabase Realtime — adiado (polling on-load suficiente para v1.1)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEAM-01 | Owner visualiza feed de atividade com acoes de cada membro (visualizou alerta, arquivou, adicionou nota) | Nova aba "Time" em `/activity`, query em `audit_logs` com RLS expandida; "adicionou nota" nao existe — escoped out |
| TEAM-02 | Acoes sao registradas automaticamente ao interagir com alertas | `logAudit` ja e chamado em `ALERT_DISMISSED` e `ALERT_DELETED`; `ALERT_VIEWED` sera adicionado em `markAsRead` |
| TEAM-03 | Feed exibe nome do membro, acao realizada e timestamp | Email de `account_members`, label de `getActionLabel`, timestamp relativo — todos via query client-side |
</phase_requirements>

---

## Summary

Phase 15 adiciona um feed cronologico de acoes de membros para account owners na pagina `/activity` existente. A implementacao tem tres partes independentes: (1) adicionar `ALERT_VIEWED` ao sistema de auditoria e chamar `logAudit` em `markAsRead`, (2) criar uma migration Supabase que expande a RLS de `audit_logs` para owners lerem logs dos seus membros, e (3) refatorar a pagina `/activity` adicionando Tabs com logica condicional de owner.

O stack ja tem todos os componentes necessarios: `audit_logs` table, `account_members` table, `logAudit()` helper, `AuditActions` enum, e Tabs component do shadcn/ui. Nenhuma dependencia nova precisa ser instalada. O principal trabalho e de plumbing: conectar partes que ja existem.

A unica parte tecnicamente nova e a politica RLS que permite um owner ler `audit_logs` de terceiros. Isso requer cuidado: a policy precisa de uma subquery em `account_members`, e como a tabela `audit_logs` tem RLS habilitada com `auth.uid()` como guard, a nova policy e aditiva — nao substitui as existentes.

**Primary recommendation:** Implementar em 3 tasks sequenciais — migration RLS primeiro, depois auditoria de `ALERT_VIEWED`, depois UI de Tabs.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase client-side SDK | ja instalado | Query `audit_logs` e `account_members` | Ja em uso em toda a aplicacao |
| shadcn/ui Tabs | ja instalado (`src/components/ui/tabs.tsx`) | Aba "Minha Atividade" / "Time" | Ja presente no codebase, exporta `TabsContent` |
| lucide-react | v0.294.0 (ja instalado) | Icone `Eye` para `ALERT_VIEWED` | Ja em uso em `activity/page.tsx` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/audit-logger` | local | `logAudit`, `AuditActions`, `EntityTypes` | Sempre que uma acao precisa ser registrada |
| `@/lib/supabase/client` | local | `createClient()` para client components | Componentes com `'use client'` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Policy RLS com subquery | SECURITY DEFINER function | Subquery e mais simples para SELECT-only; SECURITY DEFINER adiciona complexidade sem beneficio aqui |
| Relativo ("ha 2h") | Absoluto (toLocaleString) | Relativo e mais legivel para atividade recente; UI-SPEC ja decidiu por relativo |

**Installation:** Nenhuma instalacao necessaria — toda a stack ja existe no projeto.

---

## Architecture Patterns

### Pattern 1: Adicionar nova acao ao AuditActions

**What:** Adicionar constante ao objeto `AuditActions` em `src/lib/audit-logger.ts` e chamar `logAudit` no ponto de interacao.

**When to use:** Sempre que uma nova acao de usuario deve ser rastreada.

**Example:**
```typescript
// src/lib/audit-logger.ts
export const AuditActions = {
  // ... existentes ...
  ALERT_VIEWED: 'alert.viewed',   // NOVO
} as const
```

```typescript
// src/app/alerts/page.tsx — dentro de markAsRead()
const markAsRead = async (id: string) => {
  const supabase = createClient()
  const { error } = await supabase.from('alerts').update({ is_read: true }).eq('id', id)
  if (!error) {
    await logAudit({
      action: AuditActions.ALERT_VIEWED,
      entity_type: EntityTypes.ALERT,
      entity_id: id,
    })
    loadAlerts()
  }
}
```

### Pattern 2: RLS policy aditiva com subquery

**What:** Nova politica SELECT em `audit_logs` que permite owner ler logs dos seus membros ativos.

**When to use:** Quando um usuario precisa ler dados de outros usuarios, mas apenas dentro de um escopo de propriedade controlado.

**Example:**
```sql
-- Migration: nova policy aditiva (nao substitui as existentes)
CREATE POLICY "Owners can read team audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT user_id
      FROM account_members
      WHERE account_owner_id = auth.uid()
        AND status = 'active'
        AND user_id IS NOT NULL
    )
  );
```

**Cuidado critico:** A subquery deve incluir `AND user_id IS NOT NULL` porque `account_members.user_id` pode ser NULL para convites ainda pendentes (antes de aceitar). Sem esse filtro, um `user_id IS NULL` poderia retornar logs de usuarios nao-autenticados inesperadamente (nao ocorre na pratica mas e uma pratica defensiva).

### Pattern 3: Deteccao de owner em client component

**What:** Verificar se o usuario logado e owner de algum time consultando `account_members` diretamente.

**When to use:** Em qualquer client component que precise mostrar ou esconder UI especifica de owner.

**Example:**
```typescript
// Dentro de useEffect em activity/page.tsx
const { data: ownedMembers } = await supabase
  .from('account_members')
  .select('id')
  .eq('account_owner_id', user.id)
  .eq('status', 'active')
  .limit(1)

const isOwner = (ownedMembers?.length ?? 0) > 0
setIsOwner(isOwner)
```

**Por que funciona:** A RLS em `account_members` ja permite `FOR ALL USING (auth.uid() = account_owner_id)` — um owner pode consultar os proprios membros sem problema. Se retornar vazio, o usuario e um membro convidado, nao owner.

### Pattern 4: Query do feed do time

**What:** Buscar `audit_logs` de membros do time, com join em `account_members` para obter email.

**When to use:** Apenas para a aba "Time" na pagina de atividade, e apenas quando `isOwner === true`.

**Example:**
```typescript
// Query do feed do time
const { data: teamLogs } = await supabase
  .from('audit_logs')
  .select('id, user_id, action, entity_type, entity_id, metadata, created_at')
  .in('user_id', memberUserIds)   // array de user_ids ativos do time
  .like('action', 'alert.%')
  .order('created_at', { ascending: false })
  .limit(50)
```

**Estrategia de join:** O Supabase client nao suporta JOIN direto entre tabelas sem relacao FK declarada. A abordagem pratica e: (1) buscar membros ativos com `account_members` para obter array de `user_id` e o mapa `user_id -> email`, (2) usar `.in('user_id', memberUserIds)` na query de `audit_logs`. Isso resulta em 2 queries separadas mas e simples e legivel.

### Pattern 5: Tabs com conteudo condicional

**What:** Usar `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` do shadcn/ui. Renderizar a aba "Time" apenas para owners.

**When to use:** Pagina `/activity` refatorada.

**Example:**
```tsx
// Importar TabsContent (ainda nao usado em nenhuma page, mas exportado em tabs.tsx)
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// No JSX da pagina:
{isOwner ? (
  <Tabs defaultValue="my-activity">
    <TabsList>
      <TabsTrigger value="my-activity">Minha Atividade</TabsTrigger>
      <TabsTrigger value="team">Time</TabsTrigger>
    </TabsList>
    <TabsContent value="my-activity">
      {/* conteudo existente */}
    </TabsContent>
    <TabsContent value="team">
      {/* novo feed do time */}
    </TabsContent>
  </Tabs>
) : (
  /* conteudo existente sem wrapper de Tabs */
)}
```

### Recommended Project Structure

Nenhuma mudanca de estrutura de pastas. Todos os arquivos ja existem:
```
src/
├── lib/
│   └── audit-logger.ts         # adicionar ALERT_VIEWED
├── app/
│   ├── alerts/
│   │   └── page.tsx            # adicionar logAudit em markAsRead
│   └── activity/
│       └── page.tsx            # adicionar Tabs + logica de owner + team feed
supabase/
└── migrations/
    └── YYYYMMDD_team_activity_rls.sql   # nova migration
```

### Anti-Patterns to Avoid

- **Nao usar `.in()` com array vazio:** Se o owner nao tem membros ativos, `memberUserIds` sera `[]`. Chamar `.in('user_id', [])` com array vazio no Supabase pode retornar resultados inesperados em algumas versoes — checar se o array tem elementos antes de executar a query do feed.
- **Nao substituir as policies RLS existentes:** A nova policy e ADITIVA. Nao remover `"Users can read their own audit logs"` — ela protege os proprios logs do usuario.
- **Nao carregar o feed do time no page load:** O feed do time deve ser carregado apenas quando o owner clicar na aba "Time" (lazy load). Carregar no mount da pagina desperdicaria uma query para todos os usuarios nao-owners.
- **Nao exibir a aba "Time" antes de confirmar isOwner:** A verificacao de ownership e assincrona. Renderizar a aba antes da verificacao completar causaria flash de UI incorreto. Usar `isOwner === true` como guarda (nao `isOwner !== false`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Formatacao de timestamp relativo | Biblioteca de datas (date-fns, dayjs) | Helper inline simples | Casos simples (min/h/dias) nao precisam de dependencia externa; os outros projetos nao usam date-fns |
| Controle de tabs | Componente proprio de tabs | `Tabs` do shadcn/ui (ja instalado) | Ja presente no codebase, acessivel, testado |
| Insercao de audit log | `supabase.from('audit_logs').insert()` diretamente | `logAudit()` de `audit-logger.ts` | Encapsula `auth.getUser()`, trata erros silenciosamente — padrao estabelecido |

**Key insight:** O helper de timestamp relativo pode ser uma funcao pura de 10 linhas — nao justifica dependencia de biblioteca.

---

## Runtime State Inventory

> Esta fase nao e de rename/refactor. Sem migracao de dados existentes — apenas adicao de nova RLS policy e novo valor em `AuditActions`. Secao nao aplicavel.

---

## Environment Availability

> Fase e puramente code/config changes. Sem dependencias externas alem do Supabase ja em uso. Step 2.6: SKIPPED.

---

## Common Pitfalls

### Pitfall 1: `account_members.user_id` pode ser NULL
**What goes wrong:** Convites pendentes tem `user_id = NULL`. Se a query do feed usar `user_id IN (SELECT user_id FROM account_members WHERE ...)` sem filtrar NULLs, o `IN` com NULL se comporta de forma inesperada no SQL (NULL nao e igual a nada, mas pode causar confusion na query RLS).
**Why it happens:** `account_members.user_id` e nullable por design — so e preenchido quando o convite e aceito.
**How to avoid:** Sempre adicionar `AND user_id IS NOT NULL` na subquery de membros ativos, tanto na policy RLS quanto nas queries client-side.
**Warning signs:** Feed do time retorna zero resultados mesmo com membros que interagiram com alertas.

### Pitfall 2: `logAudit` em `markAsRead` pode criar logs duplicados
**What goes wrong:** `markAsRead` e chamada na pagina de alertas quando usuario clica "Marcar como lido". Se `markAsRead` for chamada multiplas vezes para o mesmo alerta (por bug de estado ou duplo clique), serao criados multiplos `audit_logs` com `action: 'alert.viewed'` para o mesmo `entity_id`.
**Why it happens:** Nao ha deduplicacao no `logAudit` — ele sempre insere.
**How to avoid:** Aceitar como comportamento esperado — o feed mostrara multiplas entradas, o que e aceitavel para um log de auditoria. Nao adicionar logica de deduplicacao (scope fora desta fase).
**Warning signs:** Feed do time mostra o mesmo alerta "visualizado" varias vezes pelo mesmo membro.

### Pitfall 3: RLS nova policy nao se aplica a registros existentes
**What goes wrong:** A migration adiciona a policy, mas logs de `ALERT_DISMISSED` e `ALERT_DELETED` ja existentes de membros nao aparecem no feed do owner imediatamente se a policy for criada errada.
**Why it happens:** Erros de sintaxe na subquery da policy ou filtro de `status` incorreto.
**How to avoid:** Testar a migration em staging com `SELECT * FROM audit_logs WHERE user_id IN (SELECT user_id FROM account_members WHERE account_owner_id = '<owner_uuid>' AND status = 'active' AND user_id IS NOT NULL)` antes de aplicar.
**Warning signs:** Feed do time vazio mesmo com membros que ja arquivaram alertas.

### Pitfall 4: `TabsContent` nao importado — erro silencioso de compilacao
**What goes wrong:** `TabsContent` e exportado de `src/components/ui/tabs.tsx` mas nenhuma page o usa ainda. Se esquecido no import, o JSX falha.
**Why it happens:** O desenvolvedor pode copiar o import de `analytics/page.tsx` que so importa `Tabs, TabsList, TabsTrigger` — sem `TabsContent`.
**How to avoid:** Import completo: `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'`
**Warning signs:** Erro de compilacao TypeScript: `TabsContent is not defined`.

### Pitfall 5: Query `.in()` com array vazio causa query mal-formada
**What goes wrong:** Se o owner nao tem membros ativos, `memberUserIds = []`. Executar `.in('user_id', [])` pode causar erro ou retornar todos os registros dependendo da versao do Supabase JS.
**Why it happens:** O SDK nao valida array vazio em `.in()` em todas as versoes.
**How to avoid:** Guard antes da query: `if (memberUserIds.length === 0) { setTeamLogs([]); return; }`.
**Warning signs:** Query retorna erro 400 ou resultado inesperado quando owner nao tem membros.

---

## Code Examples

### Migration RLS completa

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_team_activity_rls.sql

-- Permite que account owners leiam audit_logs dos seus membros ativos
CREATE POLICY "Owners can read team audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT user_id
      FROM account_members
      WHERE account_owner_id = auth.uid()
        AND status = 'active'
        AND user_id IS NOT NULL
    )
  );

-- Index auxiliar para performance da subquery (se nao existir)
CREATE INDEX IF NOT EXISTS idx_account_members_owner_status
  ON account_members(account_owner_id, status)
  WHERE user_id IS NOT NULL;
```

### Helper de timestamp relativo

```typescript
function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days} dias`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}
```

### Logica de carregamento do feed do time

```typescript
const loadTeamFeed = async (userId: string, supabase: any) => {
  // 1. Buscar membros ativos e seus emails
  const { data: members } = await supabase
    .from('account_members')
    .select('user_id, email')
    .eq('account_owner_id', userId)
    .eq('status', 'active')
    .not('user_id', 'is', null)

  if (!members || members.length === 0) {
    setTeamLogs([])
    return
  }

  // 2. Mapa user_id -> email para lookup rapido
  const emailMap: Record<string, string> = {}
  const userIds: string[] = []
  members.forEach((m: any) => {
    emailMap[m.user_id] = m.email
    userIds.push(m.user_id)
  })

  // 3. Buscar logs de acoes de alertas dos membros
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, user_id, action, entity_type, entity_id, metadata, created_at')
    .in('user_id', userIds)
    .like('action', 'alert.%')
    .order('created_at', { ascending: false })
    .limit(50)

  // 4. Enriquecer logs com email do membro
  const enriched = (logs || []).map((log: any) => ({
    ...log,
    memberEmail: emailMap[log.user_id] || log.user_id,
  }))

  setTeamLogs(enriched)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `audit_logs` visivel apenas pelo proprio usuario | Owner tambem pode ver logs dos seus membros via nova RLS policy | Phase 15 | Ativa o feed de time |
| `markAsRead` atualiza apenas `is_read` sem auditoria | `markAsRead` registra `ALERT_VIEWED` em `audit_logs` | Phase 15 | Enriquece o feed com "visualizou alerta" |
| `/activity` sem tabs (pagina unica de logs) | `/activity` com tabs "Minha Atividade" / "Time" (owner only) | Phase 15 | Interface multi-perspectiva |

**Deprecated/outdated:**
- Nenhum padrao existente e depreciado nesta fase — todas as mudancas sao aditivas.

---

## Open Questions

1. **Visibilidade do proprio owner no feed do time**
   - What we know: O owner pode ter `audit_logs` proprios (`user_id = owner.id`). Esses logs NAO aparecerao no feed do time porque a query filtra por `user_id IN (membros ativos)` — o owner nao e membro de si mesmo.
   - What's unclear: O CONTEXT.md diz "o owner deve ver o proprio email identificado (ou 'Voce') se a acao vier do proprio owner logado" — mas isso so se aplica se o owner aparecer no feed.
   - Recommendation: Confirmar com o CONTEXT.md. Se o owner tambem deve aparecer no feed do time com suas proprias acoes de alerta, a query deve incluir `OR user_id = currentUser.id`. Caso contrario, ignorar — o owner ve as proprias acoes na aba "Minha Atividade". A leitura mais simples do CONTEXT.md sugere que "Voce" e apenas para identificacao visual quando o owner aparece — mas so aparecera se for membro de si mesmo (nao e o caso). **Decisao sugerida para o planner:** Nao incluir as acoes do proprio owner no feed do time — ele tem a aba "Minha Atividade" para isso.

2. **Nome do arquivo da migration**
   - What we know: Migrations usam timestamp como prefixo (e.g., `20260331000000_add_teams_multi_user.sql`).
   - What's unclear: Qual timestamp usar para esta nova migration? O dia de hoje e 2026-04-15.
   - Recommendation: Usar `20260415000000_add_team_activity_rls.sql`. Verificar que nao conflita com migrations existentes (a mais recente e `20260411000000_create_user_feedback.sql`).

---

## Validation Architecture

> `workflow.nyquist_validation` nao encontrado em `.planning/config.json` — tratado como habilitado.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Nenhum framework de teste detectado no projeto |
| Config file | Nenhum (jest.config.*, vitest.config.*, pytest.ini — nao encontrado) |
| Quick run command | n/a |
| Full suite command | n/a |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEAM-01 | Owner ve feed com acoes de membros | manual-only | n/a | n/a |
| TEAM-02 | Acoes registradas automaticamente | manual-only | n/a | n/a |
| TEAM-03 | Feed exibe email, acao, timestamp | manual-only | n/a | n/a |

**Justificativa manual-only:** O projeto nao tem infraestrutura de testes automatizados. Testes das features dependem de Supabase RLS que requer ambiente real. Validacao manual via browser com usuario owner e usuario membro e o padrao do projeto.

### Sampling Rate
- **Per task commit:** Build TypeScript sem erros (`npm run build`)
- **Per wave merge:** Verificacao manual no browser
- **Phase gate:** Todos os criterios de sucesso do CONTEXT.md verificados manualmente antes de `/gsd:verify-work`

### Wave 0 Gaps
- Nenhum framework de teste a instalar — "None — existing test infrastructure covers all phase requirements" nao se aplica pois nao ha infraestrutura; validacao e manual.

---

## Sources

### Primary (HIGH confidence)
- Codebase scan direta — `src/lib/audit-logger.ts`, `src/app/activity/page.tsx`, `src/app/alerts/page.tsx`, `src/app/team/page.tsx`, `src/components/ui/tabs.tsx`
- `supabase/migrations/20250117000000_add_audit_logs.sql` — schema e RLS de `audit_logs`
- `supabase/migrations/20260331000000_add_teams_multi_user.sql` — schema e RLS de `account_members`
- `.planning/phases/15-team-activity-feed/15-CONTEXT.md` — decisoes do usuario
- `.planning/phases/15-team-activity-feed/15-UI-SPEC.md` — contrato visual

### Secondary (MEDIUM confidence)
- Padrao de RLS com subquery inferido do padrao existente em `20250117000000_add_audit_logs.sql` e documentacao Supabase RLS (padrao `EXISTS` / `IN` subquery e amplamente documentado)

### Tertiary (LOW confidence)
- Comportamento de `.in()` com array vazio no Supabase JS — nao verificado contra versao exata instalada; abordagem defensiva de guard recomendada por precaucao.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tudo verificado no codebase
- Architecture: HIGH — patterns inferidos diretamente do codigo existente
- RLS policy: HIGH — padrao verificado nas migrations existentes do projeto
- Pitfalls: MEDIUM — derivados de experiencia com Supabase RLS e NULL handling
- Comportamento .in([]) vazio: LOW — nao verificado contra versao exata

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stack estavel, sem dependencias externas novas)
