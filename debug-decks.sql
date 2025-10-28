-- Script SQL para debugar o sistema de decks
-- Execute no SQL Editor do Supabase Dashboard

-- ==========================================
-- 1. VERIFICAR ESTRUTURA DA TABELA DECKS
-- ==========================================

-- Mostrar estrutura da tabela decks
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'decks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==========================================
-- 2. VERIFICAR TODOS OS DECKS (ADMIN VIEW)
-- ==========================================

-- Ver todos os decks (ignore RLS por enquanto)
SELECT 
    id,
    name,
    format,
    owner_id,
    cover_image_url,
    created_at,
    updated_at
FROM decks 
ORDER BY created_at DESC;

-- ==========================================
-- 3. VERIFICAR USUÁRIO ATUAL
-- ==========================================

-- Mostrar o usuário atual autenticado
SELECT 
    'Usuário atual:' as info,
    auth.uid() as user_id,
    auth.email() as user_email,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'Autenticado'
        ELSE 'NÃO autenticado'
    END as status;

-- ==========================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ==========================================

-- Mostrar políticas RLS da tabela decks
SELECT 
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
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'decks';

-- ==========================================
-- 5. BUSCAR DECKS DO USUÁRIO ATUAL (COM RLS)
-- ==========================================

-- Esta consulta deve retornar apenas os decks do usuário autenticado
SELECT 
    id,
    name,
    format,
    owner_id,
    cover_image_url,
    created_at,
    CASE 
        WHEN owner_id = auth.uid() THEN 'CORRETO'
        ELSE 'INCORRETO - Owner ID não corresponde'
    END as ownership_check
FROM decks 
WHERE owner_id = auth.uid()
ORDER BY created_at DESC;

-- ==========================================
-- 6. DIAGNÓSTICO DE PROBLEMAS COMUNS
-- ==========================================

-- Verificar se há decks com owner_id diferente do user atual
SELECT 
    'Decks com owner_id diferente do usuário atual:' as diagnostico,
    COUNT(*) as quantidade
FROM decks 
WHERE owner_id != auth.uid();

-- Verificar se há decks sem owner_id
SELECT 
    'Decks sem owner_id:' as diagnostico,
    COUNT(*) as quantidade
FROM decks 
WHERE owner_id IS NULL;

-- ==========================================
-- 7. TESTE DE INSERÇÃO (OPCIONAL)
-- ==========================================

-- CUIDADO: Este comando vai criar um deck de teste
-- Descomente apenas se quiser testar a inserção

/*
INSERT INTO decks (name, format, owner_id, cover_image_url)
VALUES (
    'Deck Teste Debug ' || EXTRACT(EPOCH FROM NOW()),
    'Commander',
    auth.uid(),
    ''
)
RETURNING id, name, owner_id, created_at;
*/

-- ==========================================
-- INSTRUÇÕES DE USO
-- ==========================================

SELECT 'INSTRUÇÕES:' as titulo, '
1. Execute cada seção separadamente para debug passo a passo
2. Verifique se auth.uid() retorna um valor válido
3. Verifique se existem decks na tabela
4. Verifique se o owner_id dos decks corresponde ao auth.uid()
5. Se não há decks, teste a inserção (descomente a seção 7)
6. Verifique se as políticas RLS estão configuradas corretamente
' as instrucoes;