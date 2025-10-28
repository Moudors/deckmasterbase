// 🧪 Teste das funções de adição de cartas do Deckbuilder
// Execute este script no navegador após fazer login e entrar em um deck

console.log("🔍 TESTE: Funções de Adicionar Cartas no Deckbuilder");

// Função para testar adição via SearchBar
async function testSearchBarAddition() {
  console.log("\n📝 1. Testando adição via SearchBar...");
  
  try {
    // Simular busca no Scryfall
    const response = await fetch(
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent("Lightning Bolt")}`
    );
    const cardData = await response.json();
    
    console.log("✅ Carta encontrada no Scryfall:", cardData.name);
    
    // Verificar se os hooks estão disponíveis
    if (window.React && window.ReactQuery) {
      console.log("✅ React Query disponível");
    } else {
      console.log("❌ React Query não detectado na window");
    }
    
    return cardData;
  } catch (error) {
    console.error("❌ Erro na busca:", error);
    return null;
  }
}

// Função para verificar estrutura do Supabase
async function testSupabaseOperations() {
  console.log("\n🔗 2. Testando operações do Supabase...");
  
  // Verificar se supabaseOperations está disponível
  if (window.supabaseOperations) {
    console.log("✅ supabaseOperations disponível");
    
    if (window.supabaseOperations.deckCardOperations) {
      console.log("✅ deckCardOperations disponível");
      console.log("Métodos:", Object.keys(window.supabaseOperations.deckCardOperations));
    }
  } else {
    console.log("❌ supabaseOperations não disponível na window");
  }
}

// Função para verificar hooks do React Query
async function testReactQueryHooks() {
  console.log("\n⚛️ 3. Testando hooks do React Query...");
  
  // Verificar se podemos acessar o queryClient
  try {
    if (window.ReactQuery && window.ReactQuery.useQueryClient) {
      console.log("✅ useQueryClient disponível");
    }
  } catch (error) {
    console.log("❌ Erro ao acessar React Query:", error);
  }
}

// Função para testar adição manual de carta
async function testManualCardAddition(deckId) {
  console.log("\n🎯 4. Testando adição manual de carta...");
  
  if (!deckId) {
    console.log("❌ deckId não fornecido");
    return;
  }
  
  const testCard = {
    deck_id: deckId,
    card_name: "Lightning Bolt",
    scryfall_id: "test-scryfall-id",
    image_url: "https://example.com/test.jpg",
    mana_cost: "{R}",
    type_line: "Instant",
    acquired: false,
    quantity: 1,
    created_at: new Date(),
  };
  
  console.log("🧪 Carta de teste:", testCard);
  
  // Este seria o teste real se tivéssemos acesso direto
  console.log("📝 Para testar manualmente:");
  console.log("1. Abra o Network tab");
  console.log("2. Digite 'Lightning Bolt' na SearchBar");
  console.log("3. Verifique se há requisições para o Scryfall");
  console.log("4. Verifique se há requisições para o Supabase após selecionar a carta");
}

// Função principal de teste
async function runAllTests() {
  console.log("🚀 Iniciando testes do Deckbuilder...\n");
  
  // Pegar deckId da URL se possível
  const urlParams = window.location.pathname.match(/\/deckbuilder\/(.+)/);
  const deckId = urlParams ? urlParams[1] : null;
  
  if (deckId) {
    console.log("📂 Deck ID detectado:", deckId);
  } else {
    console.log("⚠️ Não foi possível detectar o deck ID da URL");
  }
  
  await testSearchBarAddition();
  await testSupabaseOperations();
  await testReactQueryHooks();
  await testManualCardAddition(deckId);
  
  console.log("\n📋 PRÓXIMOS PASSOS PARA DEBUG:");
  console.log("1. Abra o console.log após entrar em um deck");
  console.log("2. Execute: runAllTests()");
  console.log("3. Teste a SearchBar manualmente");
  console.log("4. Verifique se há erros no Network tab");
  console.log("5. Monitore o console para mensagens de erro");
  
  console.log("\n🔧 Para debug mais profundo:");
  console.log("- window.location.pathname:", window.location.pathname);
  console.log("- window.React disponível:", !!window.React);
  console.log("- window.ReactQuery disponível:", !!window.ReactQuery);
}

// Executar automaticamente se não estamos no contexto do React
if (typeof window !== 'undefined') {
  window.testDeckbuilderFunctions = {
    runAllTests,
    testSearchBarAddition,
    testSupabaseOperations,
    testReactQueryHooks,
    testManualCardAddition
  };
  
  console.log("🧪 Funções de teste carregadas!");
  console.log("Execute: testDeckbuilderFunctions.runAllTests()");
}

export { runAllTests, testSearchBarAddition, testSupabaseOperations, testReactQueryHooks, testManualCardAddition };