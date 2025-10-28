// Hook personalizado para buscar decks de múltiplas fontes
// NOVO: Usa UnifiedStorage + QueryManager (offline-first)

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "@/firebase";
import { db } from "@/firebase";
import { localDeckManager } from "./localDeckManager"; // Legacy - manter por compatibilidade
import queryManager from "./queryManager"; // NOVO sistema

// Busca deck do Firebase ou IndexedDB
export async function fetchDeck(deckId) {
  // NOVO: Usa queryManager (offline-first)
  try {
    const deck = await queryManager.getDeck(deckId);
    if (deck) {
      console.log("✅ Deck carregado:", deckId);
      return deck;
    }
    
    // Fallback para sistema antigo (compatibilidade)
    if (deckId && deckId.startsWith("local_")) {
      console.log("🔍 Fallback: Buscando deck LOCAL:", deckId);
      return await localDeckManager.getDeck(deckId);
    }

    // Fallback para Firebase direto
    console.log("🔍 Fallback: Buscando deck no Firebase:", deckId);
    const docRef = doc(db, "decks", deckId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    
    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar deck:", error);
    return null;
  }
}

// Busca cartas do deck (Firebase ou IndexedDB)
export async function fetchDeckCards(deckId) {
  // NOVO: Usa queryManager (offline-first)
  try {
    const cards = await queryManager.getDeckCards(deckId);
    if (cards && cards.length > 0) {
      console.log(`✅ ${cards.length} cartas carregadas`);
      return cards;
    }
    
    // Fallback para sistema antigo
    if (deckId && deckId.startsWith("local_")) {
      console.log("🔍 Fallback: Buscando cartas LOCAIS do deck:", deckId);
      return await localDeckManager.getDeckCards(deckId);
    }

    // Fallback para Firebase direto
    const { getDocs, collection, query, where } = await import("@/firebase");
    const q = query(collection(db, "cards"), where("deck_id", "==", deckId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Erro ao buscar cartas:", error);
    return [];
  }
}

// Hook para buscar deck com suporte a local/Firebase
export function useDeck(deckId) {
  return useQuery({
    queryKey: ["deck", deckId],
    queryFn: () => fetchDeck(deckId),
    enabled: !!deckId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar cartas do deck
export function useDeckCards(deckId) {
  return useQuery({
    queryKey: ["cards", deckId],
    queryFn: () => fetchDeckCards(deckId),
    enabled: !!deckId,
    staleTime: 2 * 60 * 1000, // 2 minutos (ao invés de Infinity)
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false, // Não refetch ao montar (confia no cache)
  });
}
