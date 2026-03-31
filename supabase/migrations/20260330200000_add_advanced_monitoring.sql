-- Phase 2: Advanced Monitoring — speed, checkout, HTTP errors
-- Adds columns to stores table for configuring and tracking advanced monitors.

-- Monitor de velocidade: threshold configuravel e ultimo tempo medido
ALTER TABLE stores ADD COLUMN IF NOT EXISTS speed_threshold_ms INTEGER DEFAULT 3000;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_response_time_ms INTEGER;

-- Monitor de checkout: timestamp do ultimo check e status
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_checkout_check TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS checkout_status TEXT DEFAULT 'unknown';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS checkout_monitor_enabled BOOLEAN DEFAULT true;

-- Constraint para checkout_status: valores validos
ALTER TABLE stores ADD CONSTRAINT stores_checkout_status_check
  CHECK (checkout_status IN ('ok', 'error', 'unknown'));

-- Indice para deduplicacao de alertas: query rapida por store_id + type + created_at
CREATE INDEX IF NOT EXISTS idx_alerts_store_type_created
  ON alerts(store_id, type, created_at DESC);

-- Comentarios descritivos
COMMENT ON COLUMN stores.speed_threshold_ms IS 'Threshold em ms para alerta LOJA_LENTA. Padrao 3000ms (3s). Range: 1000-10000.';
COMMENT ON COLUMN stores.last_response_time_ms IS 'Ultimo tempo de resposta medido pelo cron (HEAD ou GET).';
COMMENT ON COLUMN stores.last_checkout_check IS 'Timestamp do ultimo check de checkout. Throttle 1x/hora.';
COMMENT ON COLUMN stores.checkout_status IS 'Status do checkout: ok, error, unknown.';
COMMENT ON COLUMN stores.checkout_monitor_enabled IS 'Toggle para ativar/desativar monitor de checkout por loja.';
