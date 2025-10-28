-- Script SQL para limpar e consolidar as colunas de cover image
-- Execute no SQL Editor do Supabase Dashboard

-- ==========================================
-- CONSOLIDAR COLUNAS DE COVER IMAGE
-- ==========================================

-- 1. Primeiro, vamos ver o que temos nas duas colunas
SELECT 
    id,
    name,
    cover_image,
    cover_image_url,
    CASE 
        WHEN cover_image IS NOT NULL AND cover_image != '' THEN 'cover_image tem dados'
        WHEN cover_image_url IS NOT NULL AND cover_image_url != '' THEN 'cover_image_url tem dados'
        ELSE 'nenhuma tem dados'
    END as status_imagens
FROM decks;

-- 2. Consolidar dados (se cover_image tiver dados, mover para cover_image_url)
UPDATE decks 
SET cover_image_url = COALESCE(NULLIF(cover_image_url, ''), NULLIF(cover_image, ''))
WHERE cover_image IS NOT NULL AND cover_image != '';

-- 3. Remover a coluna cover_image duplicada
ALTER TABLE decks DROP COLUMN IF EXISTS cover_image;

-- 4. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'decks' 
AND table_schema = 'public'
AND column_name LIKE '%cover%'
ORDER BY ordinal_position;

-- ==========================================
-- VERIFICAR INTEGRIDADE DOS DADOS
-- ==========================================

-- Ver todos os decks após a limpeza
SELECT 
    id,
    name,
    format,
    owner_id,
    cover_image_url,
    created_at
FROM decks 
ORDER BY created_at DESC;

-- ==========================================
-- OPCIONAL: LIMPAR VALORES VAZIOS
-- ==========================================

-- Converter strings vazias em NULL para consistência
UPDATE decks 
SET cover_image_url = NULL 
WHERE cover_image_url = '';

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

SELECT 
    'Limpeza concluída!' as resultado,
    COUNT(*) as total_decks,
    COUNT(cover_image_url) as decks_com_imagem
FROM decks;