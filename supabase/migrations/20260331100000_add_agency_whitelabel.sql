-- Phase 6: Agency & White-label
-- Adds agency workspaces, white-label config, and client portals

-- 1. Agency workspaces (one per client)
CREATE TABLE IF NOT EXISTS agency_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  client_email TEXT,
  client_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_user_id, slug)
);

ALTER TABLE agency_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can manage workspaces" ON agency_workspaces
  FOR ALL USING (auth.uid() = agency_user_id);

-- 2. Link stores to workspaces
ALTER TABLE stores ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES agency_workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_stores_workspace ON stores(workspace_id) WHERE workspace_id IS NOT NULL;

-- 3. White-label configuration per agency
CREATE TABLE IF NOT EXISTS whitelabel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  brand_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#667eea',
  secondary_color TEXT DEFAULT '#764ba2',
  custom_domain TEXT,
  favicon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whitelabel_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can manage whitelabel" ON whitelabel_config
  FOR ALL USING (auth.uid() = agency_user_id);

-- 4. Client portal tokens (read-only access links)
CREATE TABLE IF NOT EXISTS client_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES agency_workspaces(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can manage portal tokens" ON client_portal_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agency_workspaces
      WHERE agency_workspaces.id = client_portal_tokens.workspace_id
      AND agency_workspaces.agency_user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agency_workspaces_agency ON agency_workspaces(agency_user_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_token ON client_portal_tokens(token) WHERE is_active = true;

COMMENT ON TABLE agency_workspaces IS 'Isolated workspaces per agency client. Each workspace groups stores.';
COMMENT ON TABLE whitelabel_config IS 'White-label branding config per agency: logo, colors, domain.';
COMMENT ON TABLE client_portal_tokens IS 'Read-only portal access tokens for agency clients.';
