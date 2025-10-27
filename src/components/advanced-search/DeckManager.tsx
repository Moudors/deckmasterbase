import React, { createContext, useContext, useState, ReactNode } from "react";

interface Deck {
  name: string;
  cards: any[];
}

interface DeckContextType {
  decks: Deck[];
  createDeck: (name: string, firstCard?: any) => void;
  addToDeck: (deckName: string, card: any) => void;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export function DeckProvider({ children }: { children: ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([]);

  function createDeck(name: string, firstCard?: any) {
    if (!name.trim()) return;
    const newDeck: Deck = { name, cards: firstCard ? [firstCard] : [] };
    setDecks((prev) => [...prev, newDeck]);
  }

  function addToDeck(deckName: string, card: any) {
    setDecks((prev) =>
      prev.map((deck) =>
        deck.name === deckName
          ? { ...deck, cards: [...deck.cards, card] }
          : deck
      )
    );
  }

  return (
    <DeckContext.Provider value={{ decks, createDeck, addToDeck }}>
      {children}
    </DeckContext.Provider>
  );
}

export function useDecks() {
  const context = useContext(DeckContext);
  if (!context) {
    throw new Error("useDecks deve ser usado dentro de um DeckProvider");
  }
  return context;
}
