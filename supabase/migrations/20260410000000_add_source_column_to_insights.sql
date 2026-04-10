-- Phase 11: Geracao Automatica Semanal
-- Adds source column to ai_insights and insight_generation_log.
-- Values: 'manual' (default, existing rows), 'automatic' (cron), 'alert_triggered' (Phase 12).

ALTER TABLE ai_insights
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE insight_generation_log
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- Index for filtering by source (useful for generation selector label)
CREATE INDEX IF NOT EXISTS idx_ai_insights_source ON ai_insights(source);
CREATE INDEX IF NOT EXISTS idx_insight_generation_log_source ON insight_generation_log(source);
