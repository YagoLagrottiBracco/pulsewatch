-- Phase 5: Multi-usuário e Times
-- Adds team members, invites, alert routing, and alert acknowledgment

-- 1. Team members table
CREATE TABLE IF NOT EXISTS account_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'manager', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  invite_token UUID DEFAULT gen_random_uuid(),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_owner_id, email)
);

ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;

-- Owner can see all their team members
CREATE POLICY "Owners can manage their team" ON account_members
  FOR ALL USING (auth.uid() = account_owner_id);

-- Members can see their own membership
CREATE POLICY "Members can view own membership" ON account_members
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Alert routing — which members get which alert types per store
CREATE TABLE IF NOT EXISTS alert_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES account_members(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  alert_types TEXT[] DEFAULT '{}',
  severity_min TEXT DEFAULT 'low' CHECK (severity_min IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, store_id)
);

ALTER TABLE alert_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage alert routing" ON alert_routing
  FOR ALL USING (auth.uid() = account_owner_id);

CREATE POLICY "Members can view own routing" ON alert_routing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_members
      WHERE account_members.id = alert_routing.member_id
      AND account_members.user_id = auth.uid()
    )
  );

-- 3. Alert acknowledgment log
CREATE TABLE IF NOT EXISTS alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  UNIQUE(alert_id, user_id)
);

ALTER TABLE alert_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own acknowledgments" ON alert_acknowledgments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Owners can view team acknowledgments" ON alert_acknowledgments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alerts
      JOIN stores ON stores.id = alerts.store_id
      WHERE alerts.id = alert_acknowledgments.alert_id
      AND stores.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_account_members_owner ON account_members(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_account_members_user ON account_members(user_id);
CREATE INDEX IF NOT EXISTS idx_account_members_token ON account_members(invite_token) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_alert_routing_member ON alert_routing(member_id);
CREATE INDEX IF NOT EXISTS idx_alert_ack_alert ON alert_acknowledgments(alert_id);

COMMENT ON TABLE account_members IS 'Team members linked to an account owner. Roles: owner, manager, viewer.';
COMMENT ON TABLE alert_routing IS 'Per-member, per-store alert routing rules. Empty alert_types means all types.';
COMMENT ON TABLE alert_acknowledgments IS 'Log of who acknowledged which alert and when.';
