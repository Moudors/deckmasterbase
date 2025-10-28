-- Script SQL para corrigir políticas RLS da tabela decks
-- Execute no SQL Editor do Supabase Dashboard

-- ==========================================
-- VERIFICAR POLÍTICAS EXISTENTES
-- ==========================================

-- Mostrar políticas atuais da tabela decks
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'decks';

-- ==========================================
-- REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- ==========================================

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Users can view their own decks" ON decks;
DROP POLICY IF EXISTS "Users can insert their own decks" ON decks;
DROP POLICY IF EXISTS "Users can update their own decks" ON decks;
DROP POLICY IF EXISTS "Users can delete their own decks" ON decks;

-- Políticas alternativas que podem existir
DROP POLICY IF EXISTS "Enable read access for users based on owner_id" ON decks;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON decks;
DROP POLICY IF EXISTS "Enable update for users based on owner_id" ON decks;
DROP POLICY IF EXISTS "Enable delete for users based on owner_id" ON decks;

-- ==========================================
-- CRIAR POLÍTICAS RLS CORRETAS
-- ==========================================

-- Política para SELECT (visualizar decks próprios)
CREATE POLICY "Users can view their own decks" ON decks
    FOR SELECT USING (auth.uid() = owner_id);

-- Política para INSERT (criar novos decks)
CREATE POLICY "Users can insert their own decks" ON decks
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Política para UPDATE (atualizar decks próprios)
CREATE POLICY "Users can update their own decks" ON decks
    FOR UPDATE USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Política para DELETE (deletar decks próprios)
CREATE POLICY "Users can delete their own decks" ON decks
    FOR DELETE USING (auth.uid() = owner_id);

-- ==========================================
-- VERIFICAR RLS ESTÁ HABILITADO
-- ==========================================

-- Habilitar RLS na tabela decks se não estiver
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- VERIFICAR ESTRUTURA FINAL
-- ==========================================

-- Mostrar políticas após criação
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'decks'
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'decks';

-- ==========================================
-- TESTE DE FUNCIONALIDADE
-- ==========================================

-- Verificar se um usuário autenticado pode inserir
-- (Este teste só funcionará se executado com um usuário autenticado)
SELECT 
    'Políticas RLS configuradas corretamente para tabela decks!' as resultado,
    auth.uid() as usuario_atual,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'Usuário autenticado - pode criar decks'
        ELSE 'Usuário não autenticado - faça login primeiro'
    END as status_auth;

-- ==========================================
-- INSTRUÇÕES ADICIONAIS
-- ==========================================

-- IMPORTANTE: Para que a criação de decks funcione, certifique-se de que:
-- 1. O usuário está autenticado (auth.uid() não é null)
-- 2. O owner_id do deck corresponde ao auth.uid()
-- 3. As políticas RLS estão permitindo a operação

SELECT 'IMPORTANTE: Certifique-se de estar logado na aplicação antes de criar decks!' as instrucao;