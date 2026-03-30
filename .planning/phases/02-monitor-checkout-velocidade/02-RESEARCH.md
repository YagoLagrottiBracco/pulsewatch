# Phase 2: Monitor de Checkout e Velocidade - Research

**Researched:** 2026-03-30
**Domain:** Next.js cron job extension, Supabase schema migration, shadcn/ui
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Arquitetura:** Integrar os monitores avançados DENTRO do cron job existente (`check-status/route.ts`), como etapa adicional após o ping básico. Após `checkStoreStatus()` confirmar online, executar `checkAdvancedMonitors()` com gate-check pro+.

2. **Monitor de Velocidade (LOJA_LENTA):** `performance.now()` antes/depois do fetch. Threshold padrão 3s (range 1-10s, configurável por loja). Novos campos: `speed_threshold_ms INTEGER DEFAULT 3000`, `last_response_time_ms INTEGER`.

3. **Monitor de Erros (ERRO_PAGINA):** Verificar `statusCode >= 400` na home. Severidade: `high` para 5xx, `medium` para 4xx. Separado de `LOJA_OFFLINE`.

4. **Monitor de Checkout (CHECKOUT_OFFLINE):** GET na URL de cart/checkout por plataforma. Timeout 8s. Executar apenas quando loja online. Gate: pro+. URLs: Shopify `/cart`, WooCommerce `/carrinho` e `/cart`, Nuvemshop `/checkout`, genérico `/cart`.

5. **Gate de Acesso:** `ADVANCED_MONITORING_TIERS = ['pro', 'business', 'agency']`

6. **Frequência checkout:** 1x/hora por loja via campo `last_checkout_check TIMESTAMPTZ`.

7. **Deduplicação de alertas:** Skip se alerta do mesmo tipo para mesma loja foi criado há < 30 min.

8. **Novos campos `stores`:**
   ```sql
   ALTER TABLE stores ADD COLUMN IF NOT EXISTS speed_threshold_ms INTEGER DEFAULT 3000;
   ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_response_time_ms INTEGER;
   ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_checkout_check TIMESTAMPTZ;
   ALTER TABLE stores ADD COLUMN IF NOT EXISTS checkout_status TEXT DEFAULT 'unknown'
     CHECK (checkout_status IN ('ok', 'error', 'unknown'));
   ```

9. **UI:** Seção "Monitores Avançados" dentro da página/configuração individual da loja. Toggle de checkout + slider/input de threshold (gate: pro+). Padrão visual: Card, Badge, Switch, Input do shadcn/ui.

10. **Novos tipos de alerta:**
    - `LOJA_LENTA` — response time > threshold
    - `CHECKOUT_OFFLINE` — checkout retornou erro
    - `ERRO_PAGINA` — loja retornou 4xx/5xx na home

11. **Severidades:** CHECKOUT_OFFLINE → `critical`, LOJA_LENTA → `medium`, ERRO_PAGINA(5xx) → `high`, ERRO_PAGINA(4xx) → `medium`

12. **Mensagens (em português):**
    - `CHECKOUT_OFFLINE`: "O checkout da loja {name} está com problemas! URL de checkout retornou erro {statusCode}."
    - `LOJA_LENTA`: "A loja {name} está respondendo lentamente ({responseTime}ms, threshold: {threshold}ms)."
    - `ERRO_PAGINA`: "A loja {name} está retornando erro {statusCode} na página principal."

### Claude's Discretion

Nenhuma área explicitamente delegada ao Claude.

### Deferred Ideas (OUT OF SCOPE)

- Histórico de response time (gráfico de latência ao longo do tempo) → Fase 4
- Monitor de página de produto específico (URL custom) → Fase 7
- Janelas de manutenção → Fase 7
- Dashboard de uptime/SLA % → Fase 4
</user_constraints>

---

## Summary

Phase 2 adiciona três monitores ao cron job já existente: velocidade de resposta, erros HTTP (4xx/5xx) e disponibilidade do checkout. O cron job em `src/app/api/cron/check-status/route.ts` já itera sobre todas as lojas ativas, verifica o tier do usuário e chama `checkStoreStatus()`. A integração dos novos monitores é um append natural nesse fluxo: após confirmar que a loja está online e o tier é pro+, executar os checks avançados.

