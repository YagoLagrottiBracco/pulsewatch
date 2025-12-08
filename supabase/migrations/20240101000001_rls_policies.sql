-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Stores Policies
CREATE POLICY "Users can view their own stores"
  ON stores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stores"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores"
  ON stores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores"
  ON stores FOR DELETE
  USING (auth.uid() = user_id);

-- Products Policies
CREATE POLICY "Users can view products from their stores"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products to their stores"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products from their stores"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products from their stores"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Orders Policies
CREATE POLICY "Users can view orders from their stores"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert orders to their stores"
  ON orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update orders from their stores"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete orders from their stores"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Alerts Policies
CREATE POLICY "Users can view alerts from their stores"
  ON alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = alerts.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own alerts"
  ON alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = alerts.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete alerts from their stores"
  ON alerts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = alerts.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Alert Rules Policies
CREATE POLICY "Users can view their own alert rules"
  ON alert_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert rules"
  ON alert_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert rules"
  ON alert_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert rules"
  ON alert_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Leads Policies (public insert, admin read)
CREATE POLICY "Anyone can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can view leads"
  ON leads FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');
