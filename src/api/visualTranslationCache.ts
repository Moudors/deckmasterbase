/**
 * 🌍 Cache Visual de Traduções para Autocomplete
 * Armazena mapeamento entre nomes em inglês e português para exibição visual
 */

interface VisualTranslation {
  englishName: string;
  portugueseName: string;
  timestamp: number;
}

// Cache em memória (persiste durante a sessão)
const translationCache = new Map<string, VisualTranslation>();

/**
 * 🔍 Busca o nome em português de uma carta
 */
export async function getPortugueseNameForDisplay(
  englishName: string
): Promise<string | null> {
  // Verificar cache primeiro
  const cached = translationCache.get(englishName);
  if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hora
    return cached.portugueseName;
  }

  try {
    // Buscar carta pelo nome exato
    const searchRes = await fetch(
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(englishName)}`
    );
    
    if (!searchRes.ok) return null;
    
    const card = await searchRes.json();
    
    // Buscar versão em português usando o oracle_id
    if (card.oracle_id) {
      const printsRes = await fetch(
        `https://api.scryfall.com/cards/search?q=oracle_id:${card.oracle_id}+lang:pt&unique=prints`
      );
      
      if (printsRes.ok) {
        const printsData = await printsRes.json();
        if (printsData.data && printsData.data.length > 0) {
          const ptCard = printsData.data[0];
          
          if (ptCard.printed_name) {
            // Salvar no cache
            translationCache.set(englishName, {
              englishName,
              portugueseName: ptCard.printed_name,
              timestamp: Date.now()
            });
            
            return ptCard.printed_name;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar nome PT:', error);
    return null;
  }
}

/**
 * 🎯 Enriquecer sugestões de autocomplete com nomes em português
 */
export async function enrichSuggestionsWithPortuguese(
  englishSuggestions: string[],
  limit: number = 5
): Promise<Array<{ english: string; portuguese: string | null }>> {
  // Limitar para não fazer muitas requisições
  const limitedSuggestions = englishSuggestions.slice(0, limit);
  
  // Buscar traduções em paralelo
  const translationPromises = limitedSuggestions.map(async (englishName) => {
    const portugueseName = await getPortugueseNameForDisplay(englishName);
    return {
      english: englishName,
      portuguese: portugueseName
    };
  });
  
  return await Promise.all(translationPromises);
}

/**
 * 🗑️ Limpar cache antigo (executar periodicamente)
 */
export function clearOldCache() {
  const now = Date.now();
  const maxAge = 3600000; // 1 hora
  
  translationCache.forEach((value, key) => {
    if (now - value.timestamp > maxAge) {
      translationCache.delete(key);
    }
  });
}