O schema das tabelas está bem definido e as migrações seguem um padrão claro. A tabela `stores` já tem `offline_since` e `revenue_per_hour` como exemplos de colunas adicionadas em fases anteriores, e o padrão de migração com `ADD COLUMN IF NOT EXISTS` está estabelecido. A tabela `alerts` já suporta os campos necessários (`type`, `severity`, `metadata`).

Para a UI, não existe página de detalhe individual por loja (`/stores/[id]`). Toda a gestão de lojas está em `/stores/page.tsx` com modais inline. A seção de "Monitores Avançados" deve ser adicionada dentro desse mesmo arquivo como nova seção no modal/card de edição de cada loja.

**Primary recommendation:** Implementar em 3 ondas: (1) migração do schema, (2) lógica do cron (os três monitores + deduplicação), (3) UI de configuração por loja.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14+ (projeto existente) | App Router, API Routes, cron | Base do projeto |
| Supabase JS | 2.x (projeto existente) | DB queries, service role client | Já em uso em todo o cron |
| `fetch` nativo | Node 18+ | HTTP requests com AbortSignal | Já usado em `checkStoreStatus` |
| `performance.now()` | Node 18+ | Medição de latência de alta precisão | Nativo, sem dependência extra |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Switch | existente | Toggle de checkbox acessível | UI do toggle "Monitor de Checkout" |
| shadcn/ui Card/Badge/Input | existente | Layout e campos de formulário | UI da seção monitores avançados |
| Lucide React | existente | Ícones (Zap, ShoppingCart, AlertTriangle) | Ícones da nova seção UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `performance.now()` | `Date.now()` before/after | `performance.now()` tem resolução sub-milissegundo; `Date.now()` é suficiente aqui mas menos preciso |
| GET no checkout | Playwright/Puppeteer | Headless browser detectaria JS-heavy checkouts, mas adiciona complexidade/custo de execução no cron |

**Installation:** Nenhuma dependência nova necessária — tudo está disponível no stack atual.

---

## Architecture Patterns

### Recommended Project Structure

Nenhum novo arquivo de pasta — extensão de arquivos existentes:

```
src/
├── app/api/cron/check-status/
│   └── route.ts                    # Adicionar checkAdvancedMonitors() aqui
├── app/stores/
│   └── page.tsx                    # Adicionar seção "Monitores Avançados" no card/modal de edição
└── supabase/migrations/
    └── 20260330200000_add_advanced_monitoring.sql   # Nova migração
```

### Pattern 1: Cron Job Append — checkAdvancedMonitors()

**What:** Após o bloco `if (isOnline)` existente no loop de lojas, chamar uma nova função assíncrona `checkAdvancedMonitors()` que recebe `supabase`, `store`, `userTier`, e `results` como params.

**When to use:** Sempre que a loja estiver online e o tier for pro+.

**Fluxo observado no código existente (linhas 84-175 do route.ts):**
```typescript
// Exemplo de integração — local exato de inserção
const checkResult = await checkStoreStatus(store.domain)
const isOnline = checkResult.isOnline

// ... bloco de status update existente ...

// NOVO: checks avançados — inserir APÓS o bloco de status update
if (isOnline && ADVANCED_MONITORING_TIERS.includes(userTier)) {
  const advancedResults = await checkAdvancedMonitors(supabase, store, checkResult)
  notificationResults.push(...advancedResults)
}
```

### Pattern 2: Medição de Velocidade com AbortSignal

**What:** Reutilizar a URL normalizada que `checkStoreStatus()` já retorna em `checkResult.normalizedUrl`. Não fazer uma segunda request separada — capturar o tempo do GET existente.

**Problema crítico encontrado:** `checkStoreStatus()` tenta HEAD primeiro, e se HEAD funcionar, retorna sem fazer GET. Não há como capturar o `responseTime` do HEAD no retorno atual da função. Existem duas abordagens:

**Opção A (recomendada):** Modificar `checkStoreStatus()` para retornar `responseTimeMs` junto com `isOnline`, `statusCode`, `method`, `error`. A medição acontece dentro da função e é propagada para o cron. Isso mantém o código DRY — a loja já estava fazendo o fetch, só precisa cronometrar.

**Opção B:** Fazer um segundo fetch apenas para medir velocidade em `checkAdvancedMonitors()`. Mais simples de isolar, mas duplica requests.

A Opção A é preferível para performance e custo de requests. Exemplo:

