import React, { useState } from "react";

interface CardZoomModalProps {
  card: any;
  onClose: () => void;
  onAddToDeck?: (card: any) => void;
}

export default function CardZoomModal({ card, onClose, onAddToDeck }: CardZoomModalProps) {
  const [faceIndex, setFaceIndex] = useState(0);

  // Swipe para cartas dupla face
  let touchStartX = 0;
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const touchEndX = e.changedTouches[0].clientX;
    if (card.card_faces && card.card_faces.length > 1) {
      if (touchStartX - touchEndX > 50) {
        setFaceIndex((prev) => (prev + 1) % card.card_faces.length);
      } else if (touchEndX - touchStartX > 50) {
        setFaceIndex((prev) =>
          prev === 0 ? card.card_faces.length - 1 : prev - 1
        );
      }
    }
  }

  const currentFace = card.card_faces ? card.card_faces[faceIndex] : card;

  function handleAddClick() {
    if (onAddToDeck) {
      onAddToDeck(card);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Carta */}
        <div className="relative w-80 sm:w-96 overflow-hidden rounded-lg shadow-lg">
          <img
            src={currentFace.image_uris?.normal || card.image_uris?.normal}
            alt={card.name}
            className="w-full rounded-lg"
            loading="lazy"
            decoding="async"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* Botão de adicionar */}
        {onAddToDeck && (
          <button
            onClick={handleAddClick}
            className="mt-4 w-full py-2 bg-orange-600 text-white font-bold rounded hover:bg-orange-700 transition-all"
          >
            Adicionar ao Deck
          </button>
        )}
      </div>
    </div>
  );
}
