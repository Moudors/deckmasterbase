-- Script SQL para adicionar coluna cover_image_url na tabela decks
-- Execute no SQL Editor do Supabase Dashboard

-- ==========================================
-- ADICIONAR COLUNA COVER_IMAGE_URL
-- ==========================================

-- Adicionar coluna cover_image_url se ela não existir
ALTER TABLE decks 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN decks.cover_image_url IS 'URL da imagem de capa do deck (opcional)';

-- ==========================================
-- VERIFICAR ESTRUTURA FINAL
-- ==========================================

-- Mostrar todas as colunas da tabela decks
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'decks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==========================================
-- TESTE DE FUNCIONALIDADE
-- ==========================================

-- Teste básico de inserção com cover_image_url (apenas para validar estrutura)
DO $$
DECLARE
    test_deck_id UUID;
BEGIN
    -- Criar um deck temporário para teste
    INSERT INTO decks (owner_id, name, format, cover_image_url)
    VALUES ('00000000-0000-0000-0000-000000000001', '__TESTE_COVER_URL__', 'Commander', 'https://example.com/image.jpg')
    RETURNING id INTO test_deck_id;
    
    -- Verificar se a inserção funcionou
    IF FOUND THEN
        RAISE NOTICE 'SUCESSO: Coluna cover_image_url adicionada com sucesso!';
    END IF;
    
    -- Limpar dados de teste
    DELETE FROM decks WHERE name = '__TESTE_COVER_URL__';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO no teste: %', SQLERRM;
        -- Tentar limpar mesmo com erro
        DELETE FROM decks WHERE name = '__TESTE_COVER_URL__';
END $$;

-- ==========================================
-- FINALIZAÇÃO
-- ==========================================

-- Mensagem de sucesso
SELECT 'Coluna cover_image_url adicionada à tabela decks com sucesso!' as resultado;