```typescript
// Dentro de checkStoreStatus — modificação mínima
const t0 = performance.now()
const headResponse = await fetch(normalizedUrl, {
  method: 'HEAD',
  redirect: 'follow',
  signal: AbortSignal.timeout(10000),
})
const responseTimeMs = Math.round(performance.now() - t0)
if (headResponse.ok) {
  return { isOnline: true, normalizedUrl, statusCode: headResponse.status, method: 'HEAD', responseTimeMs }
}
```

### Pattern 3: Deduplicação de Alertas

**What:** Query na tabela `alerts` antes de criar alerta para verificar se já existe um alerta recente do mesmo tipo para a mesma loja.

**Padrão estabelecido no projeto:** A função `createAlertWithNotification()` em `route.ts` (linha 373) não faz deduplicação — ela cria sempre. A deduplicação deve ser adicionada como wrapper ou checagem pré-insert.

```typescript
// Verificar duplicação antes de criar alerta
async function shouldCreateAlert(
  supabase: any,
  storeId: string,
  alertType: string,
  dedupeWindowMinutes = 30
): Promise<boolean> {
  const cutoff = new Date(Date.now() - dedupeWindowMinutes * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('alerts')
    .select('id')
    .eq('store_id', storeId)
    .eq('type', alertType)
    .gte('created_at', cutoff)
    .limit(1)
  return !data || data.length === 0
}
```

### Pattern 4: Checkout Check por Plataforma

**What:** Função `getCheckoutUrl(platform, domain)` que retorna a URL de checkout correta.

```typescript
function getCheckoutUrl(platform: string, domain: string): string {
  const base = `https://${domain}`
  switch (platform) {
    case 'shopify':    return `${base}/cart`
    case 'woocommerce': return `${base}/carrinho`  // fallback para /cart se retornar 404
    case 'nuvemshop':  return `${base}/checkout`
    case 'tray':       return `${base}/checkout`
    case 'vtex':       return `${base}/checkout`
    default:           return `${base}/cart`
  }
}
```

**Observação:** WooCommerce em português usa `/carrinho`. A decisão na CONTEXT.md menciona tentar `/carrinho` E `/cart`. Implementar tentativa sequencial: se `/carrinho` retornar 404, tentar `/cart`.

### Pattern 5: Throttle do Checkout Check (1x/hora)

**What:** Verificar `store.last_checkout_check` antes de executar o check de checkout.

```typescript
const shouldCheckCheckout = !store.last_checkout_check ||
  (Date.now() - new Date(store.last_checkout_check).getTime()) > 60 * 60 * 1000

