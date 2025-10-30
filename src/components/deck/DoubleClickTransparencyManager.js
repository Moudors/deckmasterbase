// src/components/deck/DoubleClickTransparencyManager.js
// Gerencia atualização de transparência via duplo clique, sem interferir em outros campos

import { useCallback } from 'react';

export function useDoubleClickTransparency(updateCard, refetchCards) {
  // Handler para duplo clique em card
  return useCallback(async (card, deckCards) => {
    const transparent = card.is_transparent === true || card.is_transparent === 'true';
    console.log('[DoubleClick] Antes do update:', {
      cardId: card.id,
      is_transparent: card.is_transparent,
      transparent,
      updatePayload: { is_transparent: !transparent }
    });
    await updateCard({ cardId: card.id, updates: { is_transparent: !transparent } });
    console.log('[DoubleClick] updateCard chamado, aguardando refetch...');
    setTimeout(async () => {
      if (typeof refetchCards === 'function') {
        await refetchCards();
        console.log('[DoubleClick] refetchCards chamado, aguardando atualização dos dados...');
        setTimeout(() => {
          const updated = deckCards.find(c => c.id === card.id);
          console.log('[DoubleClick] Depois do update (refetch):', {
            cardId: card.id,
            is_transparent: updated?.is_transparent,
            typeof: typeof updated?.is_transparent,
            deckCards: deckCards.map(c => ({ id: c.id, is_transparent: c.is_transparent }))
          });
        }, 300);
      }
    }, 400);
  }, [updateCard, refetchCards]);
}
