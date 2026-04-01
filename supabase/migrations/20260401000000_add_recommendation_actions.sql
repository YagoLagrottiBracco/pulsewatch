-- Phase 9: Rastreamento de Ações
-- Adds recommendation_actions table to track status of AI insight recommendations.
-- Absence of a row means implicit 'pending' status (D-02).

CREATE TABLE IF NOT EXISTS recommendation_actions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id  UUID        NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
  rec_index   INTEGER     NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'done', 'ignored')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (insight_id, rec_index)   -- required for UPSERT onConflict (Pitfall 1)
);

-- Index for fast lookup of all actions for a given insight
CREATE INDEX IF NOT EXISTS idx_recommendation_actions_insight_id
  ON recommendation_actions (insight_id);

ALTER TABLE recommendation_actions ENABLE ROW LEVEL SECURITY;

-- SELECT: user may read actions that belong to their own insights (RLS via JOIN — Pitfall 4)
CREATE POLICY "Users can view own recommendation actions"
  ON recommendation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_insights
      WHERE ai_insights.id = recommendation_actions.insight_id
        AND ai_insights.user_id = auth.uid()
    )
  );

-- INSERT: user may create actions only for their own insights
CREATE POLICY "Users can insert own recommendation actions"
  ON recommendation_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_insights
      WHERE ai_insights.id = recommendation_actions.insight_id
        AND ai_insights.user_id = auth.uid()
    )
  );

-- UPDATE: user may update actions only for their own insights
CREATE POLICY "Users can update own recommendation actions"
  ON recommendation_actions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ai_insights
      WHERE ai_insights.id = recommendation_actions.insight_id
        AND ai_insights.user_id = auth.uid()
    )
  );
