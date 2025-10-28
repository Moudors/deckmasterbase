# Instruções para configurar tabela users no Supabase

## Passo 1: Acessar o Supabase Dashboard
1. Acesse: https://supabase.com/dashboard/project/ygzyshbfmcwegxgqcuwr
2. Vá na aba **SQL Editor**

## Passo 2: Executar o SQL
Copie e cole o seguinte código SQL e execute:

```sql
-- Remover tabela existente se houver problemas
DROP TABLE IF EXISTS users CASCADE;

-- Criar tabela users
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

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Verificar se funcionou
SELECT * FROM users LIMIT 1;
```

## Passo 3: Testar no app
1. Abra o console do navegador (F12)
2. Faça login com Google
3. Observe os logs detalhados que foram adicionados

## Logs esperados:
- `🔄 createUserDocumentFromAuth - Criando/verificando documento do usuário:`
- `🔍 Verificando se usuário já existe...`
- `👤 Usuário não existe, criando novo documento...`
- `✅ Usuário criado com sucesso:`