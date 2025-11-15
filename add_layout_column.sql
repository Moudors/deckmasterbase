-- Adicionar coluna 'layout' na tabela deck_cards para suportar flip cards
-- Layouts possíveis: normal, split, flip, transform, modal, adventure, etc.

-- Adicionar a coluna layout (permite NULL temporariamente para cartas existentes)
ALTER TABLE deck_cards
ADD COLUMN IF NOT EXISTS layout TEXT DEFAULT 'normal';

-- Criar índice para consultas por layout (útil para filtros futuros)
CREATE INDEX IF NOT EXISTS idx_deck_cards_layout ON deck_cards(layout);

-- Comentário na coluna para documentação
COMMENT ON COLUMN deck_cards.layout IS 'Layout da carta (normal, flip, transform, modal, split, adventure, etc.) baseado na API Scryfall';

-- Atualizar cartas existentes sem layout para 'normal' (opcional)
UPDATE deck_cards 
SET layout = 'normal' 
WHERE layout IS NULL OR layout = '';

-- Resultado esperado
SELECT 
  COUNT(*) as total_cards,
  COUNT(CASE WHEN layout = 'flip' THEN 1 END) as flip_cards,
  COUNT(CASE WHEN layout = 'transform' THEN 1 END) as transform_cards,
  COUNT(CASE WHEN layout = 'modal' THEN 1 END) as modal_cards,
  COUNT(CASE WHEN layout = 'normal' THEN 1 END) as normal_cards
FROM deck_cards;
