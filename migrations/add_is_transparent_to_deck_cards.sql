-- Adiciona o campo is_transparent na tabela deck_cards
ALTER TABLE deck_cards ADD COLUMN is_transparent BOOLEAN DEFAULT FALSE;
