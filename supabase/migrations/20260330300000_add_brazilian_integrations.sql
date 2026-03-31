-- Phase 3: Brazilian Integrations
-- Adds Mercado Livre, Shopee platforms + gateway monitoring table

-- 1. Update platform constraint to include all supported platforms
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_platform_check;
ALTER TABLE stores ADD CONSTRAINT stores_platform_check
  CHECK (platform IN (
    'shopify', 'woocommerce', 'nuvemshop', 'tray', 'vtex',
    'prestashop', 'bigcommerce', 'magento', 'spree',
    'mercadolivre', 'shopee', 'unknown'
  ));

-- 2. Gateway status tracking table
CREATE TABLE IF NOT EXISTS gateway_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'degraded', 'unknown')),
  response_time_ms INTEGER,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_gateway_status_gateway_checked
  ON gateway_status(gateway, checked_at DESC);

-- 3. User-level gateway alert config (which gateways to monitor per user)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS monitored_gateways TEXT[] DEFAULT '{}';

COMMENT ON TABLE gateway_status IS 'Historico de status de gateways de pagamento brasileiros (Pix, PagSeguro, Mercado Pago, Cielo).';
COMMENT ON COLUMN user_profiles.monitored_gateways IS 'Array de gateways que o usuario quer monitorar. Ex: {pix, pagseguro, mercadopago, cielo}';
