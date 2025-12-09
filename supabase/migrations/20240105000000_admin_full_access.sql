-- Admin Full Access Policies
-- Permite que admins vejam e gerenciem tudo

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Profiles - Admin access
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete all profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin());

-- Stores - Admin access
CREATE POLICY "Admins can view all stores"
  ON stores FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert stores"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all stores"
  ON stores FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete all stores"
  ON stores FOR DELETE
  TO authenticated
  USING (is_admin());

-- Products - Admin access
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete all products"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- Orders - Admin access
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete all orders"
  ON orders FOR DELETE
  TO authenticated
  USING (is_admin());

-- Alerts - Admin access
CREATE POLICY "Admins can view all alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete all alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (is_admin());

-- Alert Rules - Admin access
CREATE POLICY "Admins can view all alert rules"
  ON alert_rules FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert alert rules"
  ON alert_rules FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all alert rules"
  ON alert_rules FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete all alert rules"
  ON alert_rules FOR DELETE
  TO authenticated
  USING (is_admin());

-- Leads - Admin access
CREATE POLICY "Admins can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (is_admin());

-- Subscriptions - Admin access (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    EXECUTE 'CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR SELECT TO authenticated USING (is_admin())';
    EXECUTE 'CREATE POLICY "Admins can update all subscriptions" ON subscriptions FOR UPDATE TO authenticated USING (is_admin())';
    EXECUTE 'CREATE POLICY "Admins can delete all subscriptions" ON subscriptions FOR DELETE TO authenticated USING (is_admin())';
  END IF;
END $$;
