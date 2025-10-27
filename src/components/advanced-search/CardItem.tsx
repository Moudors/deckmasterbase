import React, { useRef, memo } from "react";

interface CardItemProps {
  card: any;
  onLongPress: (card: any) => void;
  onDoubleClick?: (card: any) => void;
}

function CardItem({ card, onLongPress, onDoubleClick }: CardItemProps) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Swipe para direita: abre zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = Math.abs(touchEndY - touchStartY.current);

    // Swipe para direita: abrir zoom (apenas se movimento horizontal > vertical)
    if (diffX > 100 && diffY < 50) {
      onLongPress(card);
    }
  };

  // Clique simples também abre
  const handleClick = () => {
    onLongPress(card);
  };

  // Duplo clique abre seletor de deck
  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(card);
    }
  };

  return (
    <div
      className="relative cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small}
        alt={card.name}
        className="w-full rounded shadow"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

// Memoiza componente - só re-renderiza se card.id mudar
export default memo(CardItem, (prevProps, nextProps) => {
  return prevProps.card.id === nextProps.card.id;
});
