-- Phase 8: Crescimento e Retenção
-- Onboarding gamificado, indicações, reengajamento, upsell e NPS

-- ============================================
-- 1. Onboarding steps tracking
-- ============================================
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step_key)
);

ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own onboarding" ON onboarding_steps
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 2. Referral program
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'rewarded')),
  reward_type TEXT DEFAULT 'trial_extension',
  reward_days INTEGER DEFAULT 7,
  reward_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_user_id);

-- Add referral_code to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS trial_bonus_days INTEGER DEFAULT 0;

-- ============================================
-- 3. NPS surveys
-- ============================================
CREATE TABLE IF NOT EXISTS nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'auto_30d',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own NPS" ON nps_surveys
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. Reengagement tracking
-- ============================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS reengagement_sent_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nps_sent_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nps_completed BOOLEAN DEFAULT FALSE;

-- ============================================
-- 5. Upsell event tracking
-- ============================================
CREATE TABLE IF NOT EXISTS upsell_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'shown' CHECK (action IN ('shown', 'clicked', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE upsell_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own upsell events" ON upsell_events
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_nps_user ON nps_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_upsell_user ON upsell_events(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON user_profiles(last_active_at);
