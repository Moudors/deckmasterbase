-- Script SQL para criar tabela users no Supabase
-- Execute este comando no SQL Editor do Supabase Dashboard

-- Primeiro, remover a tabela se ela já existir
DROP TABLE IF EXISTS users CASCADE;

-- Criar a tabela users com a estrutura correta
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4(),
  display_name TEXT DEFAULT '',
  email TEXT UNIQUE,
  username TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  friends JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam/editem apenas seus próprios dados
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Verificar se a tabela foi criada
SELECT * FROM users LIMIT 1;