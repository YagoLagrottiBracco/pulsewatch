-- Fase 1: Reestruturação dos Planos
-- Migra: free/premium/ultimate → free/pro/business/agency

-- 1. Remover constraint antiga e adicionar nova com os 4 tiers
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_subscription_tier_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'business', 'agency'));

-- 2. Migrar dados existentes
UPDATE user_profiles SET subscription_tier = 'pro'      WHERE subscription_tier = 'premium';
UPDATE user_profiles SET subscription_tier = 'business' WHERE subscription_tier = 'ultimate';

-- 3. Atualizar campo legado `plan` para refletir os novos tiers
-- (mantido por compatibilidade, mas subscription_tier é o campo canônico)
UPDATE user_profiles SET plan = 'pro' WHERE subscription_tier IN ('pro', 'business', 'agency');
UPDATE user_profiles SET plan = 'free' WHERE subscription_tier = 'free';
