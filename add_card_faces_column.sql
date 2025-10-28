-- Script para adicionar coluna card_faces à tabela deck_cards
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Adicionar a coluna card_faces como JSONB para armazenar dados de cartas de dupla face
ALTER TABLE deck_cards 
ADD COLUMN IF NOT EXISTS card_faces JSONB DEFAULT NULL;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN deck_cards.card_faces IS 'Dados das faces de cartas dupla face (transform, modal, etc.) em formato JSON';

-- 3. Criar índice para consultas em card_faces (opcional, para performance)
CREATE INDEX IF NOT EXISTS idx_deck_cards_card_faces ON deck_cards USING GIN (card_faces);

-- 4. Verificar se a coluna foi adicionada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deck_cards' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Testar inserção com card_faces (exemplo)
-- Este é apenas um exemplo - NÃO execute esta parte, é só para referência
/*
INSERT INTO deck_cards (
    deck_id,
    card_name,
    quantity,
    card_faces,
    image_url,
    mana_cost,
    type_line,
    oracle_text
) VALUES (
    'uuid-do-deck-aqui',
    'Delver of Secrets',
    1,
    '[
        {
            "name": "Delver of Secrets",
            "mana_cost": "{U}",
            "type_line": "Creature — Human Wizard",
            "oracle_text": "At the beginning of your upkeep, look at the top card of your library. You may reveal that card. If an instant or sorcery card is revealed this way, transform Delver of Secrets.",
            "power": "1",
            "toughness": "1",
            "image_uris": {
                "normal": "https://cards.scryfall.io/normal/front/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg"
            }
        },
        {
            "name": "Insectile Aberration",
            "type_line": "Creature — Human Insect",
            "oracle_text": "Flying",
            "power": "3",
            "toughness": "2",
            "image_uris": {
                "normal": "https://cards.scryfall.io/normal/back/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg"
            }
        }
    ]'::jsonb,
    'https://cards.scryfall.io/normal/front/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg',
    '{U}',
    'Creature — Human Wizard',
    'At the beginning of your upkeep, look at the top card of your library. You may reveal that card. If an instant or sorcery card is revealed this way, transform Delver of Secrets.'
);
*/