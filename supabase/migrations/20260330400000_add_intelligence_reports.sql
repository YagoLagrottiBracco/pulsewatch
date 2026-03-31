-- Phase 4: Intelligence & Reports
-- Adds weekly report log, uptime tracking

-- 1. Weekly report tracking (avoid duplicate sends)
CREATE TABLE IF NOT EXISTS weekly_report_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  channels_sent TEXT[] DEFAULT '{}',
  report_data JSONB,
  UNIQUE(user_id, week_start)
);

ALTER TABLE weekly_report_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON weekly_report_log
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Store uptime snapshots (daily aggregation for SLA)
CREATE TABLE IF NOT EXISTS store_uptime_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_checks INTEGER DEFAULT 0,
  successful_checks INTEGER DEFAULT 0,
  total_downtime_minutes INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, date)
);

ALTER TABLE store_uptime_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own store uptime" ON store_uptime_daily
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores WHERE stores.id = store_uptime_daily.store_id AND stores.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_store_uptime_daily_store_date
  ON store_uptime_daily(store_id, date DESC);

-- 3. Add offline_since tracking if not exists (for uptime calc)
-- Already exists from prior migrations

COMMENT ON TABLE weekly_report_log IS 'Tracks weekly report emails sent to users to avoid duplicates.';
COMMENT ON TABLE store_uptime_daily IS 'Daily uptime aggregation per store for SLA calculations.';
