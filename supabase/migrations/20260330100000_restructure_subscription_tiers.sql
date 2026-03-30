-- Fase 1: Reestruturação dos Planos
-- Migra: free/premium/ultimate → free/pro/business/agency

-- 1. Remover constraint antiga
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_subscription_tier_check;

-- 2. Migrar dados ANTES de adicionar nova constraint
UPDATE user_profiles SET subscription_tier = 'pro'      WHERE subscription_tier = 'premium';
UPDATE user_profiles SET subscription_tier = 'business' WHERE subscription_tier = 'ultimate';

-- 3. Atualizar campo legado `plan`
UPDATE user_profiles SET plan = 'pro'  WHERE subscription_tier IN ('pro', 'business', 'agency');
UPDATE user_profiles SET plan = 'free' WHERE subscription_tier = 'free';

-- 4. Adicionar nova constraint com os 4 tiers
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'business', 'agency'));