if (shouldCheckCheckout) {
  // executar checkout check e atualizar last_checkout_check
  await supabase.from('stores').update({
    last_checkout_check: new Date().toISOString(),
    checkout_status: checkoutOk ? 'ok' : 'error',
  }).eq('id', store.id)
}
```

### Anti-Patterns to Avoid

- **Não fazer fetch separado para velocidade:** Reutilizar o timing do fetch que já existe em `checkStoreStatus()`, evitando duplicar requests para cada loja a cada 5 min.
- **Não criar alerta ERRO_PAGINA quando loja está offline:** `LOJA_OFFLINE` já cobre esse caso. `ERRO_PAGINA` só faz sentido quando a loja responde mas retorna status de erro. O fluxo atual já trata offline antes de chegar nos checks avançados.
- **Não seguir AbortSignal.timeout() para checkout:** O cron tem timeout global do Vercel (10s para free, 60s para pro). Manter timeout de 8s no checkout check conforme decidido.
- **Não bloquear o loop principal:** Todos os checks avançados devem ter try/catch independentes. Um checkout com timeout não deve impedir a verificação das outras lojas.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle UI | Custom checkbox HTML | `Switch` do shadcn/ui (já existe em `/components/ui/switch.tsx`) | Acessível, já estilizado, Radix UI por baixo |
| Timeout de HTTP | setTimeout + Promise.race | `AbortSignal.timeout(ms)` nativo | Já em uso em `checkStoreStatus`, Node 18+ nativo |
| Severidade de emoji no email | Lógica custom | Extender o `severityEmoji` já existente em `notification.ts` | Mantém consistência com alertas existentes |

**Key insight:** O maior risco de reinvenção é duplicar o padrão de `createAlertWithNotification()`. A nova lógica deve usar essa função existente como base, apenas adicionando o passo de deduplicação antes de chamá-la.

---

## Runtime State Inventory

> Fase de extensão funcional (não rename/refactor). Sem renomeação de entidades existentes.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Tabela `stores` — 4 colunas novas. Tabela `alerts` — novos tipos de `type` (sem constraint CHECK existente no type, campo é TEXT livre) | Migration SQL |
| Live service config | Vercel Cron — nenhum novo cron necessário. O cron existente em `/api/cron/check-status` já roda a cada 10 min e cobre todos os checks | Nenhuma — reutilizar cron existente |
| OS-registered state | Nenhum | None |
| Secrets/env vars | Nenhuma nova env var necessária — `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` já disponíveis | None |
| Build artifacts | Nenhum | None |

**Observação importante sobre `vercel.json`:** O arquivo atual `vercel.json` **não contém configuração de cron**. Apenas `buildCommand`, `devCommand`, `installCommand`, `framework`, `regions`. Isso significa que o cron job está sendo executado via outro mecanismo (possivelmente Vercel Cron configurado na UI do dashboard da Vercel ou via `vercel.json` em outra versão). O plano deve verificar como o cron está configurado na Vercel — não é necessário adicionar nada no `vercel.json` para esta fase, mas é um risco de ambiente que deve ser auditado.

---

## Common Pitfalls

### Pitfall 1: Medir response time incluindo DNS lookup
**What goes wrong:** `performance.now()` captura o tempo total incluindo DNS lookup, TCP handshake e TLS handshake. Em ambientes serverless (Vercel), conexões TCP não são reutilizadas entre invocações do cron, então o "primeiro" check de uma loja pode ser 2-5x mais lento que checks subsequentes.
**Why it happens:** Serverless é stateless — sem connection pooling HTTP.
**How to avoid:** Usar threshold generoso (3s padrão é razoável). Não disparar `LOJA_LENTA` no primeiro check após deploy/cold start. Considerar armazenar rolling average nos metadados do alerta em vez de usar medição pontual.
**Warning signs:** Cluster de alertas `LOJA_LENTA` imediatamente após deploy.

### Pitfall 2: WooCommerce `/carrinho` vs `/cart`
**What goes wrong:** Lojas WooCommerce em inglês usam `/cart`. A decisão menciona tentar ambos, mas implementar sem fallback silencioso causaria falsos positivos de `CHECKOUT_OFFLINE` para lojas WooCommerce em inglês.
**Why it happens:** O tema WordPress/WooCommerce determina a URL de carrinho.
**How to avoid:** Tentar `/carrinho` primeiro; se retornar 404, tentar `/cart`. Considerar que a URL real pode variar — armazenar resultado da primeira URL que funciona em `checkout_status`.
**Warning signs:** Alertas `CHECKOUT_OFFLINE` em lojas WooCommerce que estão funcionando normalmente.

### Pitfall 3: Alerta ERRO_PAGINA quando `checkStoreStatus` retorna 4xx/5xx
**What goes wrong:** `checkStoreStatus()` atual define `isOnline = getResponse.ok && getResponse.status < 400` (linha 1173). Se o site retorna 403 (ex: Cloudflare bloqueando o User-Agent `PulseWatch-Monitor/1.0`), a loja é marcada como offline, mas na realidade pode estar online para usuários reais.
**Why it happens:** Firewalls/CDNs bloqueiam User-Agents desconhecidos.
**How to avoid:** O User-Agent atual (`PulseWatch-Monitor/1.0`) pode ser bloqueado. Considerar usar um User-Agent de browser legítimo como fallback. Para `ERRO_PAGINA`, verificar se `statusCode` está no range 400-599 E a loja estava online antes (store.status === 'online').
**Warning signs:** Alertas `LOJA_OFFLINE` ou `ERRO_PAGINA` para lojas de grande porte (ex: Shopify, Mercado Livre) que sempre estão online.

### Pitfall 4: Race condition no update de `last_checkout_check`
**What goes wrong:** Se o cron for executado com mais de uma instância paralela (Vercel pode fazer isso), dois workers podem passar pela checagem `shouldCheckCheckout` simultaneamente antes de qualquer um atualizar o campo.
**Why it happens:** O cron job não tem lock de exclusão mútua.
**How to avoid:** Para esta fase, o risco é baixo (cron roda a cada 10 min, checkout é 1x/hora). Aceitar a duplicação ocasional — a deduplicação de alertas (30 min) é a proteção real. O campo `last_checkout_check` é best-effort.

### Pitfall 5: Timeout do cron excedido com muitas lojas
**What goes wrong:** O cron já executa verificações sequenciais por loja. Com checks avançados adicionais (velocidade + checkout), o tempo total por loja aumenta de ~500ms para ~9s no pior caso (checkout timeout 8s + velocidade 10s HEAD timeout). Com 20 lojas pro+ isso seria 180s, excedendo limites do Vercel.
**Why it happens:** Loop sequencial sem paralelização.
**How to avoid:** Os checks avançados devem usar `Promise.allSettled` para paralelizar velocidade e checkout por loja. O checkout check já tem throttle de 1x/hora, então na maioria das execuções será pulado. O timeout de 8s do checkout garante que o pior caso seja limitado.

---

## Code Examples

### Estrutura da função checkAdvancedMonitors

```typescript
// Fonte: padrão observado no route.ts existente
const ADVANCED_MONITORING_TIERS = ['pro', 'business', 'agency']

