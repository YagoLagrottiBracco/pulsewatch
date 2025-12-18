-- Create AI Insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Insight data
  insight_type VARCHAR(50) NOT NULL, -- 'sales_patterns', 'stock_forecast', 'product_recommendations', 'anomaly_detection', 'pricing_suggestions', 'performance_analysis', 'dropshipping_analysis'
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detailed_analysis JSONB NOT NULL, -- Structured analysis data
  recommendations JSONB, -- Array of recommendations
  
  -- Metadata
  data_analyzed JSONB, -- Info about what data was analyzed (date ranges, product counts, etc)
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Indexes
  CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- Create index for faster queries
CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_store_id ON ai_insights(store_id);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);

-- Create insight generation log for rate limiting
CREATE TABLE IF NOT EXISTS insight_generation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Index for rate limiting checks
  CONSTRAINT unique_user_generation UNIQUE (user_id, generated_at)
);

CREATE INDEX idx_insight_generation_user_time ON insight_generation_log(user_id, generated_at DESC);

-- RLS Policies
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_generation_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own insights
CREATE POLICY "Users can view own insights"
  ON ai_insights FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert insights (via API)
CREATE POLICY "Users can create own insights"
  ON ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own insights
CREATE POLICY "Users can delete own insights"
  ON ai_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Generation log policies
CREATE POLICY "Users can view own generation log"
  ON insight_generation_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation log"
  ON insight_generation_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "Admins have full access to insights"
  ON ai_insights FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins have full access to generation log"
  ON insight_generation_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Function to check rate limit (6 hours)
CREATE OR REPLACE FUNCTION check_insight_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_generation TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT generated_at INTO last_generation
  FROM insight_generation_log
  WHERE user_id = p_user_id AND success = true
  ORDER BY generated_at DESC
  LIMIT 1;
  
  -- If no previous generation or more than 6 hours passed, allow
  IF last_generation IS NULL OR (NOW() - last_generation) >= INTERVAL '6 hours' THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get time until next allowed generation
CREATE OR REPLACE FUNCTION get_next_insight_available_at(p_user_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  last_generation TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT generated_at INTO last_generation
  FROM insight_generation_log
  WHERE user_id = p_user_id AND success = true
  ORDER BY generated_at DESC
  LIMIT 1;
  
  IF last_generation IS NULL THEN
    RETURN NOW();
  ELSE
    RETURN last_generation + INTERVAL '6 hours';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
