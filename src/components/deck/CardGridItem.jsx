import React, { useState, useRef, memo, useEffect } from "react";
import { motion } from "framer-motion";
import { useLongPress } from "use-long-press";
import { Button } from "@/components/ui/button";
import CardZoomModal from "./CardZoomModal";
import { useImageCache } from "@/hooks/useImageCache";

// Map para preservar o estado das faces entre re-renders
const faceStateMap = new Map();

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
  
  // Usar um estado persistente para currentFaceIndex baseado no ID da carta
  const cardKey = `${card.id}-${card.scryfall_id}`;
  const [currentFaceIndex, setCurrentFaceIndex] = useState(() => {
    return faceStateMap.get(cardKey) || 0;
  });

  // Atualizar o map quando o estado muda
  useEffect(() => {
    faceStateMap.set(cardKey, currentFaceIndex);
  }, [cardKey, currentFaceIndex]);
  const lastTap = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // 🔄 Determinar se é carta dupla face
  const hasMultipleFaces = card.card_faces && card.card_faces.length > 1;
  const currentFace = hasMultipleFaces ? card.card_faces[currentFaceIndex] : card;
  
  // Prioriza image_url da carta (que pode ter sido atualizado via ArtSelector)
  // Para cartas dupla face, sempre usa a imagem da face atual
  const displayImageUrl = hasMultipleFaces 
    ? (currentFace.image_uris?.normal || currentFace.image_url)
    : (card.image_url || currentFace.image_uris?.normal || currentFace.image_url);

  // 🖼️ Cache de imagem local (IndexedDB)
  const cachedImageUrl = useImageCache(displayImageUrl);

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

  // 🔄 Alternar face da carta dupla face
  const toggleFace = (e) => {
    e.stopPropagation();
    
    if (hasMultipleFaces) {
      const newIndex = (currentFaceIndex + 1) % card.card_faces.length;
      setCurrentFaceIndex(newIndex);
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
          key={`${card.id}-${currentFaceIndex}-${displayImageUrl?.split('/').pop()}-${card.updated_at || card.scryfall_id}`}
          src={cachedImageUrl || displayImageUrl}
          alt={currentFace.name || card.card_name}
          className={`card-image w-full h-auto rounded-lg transition-opacity duration-300 ${
            isTransparent ? "opacity-50" : "opacity-100"
          }`}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          loading="lazy"
        />

        {/* Botão de alternar face (canto superior direito) */}
        {hasMultipleFaces && (
          <button
            onClick={toggleFace}
            className="absolute top-2 right-2 w-7 h-7 bg-orange-500/90 hover:bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
            aria-label="Alternar face da carta"
            title={`Face ${currentFaceIndex + 1}/${card.card_faces.length}: ${currentFace.name || 'Face ' + (currentFaceIndex + 1)}`}
            data-card-id={card.id}
            data-face-index={currentFaceIndex}
            data-testid="dual-face-toggle"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-white text-orange-500 text-xs rounded-full flex items-center justify-center font-bold leading-none">
              {currentFaceIndex + 1}
            </span>
          </button>
        )}

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
