-- ============================================
-- TABELA DE AMIZADES - VERSÃO CORRIGIDA
-- ============================================

-- 1. Dropar tabela existente se houver (cuidado: isso apaga os dados!)
DROP TABLE IF EXISTS friendships CASCADE;

-- 2. Criar tabela de amizades com foreign keys corretas
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign keys explícitas
  CONSTRAINT fk_friendships_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friendships_friend FOREIGN KEY (friend_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Garante que não haja duplicatas (A->B)
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  
  -- Impede amizade consigo mesmo
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- 3. Índices para melhor performance
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- 4. RLS (Row Level Security)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de segurança
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
CREATE POLICY "Users can view their own friendships"
  ON friendships
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can create friendship requests" ON friendships;
CREATE POLICY "Users can create friendship requests"
  ON friendships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update friendships where they are the recipient" ON friendships;
CREATE POLICY "Users can update friendships where they are the recipient"
  ON friendships
  FOR UPDATE
  USING (auth.uid() = friend_id)
  WITH CHECK (auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can delete their own friendships" ON friendships;
CREATE POLICY "Users can delete their own friendships"
  ON friendships
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 6. Comentários
COMMENT ON TABLE friendships IS 'Gerencia relações de amizade entre usuários';
COMMENT ON COLUMN friendships.status IS 'Status da amizade: pending, accepted, rejected';

-- ============================================
-- DADOS DE TESTE (OPCIONAL)
-- ============================================
-- Descomente as linhas abaixo para criar amizades de teste
-- IMPORTANTE: Substitua os IDs pelos IDs reais dos seus usuários!

/*
-- Exemplo: Criar amizade entre dois usuários
INSERT INTO friendships (user_id, friend_id, status) VALUES
  ('SEU_USER_ID_AQUI', 'ID_DO_AMIGO_AQUI', 'accepted');
*/
