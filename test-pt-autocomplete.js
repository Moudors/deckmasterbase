/**
 * Teste do autocomplete em português - VERSÃO 2
 */

async function testPortugueseAutocomplete() {
  console.log('🧪 Testando autocomplete português v2...\n');
  
  const queries = ['lightning', 'shock', 'sword', 'dragon'];
  
  for (const query of queries) {
    console.log(`\n🔍 Buscando: "${query}"`);
    
    try {
      // Buscar na API MTG.io por nome em inglês
      const response = await fetch(
        `https://api.magicthegathering.io/v1/cards?name=${query}&pageSize=10`
      );
      
      const data = await response.json();
      const cards = data.cards || [];
      
      console.log(`📦 API retornou ${cards.length} cartas`);
      
      // Extrair traduções
      const results = [];
      const seen = new Set();
      
      for (const card of cards) {
        if (!seen.has(card.name)) {
          seen.add(card.name);
          
          const ptName = card.foreignNames?.find(fn => fn.language === 'Portuguese (Brazil)');
          
          results.push({
            english: card.name,
            portuguese: ptName?.name || card.name,
            hasTranslation: !!ptName
          });
          
          if (results.length >= 5) break;
        }
      }
      
      console.log(`✅ Encontrados ${results.length} resultados:`);
      results.forEach(r => {
        const icon = r.hasTranslation ? '🇧🇷' : '🇺🇸';
        console.log(`   ${icon} ${r.english} → ${r.portuguese}`);
      });
      
      if (results.length === 0) {
        console.log('   ❌ Nenhum resultado encontrado');
      }
      
    } catch (error) {
      console.error('❌ Erro:', error.message);
    }
  }
}

testPortugueseAutocomplete();
