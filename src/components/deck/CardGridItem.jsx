import React, { useState, useRef, memo } from "react";
import { motion } from "framer-motion";
import { useLongPress } from "use-long-press";
import { Button } from "@/components/ui/button";
import CardZoomModal from "./CardZoomModal";
import { useImageCache } from "@/hooks/useImageCache";

function CardGridItem({ 
  card, 
  onToggleAcquired, 
  onOfferTrade,
  onShowArtSelector,
  onChangeQuantity, // pode ser usado se quiser abrir DeleteQuantityDialog direto
  isViewOnly = false,
  currentUserId,
  deckOwnerId,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}) {
  const [isTransparent, setIsTransparent] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const lastTap = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // 🖼️ Cache de imagem local (IndexedDB)
  const cachedImageUrl = useImageCache(card.image_url);

  // 🔄 Swipe para direita: abre zoom
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEndSwipe = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = Math.abs(touchEndY - touchStartY.current);

    // Swipe para direita: abrir zoom (apenas se movimento horizontal > vertical)
    if (diffX > 100 && diffY < 50 && !isSelectionMode) {
      setShowZoom(true);
      return;
    }

    // Detectar duplo toque (mantém funcionalidade anterior)
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleDoubleClick();
    }
    lastTap.current = now;
  };

  // 🔄 Duplo clique: alterna transparência ou trade
  const handleDoubleClick = () => {
    if (deckOwnerId === currentUserId) {
      setIsTransparent(prev => !prev);
      onToggleAcquired?.({ ...card, acquired: !card.acquired });
    } else {
      onOfferTrade?.(card);
    }
  };

  // 🔄 Clique longo: abre direto o seletor de arte
  const bindLongPress = useLongPress(() => {
    if (!isViewOnly) {
      onShowArtSelector?.(card); // 🔑 abre direto o ArtSelector
    }
  }, { threshold: 500 });

  return (
    <>
      {/* Modal de Zoom */}
      {showZoom && (
        <CardZoomModal
          card={card}
          onClose={() => setShowZoom(false)}
        />
      )}

      <motion.div
        {...bindLongPress()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative group"
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEndSwipe}
      >
      <div className="relative rounded-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-0">
        {/* Botão de seleção para modo de deleção */}
        {isSelectionMode && (
          <div className="absolute top-2 left-2 z-20">
            <Button
              type="button"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.(card.id);
              }}
              aria-pressed={isSelected}
              aria-label={isSelected ? "Desmarcar carta" : "Selecionar carta para remoção"}
              className={`w-7 h-7 rounded-full p-0 border-2 transition-all focus:ring-0 focus:ring-offset-0 ${
                isSelected
                  ? "bg-gray-500/60 border-gray-400"
                  : "bg-gray-500/20 border-gray-500"
              }`}
            >
              <span className="sr-only">{isSelected ? "Selecionado" : "Não selecionado"}</span>
            </Button>
          </div>
        )}

        <img
          src={cachedImageUrl || card.image_url}
          alt={card.card_name}
          className={`card-image w-full h-auto rounded-lg transition-opacity duration-300 ${
            isTransparent ? "opacity-50" : "opacity-100"
          }`}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          loading="lazy"
        />

        {/* Quantidade */}
        {card.quantity > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded-full text-xs font-bold">
            x{card.quantity}
          </div>
        )}
      </div>
    </motion.div>
    </>
  );
}

// Memoiza componente - só re-renderiza se props essenciais mudarem
export default memo(CardGridItem, (prevProps, nextProps) => {
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.quantity === nextProps.card.quantity &&
    prevProps.card.acquired === nextProps.card.acquired &&
    prevProps.card.image_url === nextProps.card.image_url && // ✅ Checa mudança de imagem
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isSelectionMode === nextProps.isSelectionMode
  );
});
