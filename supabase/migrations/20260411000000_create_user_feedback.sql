-- Tabela de feedbacks dos usuários
CREATE TABLE user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'compliment', 'other')),
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem enviar feedback
CREATE POLICY "Users can submit feedback" ON user_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver seus próprios feedbacks
CREATE POLICY "Users can view own feedback" ON user_feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Admins podem atualizar qualquer feedback
CREATE POLICY "Admins can update feedback" ON user_feedback
  FOR UPDATE TO authenticated
  USING (is_admin());
