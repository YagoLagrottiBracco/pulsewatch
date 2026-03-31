-- Phase 7: Automations & API
-- Adds webhooks, maintenance windows, API keys, and status page config

-- 1. Webhook endpoints (outgoing webhooks to external tools)
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] DEFAULT '{alert.created,store.status_changed}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  last_status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own webhooks" ON webhooks
  FOR ALL USING (auth.uid() = user_id);

-- 2. Webhook delivery log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT false
);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook deliveries" ON webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM webhooks WHERE webhooks.id = webhook_deliveries.webhook_id AND webhooks.user_id = auth.uid()
    )
  );

-- Keep only last 100 deliveries per webhook (cleanup via app logic)
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, delivered_at DESC);

-- 3. Maintenance windows
CREATE TABLE IF NOT EXISTS maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  suppress_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maintenance_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own maintenance windows" ON maintenance_windows
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_windows_active
  ON maintenance_windows(store_id, starts_at, ends_at);

-- 4. API keys for public API (agency only)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{read}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- 5. Status page configuration (pro+)
CREATE TABLE IF NOT EXISTS status_page_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT DEFAULT 'Status',
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  show_uptime_history BOOLEAN DEFAULT true,
  show_incidents BOOLEAN DEFAULT true,
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE status_page_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own status page" ON status_page_config
  FOR ALL USING (auth.uid() = user_id);

-- Link stores to status page (which stores appear)
CREATE TABLE IF NOT EXISTS status_page_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_page_id UUID NOT NULL REFERENCES status_page_config(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  display_name TEXT,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(status_page_id, store_id)
);

ALTER TABLE status_page_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own status page stores" ON status_page_stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM status_page_config WHERE status_page_config.id = status_page_stores.status_page_id AND status_page_config.user_id = auth.uid()
    )
  );

COMMENT ON TABLE webhooks IS 'Outgoing webhooks to external tools (n8n, Zapier, Make). Gate: business+.';
COMMENT ON TABLE maintenance_windows IS 'Scheduled maintenance windows that suppress alerts.';
COMMENT ON TABLE api_keys IS 'API keys for public REST API access. Gate: agency.';
COMMENT ON TABLE status_page_config IS 'Public status page configuration. Gate: pro+.';
