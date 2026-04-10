-- Phase 13: Export e Compartilhamento
-- Tabela para links compartilháveis de insights.
-- Token é público (no URL), user_id é o dono, expires_at define validade.
-- revoked_at NULL = ativo, preenchido = revogado.

CREATE TABLE IF NOT EXISTS shared_insights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT NOT NULL UNIQUE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id UUID NOT NULL REFERENCES insight_generation_log(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Busca rápida por token (endpoint público)
CREATE INDEX IF NOT EXISTS idx_shared_insights_token ON shared_insights(token);
-- Lista de links por usuário (painel de gerenciamento)
CREATE INDEX IF NOT EXISTS idx_shared_insights_user_id ON shared_insights(user_id);

-- RLS: usuário vê e gerencia apenas seus próprios links
ALTER TABLE shared_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_insights_owner" ON shared_insights
  FOR ALL USING (auth.uid() = user_id);
