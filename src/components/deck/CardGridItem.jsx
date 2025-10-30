import React, { useState, useRef, memo, useEffect } from "react";
import { motion } from "framer-motion";
import { useCardSwipe } from "./CardSwipeHandler";
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
  onToggleSelect,
  onDoubleClick, // Para abrir modal de trade
  hasGreenBorder = false, // Indica que amigos querem essa carta
  onLongPress // Custom long press handler (para deck de amigo)
}) {
  const [isTransparent, setIsTransparent] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  
  // 🔍 DEBUG: Verificar se está recebendo hasGreenBorder
  useEffect(() => {
    if (hasGreenBorder) {
      console.log("🟢 CardGridItem - CARTA COM GREEN BORDER:", {
        cardName: card.card_name,
        scryfallId: card.scryfall_id,
        hasGreenBorder,
        isSelectionMode
      });
    }
  }, [hasGreenBorder, card.card_name, card.scryfall_id, isSelectionMode]);
  
  // Usar um estado persistente para currentFaceIndex baseado no ID da carta
  const cardKey = `${card.id}-${card.scryfall_id}`;
  const [currentFaceIndex, setCurrentFaceIndex] = useState(() => {
    return faceStateMap.get(cardKey) || 0;
  });

  // Atualizar o map quando o estado muda
  useEffect(() => {
    faceStateMap.set(cardKey, currentFaceIndex);
  }, [cardKey, currentFaceIndex]);

  // 🔄 Long press manual com timeout
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  const handlePressStart = (e) => {
    if (isViewOnly || isSelectionMode) return;
    
    longPressTriggered.current = false;
    console.log('[DEBUG] Long press iniciado', { hasCustomHandler: !!onLongPress });
    
    longPressTimer.current = setTimeout(() => {
      console.log('[DEBUG] Long press detectado', { hasCustomHandler: !!onLongPress });
      longPressTriggered.current = true;
      
      // Se tem handler customizado (deck de amigo), usa ele
      if (onLongPress) {
        onLongPress(card);
      } else {
        // Senão, abre o seletor de arte (comportamento padrão)
        onShowArtSelector?.(card);
      }
    }, 500); // 500ms
  };

  const handlePressEnd = (e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (longPressTriggered.current) {
      console.log('[DEBUG] Long press completado');
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handlePressCancel = () => {
    if (longPressTimer.current) {
      console.log('[DEBUG] Long press cancelado');
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressTriggered.current = false;
  };

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // 🔄 Determinar se é carta dupla face
  const hasMultipleFaces = card.card_faces && card.card_faces.length > 1;
  const currentFace = hasMultipleFaces ? card.card_faces[currentFaceIndex] : card;
  
  // DEBUG COMPLETO
  if (hasMultipleFaces) {
    console.log("� DEBUG FACES COMPLETO:", {
      cardName: card.card_name,
      currentFaceIndex,
      allFaces: card.card_faces,
      currentFace: currentFace,
      cardImageUrl: card.image_url
    });
  }
  
  // �🖼️ Lógica de URL de imagem para diferentes tipos de cartas dupla face
  let displayImageUrl;
  
  if (hasMultipleFaces) {
    // Para cartas dupla face, tentar pegar a imagem da face atual
    // Suporta diferentes layouts do Scryfall (transform, modal_dfc, etc)
    displayImageUrl = 
      currentFace.image_uris?.normal ||       // Scryfall padrão (cada face tem image_uris)
      currentFace.image_uris?.large ||
      currentFace.image_uris?.png ||
      currentFace.image_url ||                 // Backup: image_url salva no banco
      card.image_url;                          // Fallback: imagem principal do card
  } else {
    // Para cartas normais, prioriza image_url (pode ter sido alterado via ArtSelector)
    displayImageUrl = 
      card.image_url || 
      card.image_uris?.normal || 
      card.image_uris?.large ||
      card.image_uris?.png;
  }

  // 🖼️ Cache de imagem local (IndexedDB)
  const cachedImageUrl = useImageCache(displayImageUrl);
    const { handleTouchStart, handleTouchEnd } = useCardSwipe({
      onSwipeRight: () => {
        if (!isSelectionMode) setShowZoom(true);
      },
      onDoubleTap: () => {
        handleDoubleClick();
      }
    });
  
    // Long press para menu de arte - REMOVIDO (usando manual agora)

  // removido: funções antigas de touch

  // 🔄 Duplo clique: alterna transparência, trade, ou modal de trade
  const handleDoubleClick = (e) => {
    // Se for prop onDoubleClick (Trade), usa ela
    if (onDoubleClick) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      onDoubleClick(card);
      return;
    }
    
    // Comportamento padrão
    if (deckOwnerId === currentUserId) {
      setIsTransparent(prev => !prev);
      onToggleAcquired?.({ ...card, acquired: !card.acquired });
    } else {
      onOfferTrade?.(card);
    }
  };

  // 🔄 Alternar face da carta dupla face
  // Alterna a face da carta dupla face
  const toggleFace = () => {
    console.log("🔄 toggleFace chamado", { 
      hasMultipleFaces, 
      currentFaceIndex, 
      totalFaces: card.card_faces?.length,
      cardName: card.card_name 
    });
    if (hasMultipleFaces) {
      const newIndex = (currentFaceIndex + 1) % card.card_faces.length;
      console.log("🔄 Mudando para face:", newIndex);
      setCurrentFaceIndex(newIndex);
    }
  };

  // 🔄 Clique longo: abre direto o seletor de arte
  // (Removido: duplicata de bindLongPress)

  // 🔍 DEBUG DIRETO NO RENDER
  console.log("🔍 CardGridItem RENDER:", {
    cardName: card.card_name,
    hasGreenBorder,
    willRenderGreenCircle: hasGreenBorder === true,
    hasGreenBorderType: typeof hasGreenBorder,
    hasGreenBorderValue: JSON.stringify(hasGreenBorder)
  });

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
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  className="relative group"
  onDoubleClick={hasGreenBorder ? handleDoubleClick : undefined}
      >
        {/* Bolinha verde - indica que amigos querem esta carta */}
        {hasGreenBorder && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDoubleClick?.(card);
            }}
            aria-label="Ver amigos interessados"
            className="absolute top-1 left-1 z-50 w-6 h-6 rounded-full bg-green-500 bg-opacity-80 border-2 border-white shadow-lg hover:bg-green-600 hover:bg-opacity-90 hover:scale-110 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
            style={{ 
              boxShadow: '0 0 0 2px white, 0 0 10px rgba(34, 197, 94, 0.5)',
              pointerEvents: 'auto'
            }}
            title="Clique para ver quem quer essa carta"
          >
            <span className="sr-only">Amigos querem essa carta</span>
          </button>
        )}

      <div 
        className="relative rounded-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-0"
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressCancel}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressCancel}
      >
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("🔘 Botão de face clicado!");
              toggleFace();
            }}
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
    prevProps.card.image_url === nextProps.card.image_url &&
    JSON.stringify(prevProps.card.card_faces) === JSON.stringify(nextProps.card.card_faces) &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isSelectionMode === nextProps.isSelectionMode &&
    prevProps.hasGreenBorder === nextProps.hasGreenBorder // ✅ CRÍTICO: Verifica green border!
  );
});
