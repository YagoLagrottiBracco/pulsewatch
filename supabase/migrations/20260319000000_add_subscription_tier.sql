-- Add subscription_tier column to user_profiles
-- This column is used throughout the app to distinguish free/premium/ultimate tiers
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium', 'ultimate'));

-- Migrate existing data: map old 'plan' values to new tier names
-- 'free' -> 'free', 'pro' -> 'premium'
UPDATE public.user_profiles
SET subscription_tier = CASE
  WHEN plan = 'pro' THEN 'premium'
  ELSE 'free'
END
WHERE subscription_tier = 'free';

COMMENT ON COLUMN public.user_profiles.subscription_tier IS 'Plano do usuário: free, premium ou ultimate.';
