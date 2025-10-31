/**
 * 🧪 TESTE DE ESTRATÉGIAS DE BUSCA EM PORTUGUÊS
 * Vamos testar todas as formas possíveis de buscar cartas em português
 */

console.log('🧪 TESTANDO ESTRATÉGIAS DE BUSCA EM PORTUGUÊS\n');
console.log('=' .repeat(60));

// ============================================
// ESTRATÉGIA 1: Scryfall com lang:pt
// ============================================
async function testStrategy1() {
  console.log('\n📋 ESTRATÉGIA 1: Scryfall lang:pt');
  console.log('-'.repeat(60));
  
  const queries = ['Relâmpago', 'Choque', 'Dragão', 'Espada'];
  
  for (const query of queries) {
    try {
      console.log(`\n🔍 Buscando: "${query}"`);
      
      const url = `https://api.scryfall.com/cards/search?q=lang:pt+${encodeURIComponent(query)}&unique=cards&order=name`;
      console.log(`   URL: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        console.log(`   ✅ Encontrou ${data.data.length} resultados`);
        data.data.slice(0, 3).forEach(card => {
          console.log(`      - ${card.printed_name || card.name} (${card.name})`);
        });
      } else {
        console.log(`   ❌ Nenhum resultado`);
        if (data.warnings) {
          console.log(`   ⚠️ Avisos:`, data.warnings);
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro:`, error.message);
    }
  }
}

// ============================================
// ESTRATÉGIA 2: MTG.io com foreignData
// ============================================
async function testStrategy2() {
  console.log('\n\n📋 ESTRATÉGIA 2: MTG.io foreignData');
  console.log('-'.repeat(60));
  
  const queries = ['Relâmpago', 'Choque', 'Dragão', 'Espada'];
  
  for (const query of queries) {
    try {
      console.log(`\n🔍 Buscando: "${query}"`);
      
      // Tentar buscar cartas e filtrar por foreignNames
      const url = `https://api.magicthegathering.io/v1/cards?pageSize=500`;
      console.log(`   Baixando 500 cartas e filtrando...`);
      
      const response = await fetch(url);
      const data = await response.json();
      const cards = data.cards || [];
      
      const results = [];
      const lowerQuery = query.toLowerCase();
      
      for (const card of cards) {
        const ptName = card.foreignNames?.find(fn => fn.language === 'Portuguese (Brazil)');
        if (ptName && ptName.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            portuguese: ptName.name,
            english: card.name
          });
          if (results.length >= 5) break;
        }
      }
      
      if (results.length > 0) {
        console.log(`   ✅ Encontrou ${results.length} resultados`);
        results.forEach(r => {
          console.log(`      - ${r.portuguese} (${r.english})`);
        });
      } else {
        console.log(`   ❌ Nenhum resultado nas primeiras 500 cartas`);
      }
    } catch (error) {
      console.log(`   ❌ Erro:`, error.message);
    }
  }
}

// ============================================
// ESTRATÉGIA 3: Scryfall com termos parciais
// ============================================
async function testStrategy3() {
  console.log('\n\n📋 ESTRATÉGIA 3: Scryfall busca parcial em português');
  console.log('-'.repeat(60));
  
  const queries = ['Rel', 'Cho', 'Drag', 'Espa'];
  
  for (const query of queries) {
    try {
      console.log(`\n🔍 Buscando: "${query}"*`);
      
      // Tentar buscar com wildcard
      const url = `https://api.scryfall.com/cards/search?q=lang:pt+name:${encodeURIComponent(query)}*&unique=cards&order=name`;
      console.log(`   URL: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        console.log(`   ✅ Encontrou ${data.data.length} resultados`);
        data.data.slice(0, 5).forEach(card => {
          console.log(`      - ${card.printed_name || card.name} (${card.name})`);
        });
      } else {
        console.log(`   ❌ Nenhum resultado`);
        if (data.warnings) {
          console.log(`   ⚠️ Avisos:`, data.warnings);
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro:`, error.message);
    }
  }
}

// ============================================
// ESTRATÉGIA 4: Busca híbrida - Inglês → Português
// ============================================
async function testStrategy4() {
  console.log('\n\n📋 ESTRATÉGIA 4: Busca híbrida (inglês → português)');
  console.log('-'.repeat(60));
  
  // Mapear termos comuns PT → EN
  const translations = {
    'rel': 'lightning',
    'raio': 'bolt',
    'cho': 'shock',
    'drag': 'dragon',
    'espa': 'sword'
  };
  
  for (const [pt, en] of Object.entries(translations)) {
    try {
      console.log(`\n🔍 "${pt}" → "${en}"`);
      
      // Buscar em inglês no Scryfall
      const url = `https://api.scryfall.com/cards/autocomplete?q=${en}`;
      const response = await fetch(url);
      const data = await response.json();
      const englishNames = data.data || [];
      
      if (englishNames.length > 0) {
        console.log(`   ✅ Scryfall retornou ${englishNames.length} sugestões em inglês`);
        
        // Tentar pegar traduções PT
        for (const englishName of englishNames.slice(0, 3)) {
          try {
            const cardUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(englishName)}`;
            const cardResponse = await fetch(cardUrl);
            const cardData = await cardResponse.json();
            
            // Buscar prints em PT
            if (cardData.oracle_id) {
              const ptUrl = `https://api.scryfall.com/cards/search?q=oracle_id:${cardData.oracle_id}+lang:pt&unique=prints`;
              const ptResponse = await fetch(ptUrl);
              const ptData = await ptResponse.json();
              
              if (ptData.data && ptData.data.length > 0) {
                const ptName = ptData.data[0].printed_name || englishName;
                console.log(`      - ${ptName} (${englishName})`);
              } else {
                console.log(`      - ${englishName} (sem tradução PT)`);
              }
            }
          } catch (err) {
            console.log(`      - ${englishName} (erro ao buscar tradução)`);
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro:`, error.message);
    }
  }
}

// ============================================
// ESTRATÉGIA 5: Cache local de traduções
// ============================================
async function testStrategy5() {
  console.log('\n\n📋 ESTRATÉGIA 5: Criar cache de traduções populares');
  console.log('-'.repeat(60));
  
  try {
    console.log('\n🔍 Buscando cartas mais populares em PT...');
    
    // Buscar cartas mais jogadas
    const url = `https://api.scryfall.com/cards/search?q=lang:pt+f:standard&order=edhrec&unique=cards`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      console.log(`   ✅ Encontrou ${data.data.length} cartas populares`);
      
      const cache = {};
      data.data.slice(0, 20).forEach(card => {
        const ptName = card.printed_name || card.name;
        cache[ptName.toLowerCase()] = {
          portuguese: ptName,
          english: card.name
        };
        console.log(`      - ${ptName} → ${card.name}`);
      });
      
      console.log(`\n   📦 Cache criado com ${Object.keys(cache).length} entradas`);
      console.log(`   💡 Podemos usar isso para busca rápida em PT!`);
    }
  } catch (error) {
    console.log(`   ❌ Erro:`, error.message);
  }
}

// ============================================
// EXECUTAR TODOS OS TESTES
// ============================================
async function runAllTests() {
  await testStrategy1();
  await testStrategy2();
  await testStrategy3();
  await testStrategy4();
  await testStrategy5();
  
  console.log('\n\n' + '='.repeat(60));
  console.log('🎯 CONCLUSÕES:');
  console.log('='.repeat(60));
  console.log('Analisando qual estratégia funciona melhor...\n');
}

runAllTests();
