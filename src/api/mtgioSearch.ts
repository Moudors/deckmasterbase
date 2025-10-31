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
 * 🎯 Autocomplete em Português - SOLUÇÃO COMPLETA
 * 
 * ✅ DESCOBERTA: Scryfall suporta busca em português com lang:pt!
 * 
 * ESTRATÉGIAS:
 * 1. Busca DIRETA em português: lang:pt+"termo completo"
 * 2. Busca PARCIAL com wildcard: lang:pt+name:termo*
 * 3. Retorna printed_name (nome impresso em PT)
 * 
 * Exemplos que FUNCIONAM:
 * - "Relâmpago" → 34 resultados com "Relâmpago"
 * - "Rel*" → 175 resultados incluindo "Relâmpago"
 * - "Dragão" → 175 resultados com "Dragão"
 */
export async function getPortugueseAutocomplete(query: string): Promise<Array<{ portuguese: string; english: string }>> {
  if (query.length < 2) return [];

  try {
    console.log('🔍 Buscando autocomplete PT para:', query);
    
    // 🌟 BUSCA DIRETA NO SCRYFALL EM PORTUGUÊS
    // Usar wildcard (*) para busca parcial funcionar
    const searchQuery = `lang:pt+name:${encodeURIComponent(query)}*`;
    const url = `https://api.scryfall.com/cards/search?q=${searchQuery}&unique=cards&order=name`;
    
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log('⚠️ Busca Scryfall PT falhou, tentando fallback');
      return await fallbackScryfallSearch(query);
    }
    
    const data = await response.json();
    const cards = data.data || [];
    
    if (cards.length === 0) {
      console.log('⚠️ Nenhum resultado em PT, tentando fallback');
      return await fallbackScryfallSearch(query);
    }
    
    console.log(`📦 Scryfall retornou ${cards.length} cartas em português`);
    
    // Extrair nomes em português e inglês
    const results: Array<{ portuguese: string; english: string }> = [];
    const seen = new Set<string>(); // Evitar duplicatas
    
    for (const card of cards.slice(0, 10)) {
      const englishName = card.name;
      const portugueseName = card.printed_name || englishName;
      
      if (!seen.has(englishName)) {
        seen.add(englishName);
        results.push({
          portuguese: portugueseName,
          english: englishName
        });
        console.log(`  ✅ ${portugueseName} (${englishName})`);
      }
    }
    
    console.log(`🎯 Retornando ${results.length} sugestões em português`);
    return results;
    
  } catch (error) {
    console.error('❌ Erro no autocomplete:', error);
    return await fallbackScryfallSearch(query);
  }
}

/**
 * 🔄 Fallback: Buscar no Scryfall quando MTG.io não retorna resultados
 */
async function fallbackScryfallSearch(query: string): Promise<Array<{ portuguese: string; english: string }>> {
  try {
    console.log('🔄 Usando Scryfall como fallback');
    const response = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const names: string[] = data.data || [];
    
    // Retornar nomes em inglês (sem tradução)
    return names.slice(0, 10).map(name => ({
      portuguese: name,
      english: name
    }));
  } catch (error) {
    console.error('❌ Fallback Scryfall também falhou:', error);
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