async function checkAdvancedMonitors(
  supabase: ReturnType<typeof createClient>,
  store: any,
  checkResult: CheckResult & { responseTimeMs?: number }
): Promise<Array<{ alertType: string; alertCreated: boolean; notifications: any }>> {
  const alerts: Array<{ alertType: string; alertCreated: boolean; notifications: any }> = []

  // 1. Monitor de velocidade
  if (checkResult.responseTimeMs !== undefined && store.speed_threshold_ms) {
    if (checkResult.responseTimeMs > store.speed_threshold_ms) {
      const canCreate = await shouldCreateAlert(supabase, store.id, 'LOJA_LENTA')
      if (canCreate) {
        const result = await createAlertWithNotification(supabase, store, {
          type: 'LOJA_LENTA',
          severity: 'medium',
          title: 'Loja Lenta',
          message: `A loja ${store.name} está respondendo lentamente (${checkResult.responseTimeMs}ms, threshold: ${store.speed_threshold_ms}ms).`,
          metadata: { responseTimeMs: checkResult.responseTimeMs, thresholdMs: store.speed_threshold_ms },
        })
        alerts.push({ alertType: 'LOJA_LENTA', ...result })
      }
    }
    // Persistir último response time independentemente de alerta
    await supabase.from('stores').update({ last_response_time_ms: checkResult.responseTimeMs }).eq('id', store.id)
  }

  // 2. Monitor de erros HTTP
  if (checkResult.statusCode && checkResult.statusCode >= 400) {
    const severity = checkResult.statusCode >= 500 ? 'high' : 'medium'
    const canCreate = await shouldCreateAlert(supabase, store.id, 'ERRO_PAGINA')
    if (canCreate) {
      const result = await createAlertWithNotification(supabase, store, {
        type: 'ERRO_PAGINA',
        severity,
        title: 'Erro na Página Principal',
        message: `A loja ${store.name} está retornando erro ${checkResult.statusCode} na página principal.`,
        metadata: { statusCode: checkResult.statusCode },
      })
      alerts.push({ alertType: 'ERRO_PAGINA', ...result })
    }
  }

  // 3. Monitor de checkout (throttle 1x/hora)
  const shouldCheckCheckout = !store.last_checkout_check ||
    (Date.now() - new Date(store.last_checkout_check).getTime()) > 60 * 60 * 1000

  if (shouldCheckCheckout) {
    const checkoutResult = await checkCheckoutUrl(store.platform, store.domain)
    await supabase.from('stores').update({
      last_checkout_check: new Date().toISOString(),
      checkout_status: checkoutResult.ok ? 'ok' : 'error',
    }).eq('id', store.id)

    if (!checkoutResult.ok) {
      const canCreate = await shouldCreateAlert(supabase, store.id, 'CHECKOUT_OFFLINE')
      if (canCreate) {
        const result = await createAlertWithNotification(supabase, store, {
          type: 'CHECKOUT_OFFLINE',
          severity: 'critical',
          title: 'Checkout Offline',
          message: `O checkout da loja ${store.name} está com problemas! URL de checkout retornou erro ${checkoutResult.statusCode}.`,
          metadata: { checkoutUrl: checkoutResult.url, statusCode: checkoutResult.statusCode },
        })
        alerts.push({ alertType: 'CHECKOUT_OFFLINE', ...result })
      }
    }
  }

  return alerts
}
```

### Migração SQL (padrão observado nas migrações existentes)

```sql
-- supabase/migrations/20260330200000_add_advanced_monitoring.sql

