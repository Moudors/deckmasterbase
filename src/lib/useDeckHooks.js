// Hook personalizado para buscar decks - Sistema Online-First apenas
// Removeu compatibilidade com sistema local

import { useQuery } from "@tanstack/react-query";
import { deckOperations } from "./supabaseOperations";
import { supabase } from "../supabase";

// Busca deck do Supabase apenas
export async function fetchDeck(deckId) {
  try {
    // 🔍 Verificar se usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('👤 Usuário não autenticado para buscar deck');
      return null;
    }

    console.log("🔍 Buscando deck no Supabase:", deckId);
    const deck = await deckOperations.getDeck(deckId);
    
    if (deck) {
      console.log("✅ Deck carregado:", deckId);
      return deck;
    }
    
    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar deck:", error);
    return null;
  }
}

// Busca cartas do deck do Supabase apenas
export async function fetchDeckCards(deckId) {
  try {
    // 🔍 Verificar se usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('👤 Usuário não autenticado para buscar cartas');
      return [];
    }

    console.log("🔍 Buscando cartas do deck no Supabase:", deckId);
    const cards = await deckOperations.getDeckCards(deckId);
    
    if (cards && cards.length > 0) {
      console.log(`✅ ${cards.length} cartas carregadas`);
      return cards;
    }
    
    return [];
  } catch (error) {
    console.error("❌ Erro ao buscar cartas:", error);
    return [];
  }
}

// Hook para buscar deck - Online-First apenas
export function useDeck(deckId) {
  return useQuery({
    queryKey: ["deck", deckId],
    queryFn: () => fetchDeck(deckId),
    enabled: !!deckId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para buscar cartas do deck - Online-First apenas
export function useDeckCards(deckId) {
  return useQuery({
    queryKey: ["cards", deckId],
    queryFn: () => fetchDeckCards(deckId),
    enabled: !!deckId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}