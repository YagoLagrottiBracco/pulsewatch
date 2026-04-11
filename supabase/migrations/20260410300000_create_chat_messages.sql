-- Phase 14: Chat com Dados
-- Tabela para histórico de mensagens de chat e rate limiting diário.
-- answer pode ser NULL se o streaming falhar antes de completar.

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate limit: contar mensagens de hoje por usuário
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_date
  ON chat_messages(user_id, created_at);

-- RLS: usuário vê apenas suas próprias mensagens
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_owner" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);
