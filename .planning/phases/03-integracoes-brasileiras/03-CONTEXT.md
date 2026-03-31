# Phase 3 Context — Integrações Brasileiras

[auto] Modo auto ativo — todas as decisões foram tomadas automaticamente.

## Phase Goal
Expandir além de Shopify/WooCommerce para plataformas dominantes no Brasil e monitorar status de gateways de pagamento.

## Canonical Refs
- `src/integrations/` — integration clients existentes (padrão de referência)
- `src/app/api/cron/check-status/route.ts` — cron job com sync functions
- `src/services/platform-detector.ts` — detector de plataforma
- `src/app/stores/page.tsx` — UI de criação/edição de loja
- `supabase/migrations/20240101000000_initial_schema.sql` — schema base

---

## Decisions

### 1. Escopo Refinado

**Observação crítica do codebase:** Nuvemshop, Tray e VTEX JÁ TÊM integration clients implementados em `src/integrations/`. O CHECK constraint do banco (`platform IN ('shopify', 'woocommerce', 'nuvemshop', 'unknown')`) não inclui `tray` e `vtex`, mas o cron já tem sync functions para ambos.

**O que REALMENTE falta para a Fase 3:**
1. **Mercado Livre** — integration client novo + OAuth + sync
2. **Shopee** — integration client novo + sync
3. **Gateway monitoring** — serviço novo para monitorar gateways de pagamento
4. **Fix platform constraint** — atualizar CHECK para incluir todas as plataformas
5. **Nuvemshop improvements** — já tem client, adicionar metrics de vendas em tempo real

### 2. Mercado Livre Integration

**Decisão:** Criar `src/integrations/mercadolivre.ts` seguindo o padrão existente.

**API:** Mercado Libre API v1 (api.mercadolibre.com)
- Auth: OAuth 2.0 (authorization_code + refresh_token)
- Endpoints: /users/me, /users/{id}/items/search, /items/{id}, /orders/search
- Rate limit: 10k req/hora por app

**Config (platform_config):**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "userId": "string",
  "tokenExpiresAt": "string (ISO date)"
}
```

**Funcionalidades:**
- `fetchProducts()` — listagens ativas do seller
- `fetchOrders()` — pedidos recentes
- `getSellerReputation()` — reputação e métricas do seller
- `checkListingStatus()` — detectar listagens pausadas/bloqueadas

**Novos alertas:**
- `ML_LISTAGEM_PAUSADA` — listagem foi pausada/desativada (severity: medium)
- `ML_REPUTACAO_BAIXA` — reputação caiu abaixo de threshold (severity: high)

### 3. Shopee Integration

**Decisão:** Criar `src/integrations/shopee.ts` seguindo o padrão existente.

**API:** Shopee Open Platform API v2
- Auth: Partner key + shop-level auth (signature-based)
- Endpoints: /api/v2/product/get_item_list, /api/v2/order/get_order_list, /api/v2/shop/get_shop_info

**Config (platform_config):**
```json
{
  "shopId": "string",
  "accessToken": "string",
  "refreshToken": "string",
  "partnerId": "string",
  "partnerKey": "string"
}
```

**Funcionalidades:**
- `fetchProducts()` — produtos ativos da loja
- `fetchOrders()` — pedidos pendentes/recentes
- `getShopScore()` — score e métricas da loja

**Novos alertas:**
- `SHOPEE_PRODUTO_BLOQUEADO` — produto com violação (severity: high)
- `SHOPEE_SCORE_BAIXO` — score da loja caiu (severity: medium)

### 4. Nuvemshop Improvements

**Decisão:** Estender `src/integrations/nuvemshop.ts` existente.

**Adições:**
- `fetchRecentOrders()` — pedidos das últimas 24h para métricas em tempo real
- `getStoreSalesMetrics()` — total vendido hoje, ticket médio, pedidos do dia

### 5. Gateway Monitoring Service

**Decisão:** Criar `src/services/gateway-monitor.ts` — serviço separado do cron de lojas.

**Gateways monitorados:**
- **Pix (Banco Central):** Verificar status do sistema de pagamentos instantâneos
- **PagSeguro:** Health check do API endpoint
- **Mercado Pago:** Health check do API endpoint
- **Cielo:** Health check do API endpoint

**Implementação:**
- Função `checkGatewayStatus(gateway: string)` que faz GET no status endpoint
- Integrar no cron existente como etapa adicional (1x por execução, não por loja)
- Tabela `gateway_status` para histórico
- Alerta `GATEWAY_OFFLINE` (severity: critical) quando gateway fica offline
- Gate: business+

**Status endpoints (públicos):**
- Pix: `https://www.bcb.gov.br/estabilidadefinanceira/pagamentosinstantaneos` (parse HTML ou API interna)
- PagSeguro: `https://api.pagseguro.com/` (health check)
- Mercado Pago: `https://api.mercadopago.com/` (health check)
- Cielo: `https://api.cieloecommerce.cielo.com.br/1/` (health check)

### 6. Gate de Acesso

**Decisão:** Integrações com Mercado Livre e Shopee: business+ (como especificado no roadmap). Gateway monitoring: business+.

### 7. Platform CHECK Constraint Update

**Decisão:** Atualizar constraint para incluir todas as plataformas suportadas.

```sql
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_platform_check;
ALTER TABLE stores ADD CONSTRAINT stores_platform_check
  CHECK (platform IN ('shopify', 'woocommerce', 'nuvemshop', 'tray', 'vtex', 'prestashop', 'bigcommerce', 'magento', 'spree', 'mercadolivre', 'shopee', 'unknown'));
```

### 8. UI — Formulário de Loja

**Decisão:** Adicionar campos de configuração para Mercado Livre e Shopee no formulário existente de criação/edição de loja (src/app/stores/page.tsx).

- Mercado Livre: botão "Conectar com Mercado Livre" (OAuth flow)
- Shopee: campos shopId, accessToken

### 9. Nova Tabela gateway_status

```sql
CREATE TABLE IF NOT EXISTS gateway_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'degraded', 'unknown')),
  response_time_ms INTEGER,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_gateway_status_gateway_checked
  ON gateway_status(gateway, checked_at DESC);
```

---

## Deferred Ideas
- OAuth flow completo com redirect URI para Mercado Livre (simplificar com token manual por enquanto)
- Shopee Partner approval process (requer aprovação da Shopee para API access)
- Dashboard de status de gateways com gráfico de uptime → Fase 4
- Monitoramento de Pagar.me, Stone, Stripe BR → futuro

---

## Technical Constraints
- Mercado Libre API: rate limit 10k/hora, tokens expiram a cada 6h
- Shopee API: signature-based auth, requer partner_id e partner_key
- Gateway health checks devem ser rápidos (timeout 5s) para não bloquear o cron
- Platform detector já suporta detecção de múltiplas plataformas
