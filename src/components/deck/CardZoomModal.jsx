import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function CardZoomModal({ card, onClose }) {
  const [faceIndex, setFaceIndex] = useState(0);
  let touchStartX = 0;

  // Bloquear scroll e interações de fundo quando modal aberto
  useEffect(() => {
    // Salvar overflow original
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    
    // Bloquear scroll e touch
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    
    // Restaurar ao desmontar
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  // Detectar swipe para esquerda para fechar
  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;

    // Swipe para esquerda: fechar modal
    if (diff < -100) {
      onClose();
      return;
    }
  }

  // Alternar face com botão
  const toggleFace = () => {
    setFaceIndex((prev) => (prev + 1) % card.card_faces.length);
  };

  const currentFace = card.card_faces ? card.card_faces[faceIndex] : card;
  const isFlipCard = card.layout === "flip";
  const shouldRotate = isFlipCard && faceIndex === 1;
  const imageUrl = isFlipCard 
    ? (card.image_uris?.normal || card.image_url)
    : (currentFace.image_uris?.normal || currentFace.image_url || card.image_uris?.normal || card.image_url);

  // Debug flip cards
  console.log('🔍 CardZoomModal Debug:', {
    cardName: card.card_name || card.name,
    layout: card.layout,
    isFlipCard,
    faceIndex,
    shouldRotate,
    hasCardFaces: !!card.card_faces
  });

  // Renderizar o modal usando Portal para garantir opacity: 1
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        style={{ touchAction: 'auto', opacity: 1 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative max-w-md w-full"
          style={{ touchAction: 'auto', opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={card.card_name || card.name}
            className="w-full rounded-lg shadow-2xl transition-transform duration-500"
            style={{ 
              opacity: 1,
              transform: shouldRotate ? 'rotate(180deg)' : 'rotate(0deg)',
              transformOrigin: 'center center'
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />

          {/* Blue badge for flip cards */}
          {isFlipCard && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {faceIndex === 0 ? '↻' : '↺'} Flip
            </div>
          )}

          {/* Botão de alternar face (canto inferior direito) */}
          {card.card_faces && card.card_faces.length > 1 && (
            <button
              onClick={toggleFace}
              className={`absolute -bottom-1 -right-1 w-10 h-10 ${isFlipCard ? 'bg-blue-500/90 hover:bg-blue-500' : 'bg-white/40 hover:bg-white/60'} rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95`}
              aria-label={isFlipCard ? "Flip card (girar 180°)" : "Alternar face da carta"}
              title={isFlipCard ? "Flip" : "Virar carta"}
            >
              {isFlipCard ? (
                <span className="text-white text-lg font-bold">{faceIndex === 0 ? '↻' : '↺'}</span>
              ) : (
                <svg
                  className="w-5 h-5 text-gray-800"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {/* Ícone de rotação/flip */}
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className={`absolute -top-1 -right-1 w-5 h-5 ${isFlipCard ? 'bg-white text-blue-500' : 'bg-orange-500 text-white'} text-xs rounded-full flex items-center justify-center font-bold`}>
                {faceIndex + 1}
              </span>
            </button>
          )}

          {/* Dica de swipe */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
            Swipe ← para fechar
          </div>

          {/* Botão de fechar (desktop) */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
