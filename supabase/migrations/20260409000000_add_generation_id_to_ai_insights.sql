-- Phase 10: Histórico de Insights
-- Adds generation_id FK to ai_insights, linking each insight row to its batch in insight_generation_log.
-- Nullable for compatibility with pre-Phase-10 data (no backfill required — D-01).

ALTER TABLE ai_insights
  ADD COLUMN IF NOT EXISTS generation_id UUID
    REFERENCES insight_generation_log(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ai_insights_generation
  ON ai_insights(generation_id);
