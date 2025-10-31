// src/components/deck/DoubleClickTransparencyManager.js
// Gerencia atualização de transparência via duplo clique, sem interferir em outros campos

import { useCallback } from 'react';

export function useDoubleClickTransparency(updateCard, refetchCards) {
  // Handler para duplo clique em card
  return useCallback(async (card, deckCards) => {
    const transparent = card.is_transparent === true || card.is_transparent === 'true';
    
    // ✅ Apenas chama updateCard - o hook já faz invalidateQueries automaticamente
    await updateCard({ cardId: card.id, updates: { is_transparent: !transparent } });
  }, [updateCard]);
}
