import React from "react";
import CardItem from "./CardItem";

interface SearchResultsGridProps {
  cards: any[];
  onCardLongPress: (card: any) => void;
  onCardDoubleClick?: (card: any) => void;
}

export default function SearchResultsGrid({ cards, onCardLongPress, onCardDoubleClick }: SearchResultsGridProps) {
  if (!cards || cards.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        Nenhuma carta encontrada.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 overflow-y-auto h-full p-2 bg-gray-900">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          onLongPress={() => onCardLongPress(card)}
          onDoubleClick={onCardDoubleClick ? () => onCardDoubleClick(card) : undefined}
        />
      ))}
    </div>
  );
}
