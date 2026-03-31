# Phase 2 Context — Monitor de Checkout e Velocidade

[auto] Modo auto ativo — todas as decisões foram tomadas automaticamente.

## Phase Goal
Detectar lojas "online mas quebradas": lojas que respondem ao ping mas têm checkout quebrado, estão lentas ou retornam erros em páginas críticas.

## Canonical Refs
- `src/app/api/cron/check-status/route.ts` — cron job de verificação de lojas (padrão de referência)
- `src/services/notification.ts` — serviço de notificações multicanal
- `src/app/alert-rules/page.tsx` — UI de configuração de regras de alerta (padrão de referência)
- `supabase/migrations/20240101000000_initial_schema.sql` — schema base
- `supabase/migrations/20260330100000_restructure_subscription_tiers.sql` — estrutura de tiers

---

## Decisions

### 1. Arquitetura dos Monitores

**Decisão:** Integrar os monitores avançados DENTRO do cron job existente (`check-status/route.ts`), como etapa adicional após o ping básico.

**Rationale:** O cron já itera sobre todas as lojas com controle de intervalo e tier. Adicionar os checks avançados ali evita duplicação e mantém a lógica centralizada.

**Implementação:**
- Após `checkStoreStatus()` confirmar que a loja está online, executar `checkAdvancedMonitors()` que é gate-checked (pro+)
- Resultado adicionado ao objeto `results` existente
- Timeouts curtos para não bloquear o cron

### 2. Monitor de Velocidade (LOJA_LENTA)

**Decisão:** Medir response time do HEAD/GET na URL principal da loja durante o check existente.

**Threshold padrão:** 3 segundos (configurável por loja, range 1-10s)
**Implementação:**
- `performance.now()` antes/depois do fetch
- Se `responseTime > threshold` E loja estava rápida antes → criar alerta `LOJA_LENTA`
- Campo novo na tabela `stores`: `speed_threshold_ms INTEGER DEFAULT 3000`
- Armazenar último `response_time_ms` na tabela `stores` para histórico

### 3. Monitor de Erros (ERRO_PAGINA)

**Decisão:** Verificar se a home da loja retorna 4xx/5xx.

**Implementação:**
- Já capturado pelo `checkStoreStatus()` existente via `statusCode`
- Criar alerta `ERRO_PAGINA` se `statusCode >= 400` (mesmo que HTTP fetch não lance exceção)
- Severidade: `high` para 5xx, `medium` para 4xx
- Separar do alerta `LOJA_OFFLINE` (que é para timeout/DNS fail)

### 4. Monitor de Checkout (CHECKOUT_OFFLINE)

**Decisão:** Fazer GET na URL de carrinho/checkout e verificar se retorna 200 (sem erros de redirecionamento).

**Implementação:**
- URL de checkout por plataforma:
  - Shopify: `https://{domain}/cart`
  - WooCommerce: `https://{domain}/carrinho` e `https://{domain}/cart`
  - Nuvemshop: `https://{domain}/checkout`
  - Genérico (unknown): `https://{domain}/cart`
- Verificar: `status !== 200` OU redirecionamento para página de erro
- Timeout: 8 segundos
- Executar apenas quando loja estiver online
- Gate: pro+

### 5. Gate de Acesso

**Decisão:** Monitores avançados disponíveis apenas para `pro`, `business`, `agency` (não `free`).

**Implementação:**
```typescript
const ADVANCED_MONITORING_TIERS = ['pro', 'business', 'agency']
if (!ADVANCED_MONITORING_TIERS.includes(userTier)) {
  // Skip monitores avançados
}
```

### 6. Frequência dos Checks Avançados

**Decisão:** Monitor de velocidade e erros: a cada verificação normal. Monitor de checkout: 1x por hora por loja (evitar falsos positivos e carga desnecessária).

**Implementação:**
- Campo `last_checkout_check TIMESTAMPTZ` na tabela `stores`
- Skip checkout check se `last_checkout_check` foi há < 60 minutos

### 7. Alertas — Deduplicação

**Decisão:** Não criar alertas duplicados em sequência. Se último alerta do mesmo tipo para a mesma loja foi criado há < 30 minutos, skip.

**Implementação:**
- Query antes de criar alerta: `alerts.select().eq('store_id').eq('type').order('created_at desc').limit(1)`
- Se criado há < 30 min: não criar novo

### 8. Novos Campos na Tabela `stores`

```sql
ALTER TABLE stores ADD COLUMN IF NOT EXISTS speed_threshold_ms INTEGER DEFAULT 3000;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_response_time_ms INTEGER;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_checkout_check TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS checkout_status TEXT DEFAULT 'unknown'
  CHECK (checkout_status IN ('ok', 'error', 'unknown'));
```

### 9. UI — Configuração por Loja

**Decisão:** Adicionar seção "Monitores Avançados" na página de detalhes/configuração de cada loja.

**Localização:** Nova tab ou seção dentro da loja individual no dashboard.
**Elementos:**
- Toggle "Monitor de Checkout" (on/off, gate: pro+)
- Slider/input "Threshold de velocidade" (1-10s, padrão 3s, gate: pro+)
- Indicador visual do último response time medido
- Badge de status: CHECKOUT OK / CHECKOUT ERROR / LENTO

**Padrão visual:** Seguir os componentes existentes (Card, Badge, Switch, Input do shadcn/ui).

### 10. Novos Tipos de Alerta

```typescript
type AlertType =
  | 'LOJA_OFFLINE'    // existente
  | 'LOJA_ONLINE'     // existente
  | 'LOJA_LENTA'      // novo — response time > threshold
  | 'CHECKOUT_OFFLINE' // novo — checkout retornou erro
  | 'ERRO_PAGINA'      // novo — loja retornou 4xx/5xx na home
```

### 11. Severidade dos Alertas

- `CHECKOUT_OFFLINE`: `critical` (impacto direto em vendas)
- `LOJA_LENTA`: `medium` (depende do threshold)
- `ERRO_PAGINA` (5xx): `high`
- `ERRO_PAGINA` (4xx): `medium`

### 12. Mensagens de Alerta (em português)

- `CHECKOUT_OFFLINE`: "O checkout da loja {name} está com problemas! URL de checkout retornou erro {statusCode}."
- `LOJA_LENTA`: "A loja {name} está respondendo lentamente ({responseTime}ms, threshold: {threshold}ms)."
- `ERRO_PAGINA`: "A loja {name} está retornando erro {statusCode} na página principal."

---

## Deferred Ideas (fora do escopo desta fase)

- Histórico de response time (gráfico de latência ao longo do tempo) → Fase 4
- Monitor de página de produto específico (URL custom) → Fase 7
- Janelas de manutenção (silenciar alertas em períodos) → Fase 7
- Dashboard de uptime/SLA % → Fase 4

---

## Technical Constraints

- O cron atual roda a cada 10 minutos (verificado em comentário do route.ts)
- Usar `fetch` nativo com `AbortController` para timeout nos checks avançados
- Supabase service role key disponível no cron (sem RLS)
- Plataformas suportadas: shopify, woocommerce, nuvemshop, tray, vtex, unknown
