/**
 * 🌍 Sistema de Busca Multilíngue Scryfall
 * Suporta busca de cartas em português, espanhol e outros idiomas
 */

export interface ScryfallCard {
  id: string;
  name: string;
  printed_name?: string;
  lang?: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    art_crop?: string;
  };
  card_faces?: Array<{
    name: string;
    printed_name?: string;
    image_uris?: {
      small?: string;
      normal?: string;
      large?: string;
      art_crop?: string;
    };
  }>;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  prints_search_uri?: string;
  set_name?: string;
  [key: string]: any;
}

/**
 * 🔍 Autocomplete Multilíngue
 * Retorna sugestões em qualquer idioma (Scryfall já suporta nativamente)
 */
export async function getMultilingualAutocomplete(query: string): Promise<string[]> {
  if (query.length < 2) return [];

  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}&include_extras=true`
    );
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('❌ Erro no autocomplete multilíngue:', error);
    return [];
  }
}

/**
 * 🎯 Busca de Carta com Suporte Multilíngue
 * Tenta 5 estratégias progressivas para encontrar a carta
 */
export async function searchCardMultilingual(cardName: string): Promise<ScryfallCard | null> {
  if (!cardName || cardName.trim().length === 0) return null;

  const name = cardName.trim();

  // ✅ Estratégia 1: Busca fuzzy (melhor para inglês e nomes aproximados)
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
    );
    if (res.ok) {
      const card = await res.json();
      console.log('✅ Carta encontrada via fuzzy search:', card.name);
      return card;
    }
  } catch (error) {
    console.log('⏭️ Fuzzy search falhou, tentando próxima estratégia...');
  }

  // ✅ Estratégia 2: Busca exata (português, espanhol, etc.)
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(name)}"&unique=prints`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        console.log('✅ Carta encontrada via exact search:', data.data[0].name);
        return data.data[0];
      }
    }
  } catch (error) {
    console.log('⏭️ Exact search falhou, tentando próxima estratégia...');
  }

  // ✅ Estratégia 3: Busca por palavras parciais
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}&unique=cards&order=name`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        console.log('✅ Carta encontrada via partial search:', data.data[0].name);
        return data.data[0];
      }
    }
  } catch (error) {
    console.log('⏭️ Partial search falhou, tentando próxima estratégia...');
  }

  // ✅ Estratégia 4: Busca em nomes estrangeiros (foreign:)
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=foreign:"${encodeURIComponent(name)}"&unique=cards`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        console.log('✅ Carta encontrada via foreign search:', data.data[0].name);
        return data.data[0];
      }
    }
  } catch (error) {
    console.log('⏭️ Foreign search falhou, tentando próxima estratégia...');
  }

  // ✅ Estratégia 5: Busca em printed_name
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=printed_name:"${encodeURIComponent(name)}"&unique=cards`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        console.log('✅ Carta encontrada via printed_name search:', data.data[0].name);
        return data.data[0];
      }
    }
  } catch (error) {
    console.log('❌ Todas as estratégias falharam');
  }

  console.error(`❌ Carta "${name}" não encontrada em nenhuma estratégia`);
  return null;
}

/**
 * 🌎 Busca de Prints em Português
 * Encontra todas as versões impressas em PT de uma carta
 */
export async function getPortuguesePrints(cardName: string): Promise<ScryfallCard[]> {
  try {
    // Primeiro encontrar a carta
    const card = await searchCardMultilingual(cardName);
    if (!card || !card.prints_search_uri) return [];

    // Buscar todos os prints
    let allPrints: ScryfallCard[] = [];
    let nextUrl: string | null = card.prints_search_uri;

    while (nextUrl) {
      const res: Response = await fetch(nextUrl);
      if (!res.ok) break;

      const data: any = await res.json();
      allPrints = allPrints.concat(data.data || []);
      nextUrl = data.has_more ? data.next_page : null;
    }

    // Filtrar apenas prints em português
    const portuguesePrints = allPrints.filter(p => p.lang === 'pt');
    console.log(`🇧🇷 Encontrados ${portuguesePrints.length} prints em português`);
    
    return portuguesePrints;
  } catch (error) {
    console.error('❌ Erro ao buscar prints em português:', error);
    return [];
  }
}

/**
 * 🔄 Preferir Print em Português
 * Se existir print PT, retorna ele; caso contrário retorna a carta original
 */
export async function preferPortuguesePrint(cardName: string): Promise<ScryfallCard | null> {
  try {
    const card = await searchCardMultilingual(cardName);
    if (!card) return null;

    // Se já for PT, retornar direto
    if (card.lang === 'pt') {
      console.log('✅ Carta já está em português');
      return card;
    }

    // Buscar versão PT
    const ptPrints = await getPortuguesePrints(cardName);
    if (ptPrints.length > 0) {
      console.log('✅ Usando versão em português:', ptPrints[0].set_name);
      return ptPrints[0];
    }

    // Não existe PT, usar original
    console.log('⚠️ Sem versão PT, usando original');
    return card;
  } catch (error) {
    console.error('❌ Erro ao preferir print PT:', error);
    return null;
  }
}
