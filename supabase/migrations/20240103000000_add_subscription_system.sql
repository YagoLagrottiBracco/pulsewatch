-- Add subscription fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'canceled', 'expired')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);

-- Function to automatically set trial period on user creation
CREATE OR REPLACE FUNCTION set_trial_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Set 7-day trial for new users
  NEW.trial_ends_at := NOW() + INTERVAL '7 days';
  NEW.plan := 'free';
  NEW.subscription_status := 'trialing';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set trial period automatically
DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
CREATE TRIGGER on_user_profile_created
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_period();
