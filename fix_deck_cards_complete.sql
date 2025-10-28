-- Script SQL completo para corrigir estrutura da tabela deck_cards
-- Execute no SQL Editor do Supabase Dashboard

-- ==========================================
-- PARTE 1: ADICIONAR COLUNA CARD_FACES
-- ==========================================

-- Adicionar coluna card_faces se ela não existir
ALTER TABLE deck_cards 
ADD COLUMN IF NOT EXISTS card_faces JSONB DEFAULT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN deck_cards.card_faces IS 'Dados das faces de cartas dupla face (transform, modal, adventure, etc.) em formato JSON conforme API Scryfall';

-- ==========================================
-- PARTE 2: VERIFICAR OUTRAS COLUNAS OPCIONAIS
-- ==========================================

-- Adicionar outras colunas que podem estar faltando
ALTER TABLE deck_cards 
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color_identity JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cmc INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS set_code TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS collector_number TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS scryfall_id UUID DEFAULT NULL;

-- Comentários para as novas colunas
COMMENT ON COLUMN deck_cards.colors IS 'Cores da carta conforme Scryfall API';
COMMENT ON COLUMN deck_cards.color_identity IS 'Identidade de cor da carta para formato Commander';
COMMENT ON COLUMN deck_cards.cmc IS 'Custo de mana convertido da carta';
COMMENT ON COLUMN deck_cards.rarity IS 'Raridade da carta (common, uncommon, rare, mythic)';
COMMENT ON COLUMN deck_cards.set_code IS 'Código do set/expansão da carta';
COMMENT ON COLUMN deck_cards.collector_number IS 'Número colecionador da carta no set';
COMMENT ON COLUMN deck_cards.scryfall_id IS 'ID único da carta no Scryfall para referência';

-- ==========================================
-- PARTE 3: CRIAR ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índice GIN para busca em card_faces (cartas dupla face)
CREATE INDEX IF NOT EXISTS idx_deck_cards_card_faces ON deck_cards USING GIN (card_faces);

-- Índice para busca por nome de carta
CREATE INDEX IF NOT EXISTS idx_deck_cards_card_name ON deck_cards (card_name);

-- Índice para busca por scryfall_id
CREATE INDEX IF NOT EXISTS idx_deck_cards_scryfall_id ON deck_cards (scryfall_id);

-- Índice composto para deck_id + card_name (consultas comuns)
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_card ON deck_cards (deck_id, card_name);

-- ==========================================
-- PARTE 4: VERIFICAR ESTRUTURA FINAL
-- ==========================================

-- Mostrar todas as colunas da tabela deck_cards
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'deck_cards' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar índices da tabela
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'deck_cards' 
AND schemaname = 'public';

-- ==========================================
-- PARTE 5: TESTE DE FUNCIONALIDADE
-- ==========================================

-- Teste básico de inserção com card_faces (apenas para validar estrutura)
DO $$
DECLARE
    test_deck_id UUID;
BEGIN
    -- Criar um deck temporário para teste
    INSERT INTO decks (owner_id, name, format, cover_image_url)
    VALUES ('00000000-0000-0000-0000-000000000001', '__TESTE_ESTRUTURA__', 'Commander', '')
    RETURNING id INTO test_deck_id;
    
    -- Inserir carta de teste com card_faces
    INSERT INTO deck_cards (
        deck_id,
        card_name,
        quantity,
        card_faces,
        colors,
        color_identity,
        cmc,
        rarity,
        scryfall_id
    ) VALUES (
        test_deck_id,
        'Delver of Secrets // Insectile Aberration',
        1,
        '[
            {
                "name": "Delver of Secrets",
                "mana_cost": "{U}",
                "type_line": "Creature — Human Wizard",
                "oracle_text": "At the beginning of your upkeep, look at the top card of your library.",
                "power": "1",
                "toughness": "1"
            },
            {
                "name": "Insectile Aberration",
                "type_line": "Creature — Human Insect",
                "oracle_text": "Flying",
                "power": "3",
                "toughness": "2"
            }
        ]'::jsonb,
        '["U"]'::jsonb,
        '["U"]'::jsonb,
        1,
        'common',
        '11bf83bb-c95b-4b4f-9a56-ce7a1816307a'::uuid
    );
    
    -- Verificar se a inserção funcionou
    IF FOUND THEN
        RAISE NOTICE 'SUCESSO: Estrutura da tabela deck_cards está correta!';
    END IF;
    
    -- Limpar dados de teste
    DELETE FROM decks WHERE name = '__TESTE_ESTRUTURA__';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO no teste: %', SQLERRM;
        -- Tentar limpar mesmo com erro
        DELETE FROM decks WHERE name = '__TESTE_ESTRUTURA__';
END $$;

-- ==========================================
-- FINALIZAÇÃO
-- ==========================================

-- Mensagem de sucesso
SELECT 'Estrutura da tabela deck_cards atualizada com sucesso!' as resultado;