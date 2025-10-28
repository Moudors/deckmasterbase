-- Script para corrigir políticas RLS para autenticação
-- Execute no SQL Editor do Supabase

-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Políticas mais flexíveis para users
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on id" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Atualizar políticas de decks para usar string comparison
DROP POLICY IF EXISTS "Users can view their own decks" ON decks;
DROP POLICY IF EXISTS "Users can create their own decks" ON decks;
DROP POLICY IF EXISTS "Users can update their own decks" ON decks;
DROP POLICY IF EXISTS "Users can delete their own decks" ON decks;

CREATE POLICY "Enable read access for own decks" ON decks
  FOR SELECT USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Enable insert for authenticated users" ON decks
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id::text);

CREATE POLICY "Enable update for own decks" ON decks
  FOR UPDATE USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Enable delete for own decks" ON decks
  FOR DELETE USING (auth.uid()::text = owner_id::text);

-- Atualizar políticas de deck_cards
DROP POLICY IF EXISTS "Users can view cards from their decks" ON deck_cards;
DROP POLICY IF EXISTS "Users can manage cards in their decks" ON deck_cards;

CREATE POLICY "Enable read access for deck cards" ON deck_cards
  FOR SELECT USING (auth.uid()::text IN (
    SELECT owner_id::text FROM decks WHERE id = deck_id
  ));

CREATE POLICY "Enable all access for deck cards" ON deck_cards
  FOR ALL USING (auth.uid()::text IN (
    SELECT owner_id::text FROM decks WHERE id = deck_id
  ));

-- Atualizar políticas de messages
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON messages;

CREATE POLICY "Enable read access for own messages" ON messages
  FOR SELECT USING (
    auth.uid()::text = from_user_id::text OR 
    auth.uid()::text = to_user_id::text
  );

CREATE POLICY "Enable insert for authenticated users" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = from_user_id::text);

CREATE POLICY "Enable update for message recipients" ON messages
  FOR UPDATE USING (auth.uid()::text = to_user_id::text);

-- Atualizar políticas de friendships
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update their friendships" ON friendships;

CREATE POLICY "Enable read access for own friendships" ON friendships
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = friend_id::text
  );

CREATE POLICY "Enable insert for authenticated users" ON friendships
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable update for own friendships" ON friendships
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = friend_id::text
  );