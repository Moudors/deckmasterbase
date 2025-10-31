-- Adicionar coluna display_order à tabela decks
ALTER TABLE decks 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Criar índice para melhorar performance de ordenação
CREATE INDEX IF NOT EXISTS idx_decks_display_order ON decks(owner_id, display_order);

-- Atualizar decks existentes com valores de display_order baseados na data de criação
-- Isso garante que decks antigos tenham uma ordem inicial
UPDATE decks 
SET display_order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at) as row_num
  FROM decks
) AS subquery
WHERE decks.id = subquery.id
AND decks.display_order = 0;

-- Comentário: A coluna display_order será usada para permitir que usuários
-- reordenem seus decks na página Home através de long press
