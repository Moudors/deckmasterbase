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
 * 🎯 Autocomplete em Português usando BUSCA HÍBRIDA
 * 
 * PROBLEMA: API MTG.io não suporta busca parcial em português
 * SOLUÇÃO: Usar printed_name do Scryfall diretamente
 * 
 * Quando usuário digita "Relâ", queremos sugerir "Relâmpago" (Lightning Bolt)
 */
export async function getPortugueseAutocomplete(query: string): Promise<Array<{ portuguese: string; english: string }>> {
  if (query.length < 2) return [];

  try {
    console.log('🔍 Buscando autocomplete PT para:', query);
    
    // 🌟 Buscar todas cartas em português no Scryfall
    // Usar busca por printed_name (nome impresso) em português
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=lang:pt+printed_name:/${query}/&unique=prints&order=name`
    );
    
    if (!response.ok) {
      console.log('⚠️ Busca em português falhou, tentando fallback');
      // Fallback: buscar em inglês e tentar traduzir
      return await fallbackEnglishSearch(query);
    }
    
    const data = await response.json();
    const cards = data.data || [];
    
    if (cards.length === 0) {
      console.log('⚠️ Nenhum resultado, usando fallback');
      return await fallbackEnglishSearch(query);
    }
    
    // Mapear resultados
    const results: Array<{ portuguese: string; english: string }> = [];
    const seen = new Set<string>(); // Evitar duplicatas
    
    for (const card of cards.slice(0, 10)) {
      const portugueseName = card.printed_name || card.name;
      const englishName = card.name;
      
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
    console.error('❌ Erro no autocomplete português:', error);
    return await fallbackEnglishSearch(query);
  }
}

/**
 * 🔄 Fallback: Buscar em inglês quando busca em português falha
 */
async function fallbackEnglishSearch(query: string): Promise<Array<{ portuguese: string; english: string }>> {
  try {
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
    console.error('❌ Fallback também falhou:', error);
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
