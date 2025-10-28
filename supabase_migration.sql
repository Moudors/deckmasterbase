-- Migração Firebase Firestore para Supabase PostgreSQL
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela de usuários
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- ✅ Mudando para TEXT para aceitar UIDs do Supabase Auth
  uuid UUID DEFAULT uuid_generate_v4(),  -- ✅ UUID separado para uso interno
  display_name TEXT DEFAULT '',
  email TEXT UNIQUE,
  username TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  friends JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de usernames (para controle de unicidade)
CREATE TABLE usernames (
  id TEXT PRIMARY KEY,
  uid TEXT REFERENCES users(id) ON DELETE CASCADE,  -- ✅ Mudando para TEXT
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de decks
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  format TEXT DEFAULT 'Casual',
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,  -- ✅ Mudando para TEXT
  card_count INTEGER DEFAULT 0,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de cartas nos decks
CREATE TABLE deck_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  acquired BOOLEAN DEFAULT false,
  image_url TEXT,
  mana_cost TEXT,
  type_line TEXT,
  oracle_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de amizades
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Índices para performance
CREATE INDEX idx_decks_owner_id ON decks(owner_id);
CREATE INDEX idx_deck_cards_deck_id ON deck_cards(deck_id);
CREATE INDEX idx_messages_to_user ON messages(to_user_id);
CREATE INDEX idx_messages_from_user ON messages(from_user_id);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deck_cards_updated_at BEFORE UPDATE ON deck_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Usuários só podem ver seus próprios dados
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para decks
CREATE POLICY "Users can view their own decks" ON decks
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own decks" ON decks
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own decks" ON decks
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own decks" ON decks
  FOR DELETE USING (auth.uid() = owner_id);

-- Políticas RLS para deck_cards
CREATE POLICY "Users can view cards from their decks" ON deck_cards
  FOR SELECT USING (auth.uid() IN (
    SELECT owner_id FROM decks WHERE id = deck_id
  ));

CREATE POLICY "Users can manage cards in their decks" ON deck_cards
  FOR ALL USING (auth.uid() IN (
    SELECT owner_id FROM decks WHERE id = deck_id
  ));

-- Políticas RLS para messages
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update messages they received" ON messages
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Políticas RLS para friendships
CREATE POLICY "Users can view their friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships" ON friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";