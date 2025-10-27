// src/entities/deck.ts
export interface Deck {
  name: string;              // Nome do deck
  format: "Standard" | "Modern" | "Commander" | "Legacy" | "Vintage" | "Pioneer" | "Pauper" | "Historic" | "Casual"; // Formato do deck
  color_identity?: string;   // Cores do deck (opcional)
  card_count?: number;       // Número total de cartas (opcional)
  cover_image_url?: string;  // URL da imagem de capa do deck (opcional)
}

// Exemplo de objeto
export const exampleDeck: Deck = {
  name: "Meu Deck de Teste",
  format: "Commander",
  color_identity: "GUR", // Verde, Azul, Vermelho
  card_count: 100,
  cover_image_url: "https://exemplo.com/capa.jpg",
};