-- Campos para monitor de velocidade
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS speed_threshold_ms INTEGER DEFAULT 3000,
  ADD COLUMN IF NOT EXISTS last_response_time_ms INTEGER;

-- Campos para monitor de checkout
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS last_checkout_check TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checkout_status TEXT DEFAULT 'unknown'
    CHECK (checkout_status IN ('ok', 'error', 'unknown'));

-- Índice para queries de deduplicação de alertas (por store_id + type + created_at)
CREATE INDEX IF NOT EXISTS idx_alerts_store_type_created
  ON alerts(store_id, type, created_at DESC);

COMMENT ON COLUMN stores.speed_threshold_ms IS 'Threshold de velocidade em ms. Alerta LOJA_LENTA se response_time > threshold.';
COMMENT ON COLUMN stores.last_response_time_ms IS 'Último tempo de resposta medido pelo monitor de velocidade.';
COMMENT ON COLUMN stores.last_checkout_check IS 'Timestamp do último check de checkout. Usado para throttle de 1x/hora.';
COMMENT ON COLUMN stores.checkout_status IS 'Status atual do checkout: ok, error ou unknown.';
```

### UI: Seção Monitores Avançados no stores/page.tsx

```tsx
// Padrão visual seguindo alert-rules/page.tsx e stores/page.tsx existentes
// Adicionar dentro do card/modal de edição da loja

