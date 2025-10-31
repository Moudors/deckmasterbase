/**
 * 🌍 Integração com Magic: The Gathering API
 * Suporta busca real em português e outros idiomas
 */

interface MTGCard {
  name: string; // Nome em inglês
  foreignNames?: Array<{
    name: string; // Nome traduzido
    language: string; // "Portuguese (Brazil)", "Spanish", etc.
    multiverseid: number;
  }>;
  multiverseid?: number;
  [key: string]: any;
}

/**
 * 🔍 Buscar carta em português e retornar nome em inglês
 * Exemplo: "Relâmpago" → "Lightning Bolt"
 */
export async function searchPortugueseToEnglish(portugueseName: string): Promise<string | null> {
  try {
    // Buscar cartas que tenham o nome português
    const response = await fetch(
      `https://api.magicthegathering.io/v1/cards?language=Portuguese (Brazil)&name=${encodeURIComponent(portugueseName)}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const cards: MTGCard[] = data.cards || [];
    
    if (cards.length === 0) return null;
    
    // Primeira carta encontrada - retornar nome em inglês
    const card = cards[0];
    console.log(`🌍 Português "${portugueseName}" → Inglês "${card.name}"`);
    return card.name;
    
  } catch (error) {
    console.error('❌ Erro ao buscar carta em português:', error);
    return null;
  }
}

/**
 * 🎯 Autocomplete em Português
 * Busca cartas portuguesas e retorna lista de sugestões
 */
export async function getPortugueseAutocomplete(query: string): Promise<Array<{ portuguese: string; english: string }>> {
  if (query.length < 2) return [];

  try {
    // Buscar cartas portuguesas que contenham o termo
    const response = await fetch(
      `https://api.magicthegathering.io/v1/cards?language=Portuguese (Brazil)&pageSize=10`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const cards: MTGCard[] = data.cards || [];
    
    // Filtrar e mapear resultados
    const results: Array<{ portuguese: string; english: string }> = [];
    const lowerQuery = query.toLowerCase();
    
    for (const card of cards) {
      if (!card.foreignNames) continue;
      
      // Encontrar nome português
      const ptName = card.foreignNames.find(
        (fn) => fn.language === 'Portuguese (Brazil)'
      );
      
      if (ptName && ptName.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          portuguese: ptName.name,
          english: card.name
        });
        
        if (results.length >= 10) break;
      }
    }
    
    console.log(`🔍 Encontradas ${results.length} sugestões em português`);
    return results;
    
  } catch (error) {
    console.error('❌ Erro no autocomplete português:', error);
    return [];
  }
}

/**
 * 🌐 Cache de Traduções PT→EN
 * Melhora performance ao buscar várias vezes a mesma carta
 */
const translationCache = new Map<string, { english: string; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hora

export async function translatePortugueseWithCache(portugueseName: string): Promise<string | null> {
  // Verificar cache
  const cached = translationCache.get(portugueseName.toLowerCase());
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`💾 Cache hit: "${portugueseName}" → "${cached.english}"`);
    return cached.english;
  }
  
  // Buscar na API
  const englishName = await searchPortugueseToEnglish(portugueseName);
  
  if (englishName) {
    // Salvar no cache
    translationCache.set(portugueseName.toLowerCase(), {
      english: englishName,
      timestamp: Date.now()
    });
  }
  
  return englishName;
}

/**
 * 🧹 Limpar cache antigo
 */
export function clearOldTranslationCache() {
  const now = Date.now();
  translationCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      translationCache.delete(key);
    }
  });
}
