// src/entities/card.ts
export interface Card {
  deck_id: string;         // ID do deck
  card_name: string;       // Nome da carta
  scryfall_id: string;     // ID da carta no Scryfall
  image_url: string;       // URL da imagem da carta
  acquired: boolean;       // Se a carta foi adquirida (transparência 0%)
  mana_cost: string;       // Custo de mana
  type_line: string;       // Tipo da carta
  quantity: number;        // Quantidade da carta
}

// Exemplo de objeto
export const exampleCard: Card = {
  deck_id: "deck-123",
  card_name: "Lightning Bolt",
  scryfall_id: "scry-abc123",
  image_url: "https://img.scryfall.com/cards/normal/en/rna/153.jpg",
  acquired: false,
  mana_cost: "{R}",
  type_line: "Instant",
  quantity: 1,
};