{/* Seção Monitores Avançados — gate: pro+ */}
{ADVANCED_MONITORING_TIERS.includes(userTier) ? (
  <div className="space-y-4 border-t pt-4 mt-4">
    <h3 className="text-sm font-semibold">Monitores Avançados</h3>

    {/* Toggle de checkout */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Monitor de Checkout</Label>
        <p className="text-xs text-muted-foreground">
          Verifica se o carrinho/checkout está acessível
        </p>
      </div>
      <Switch
        checked={formData.checkoutMonitorEnabled}
        onCheckedChange={(checked) => setFormData({ ...formData, checkoutMonitorEnabled: checked })}
      />
    </div>

    {/* Threshold de velocidade */}
    <div className="space-y-2">
      <Label>Threshold de Velocidade (segundos)</Label>
      <Input
        type="number"
        min={1}
        max={10}
        value={formData.speedThresholdSeconds}
        onChange={(e) => setFormData({ ...formData, speedThresholdSeconds: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Alertar quando a loja demorar mais que {formData.speedThresholdSeconds}s para responder
      </p>
    </div>

    {/* Status atual */}
    {store.last_response_time_ms && (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Último tempo de resposta:</span>
        <Badge variant={store.last_response_time_ms > (store.speed_threshold_ms || 3000) ? 'destructive' : 'default'}>
          {store.last_response_time_ms}ms
        </Badge>
      </div>
    )}
    {store.checkout_status && store.checkout_status !== 'unknown' && (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Checkout:</span>
        <Badge variant={store.checkout_status === 'ok' ? 'default' : 'destructive'}>
          {store.checkout_status === 'ok' ? 'OK' : 'ERRO'}
        </Badge>
      </div>
    )}
  </div>
) : (
  <div className="border-t pt-4 mt-4 opacity-60">
    <p className="text-sm text-muted-foreground">
      Monitores avançados disponíveis no plano Pro ou superior.
    </p>
  </div>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `AbortController` + `setTimeout` manual | `AbortSignal.timeout(ms)` nativo | Node 17.3+ | Mais simples, sem memory leak |
| `Date.now()` para timing | `performance.now()` | Node 18+ | Sub-milissegundo, monotonic |

**Nota sobre `vercel.json` e crons:** O arquivo `vercel.json` atual não configura o cron. Isso é esperado se o cron foi configurado via dashboard da Vercel ou se usa `vercel.json` com `crons` key que pode não estar presente na branch atual. Confirmar antes de mergear a fase: o cron route `/api/cron/check-status` tem o comentário "chamada pelo Vercel Cron a cada 10 minutos", então a configuração existe mas está fora do repositório.

---

## Open Questions

1. **Medição de velocidade: capturar no HEAD ou em request separado?**
   - What we know: `checkStoreStatus()` tenta HEAD primeiro, e se bem-sucedido retorna sem GET. HEAD não retorna body e geralmente é muito mais rápido que GET para sites com muito conteúdo — pode subestimar a velocidade percebida pelo usuário.
   - What's unclear: Se o threshold de 3s é para HEAD ou GET. Para detecção de "loja lenta" do ponto de vista do usuário, GET é mais representativo.
   - Recommendation: Modificar `checkStoreStatus()` para retornar `responseTimeMs` do método que foi usado (HEAD ou GET), documentar isso no código. O threshold de 3s é alto o suficiente para absorver a diferença.

2. **Onde persistir `checkout_monitor_enabled` por loja?**
   - What we know: A CONTEXT.md menciona toggle on/off, mas não menciona um campo booleano correspondente na tabela. Os campos definidos são `last_checkout_check` e `checkout_status` — nenhum `checkout_monitor_enabled`.
   - What's unclear: Se o toggle é apenas para controle de UI ou também para o backend pular o check.
   - Recommendation: Adicionar `checkout_monitor_enabled BOOLEAN DEFAULT true` à migration. Isso é necessário para que o usuário possa desativar o monitor sem mudar de plano. O custo é mínimo.

3. **Cron configurado onde?**
   - What we know: `vercel.json` atual não tem configuração de cron. O route tem comentário mencionando Vercel Cron a cada 10 min. O `CRON_SECRET` existe como env var.
   - What's unclear: Se o cron está configurado no dashboard da Vercel (fora do git) ou se há outro arquivo.
   - Recommendation: Verificar no dashboard Vercel antes de executar a fase. Se não estiver configurado, adicionar ao `vercel.json` durante a Wave 0: `"crons": [{ "path": "/api/cron/check-status", "schedule": "*/10 * * * *" }]`

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase (service role) | Cron job | Confirmado via código existente | — | — |
| `AbortSignal.timeout` | Timeout de HTTP | Confirmado — já usado em `checkStoreStatus` | Node 18+ | `AbortController` + `setTimeout` |
| `performance.now()` | Medição de latência | Confirmado — Node 18+ | — | `Date.now()` |
| Vercel Cron | Execução do cron | Presumido funcional (comentário no código) | — | — |

**Missing dependencies with no fallback:** Nenhum.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Nenhum detectado no projeto |
| Config file | Não existe (sem `jest.config.*`, `vitest.config.*`, `pytest.ini`) |
| Quick run command | N/A |
| Full suite command | N/A |

**Nota:** O projeto não possui testes automatizados configurados. A validação desta fase é manual.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | Monitor de velocidade cria alerta LOJA_LENTA quando response > threshold | Manual | N/A | N/A |
| REQ-02 | Monitor de erros detecta 4xx/5xx e cria ERRO_PAGINA | Manual | N/A | N/A |
| REQ-03 | Monitor de checkout verifica URL e cria CHECKOUT_OFFLINE | Manual | N/A | N/A |
| REQ-04 | Checks avançados skipped para usuários free | Manual | N/A | N/A |
| REQ-05 | UI da loja exibe seção "Monitores Avançados" com toggle e threshold | Manual (browser) | N/A | N/A |
| REQ-06 | Thresholds persistidos no banco | Manual (Supabase dashboard) | N/A | N/A |

### Wave 0 Gaps
- Nenhum framework de testes detectado — validação será manual via invocação do endpoint `/api/cron/check-status` com `Authorization: Bearer $CRON_SECRET` e verificação no Supabase.

---

## Sources

### Primary (HIGH confidence)
- Código-fonte: `src/app/api/cron/check-status/route.ts` — lido diretamente, estrutura do cron documentada
- Código-fonte: `src/services/notification.ts` — lido diretamente, padrão de notificação documentado
- Código-fonte: `src/app/stores/page.tsx` — lido diretamente, confirmação de ausência de página de detalhe individual
- Código-fonte: `supabase/migrations/` — todas as migrações lidas, schema completo mapeado
- Código-fonte: `vercel.json` — lido diretamente, ausência de configuração de cron confirmada
- Código-fonte: `src/components/ui/switch.tsx` — lido diretamente, componente Switch disponível

### Secondary (MEDIUM confidence)
- `02-CONTEXT.md` — decisões técnicas definidas pelo autor do projeto (fonte autoritativa para este plano)

### Tertiary (LOW confidence)
- Nenhum.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — lido diretamente do código existente
- Architecture: HIGH — baseado na leitura completa do cron job e schema
- Pitfalls: MEDIUM — baseado em análise do código + conhecimento geral de serverless e e-commerce

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stack estável, sem dependências externas voláteis)
