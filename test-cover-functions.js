// 🧪 Teste das funções de cover do deck
// Execute este script no navegador após entrar em um deck

console.log("🔍 TESTE: Funções de Cover do Deck");

// Função para testar atualização de cover
async function testUpdateDeckCover() {
  console.log("\n🖼️ 1. Testando atualização de cover...");
  
  // Pegar deckId da URL
  const urlParams = window.location.pathname.match(/\/deckbuilder\/(.+)/);
  const deckId = urlParams ? urlParams[1] : null;
  
  if (!deckId) {
    console.log("❌ Deck ID não encontrado na URL");
    return;
  }
  
  console.log("📂 Deck ID:", deckId);
  
  // URL de teste para cover
  const testCoverUrl = "https://cards.scryfall.io/large/front/1/2/126b552b-a2dd-4dc4-96a1-d772bb4aa7b1.jpg";
  
  console.log("🧪 Cover de teste:", testCoverUrl);
  
  // Criar objeto de teste para update
  const updateData = {
    cover_image_url: testCoverUrl
  };
  
  console.log("📝 Dados para update:", updateData);
  
  return { deckId, updateData, testCoverUrl };
}

// Função para testar via Supabase direto
async function testSupabaseDeckUpdate(deckId, updateData) {
  console.log("\n🔗 2. Testando update via Supabase...");
  
  try {
    // Verificar se supabase está disponível
    if (window.supabase) {
      console.log("✅ Supabase client disponível");
      
      const { data, error } = await window.supabase
        .from('decks')
        .update(updateData)
        .eq('id', deckId);
        
      if (error) {
        console.error("❌ Erro no Supabase:", error);
        return false;
      } else {
        console.log("✅ Update realizado via Supabase:", data);
        return true;
      }
    } else {
      console.log("❌ Supabase client não disponível na window");
      return false;
    }
  } catch (error) {
    console.error("❌ Erro ao testar Supabase:", error);
    return false;
  }
}

// Função para testar via supabaseOperations
async function testSupabaseOperations(deckId, updateData) {
  console.log("\n⚙️ 3. Testando via supabaseOperations...");
  
  try {
    if (window.supabaseOperations && window.supabaseOperations.deckOperations) {
      console.log("✅ deckOperations disponível");
      
      const result = await window.supabaseOperations.deckOperations.updateDeck(deckId, updateData);
      console.log("✅ Update realizado via deckOperations:", result);
      return true;
    } else {
      console.log("❌ deckOperations não disponível na window");
      return false;
    }
  } catch (error) {
    console.error("❌ Erro ao testar deckOperations:", error);
    return false;
  }
}

// Função para verificar cover via hooks React
async function testReactHookUpdate() {
  console.log("\n⚛️ 4. Verificando hooks React...");
  
  // Verificar se existe algum hook de update disponível
  if (window.React && window.ReactQuery) {
    console.log("✅ React e ReactQuery disponíveis");
    
    // Instruções para debug manual
    console.log("📝 Para debug manual via React:");
    console.log("1. Abra React DevTools");
    console.log("2. Encontre o componente Deckbuilder");
    console.log("3. Verifique se updateDeck está disponível nas props");
    console.log("4. Execute updateDeck({ id: deckId, data: { cover_image_url: 'URL' } })");
  } else {
    console.log("❌ React/ReactQuery não disponíveis para debug");
  }
}

// Função para simular mudança de cover via interface
async function simulateUIUpdate() {
  console.log("\n🖱️ 5. Simulando interação na UI...");
  
  // Procurar por elementos relacionados a cover
  const coverElements = document.querySelectorAll('[data-testid*="cover"], [class*="cover"], img[src*="cover"]');
  
  console.log("🔍 Elementos de cover encontrados:", coverElements.length);
  
  coverElements.forEach((element, index) => {
    console.log(`Cover ${index + 1}:`, element.tagName, element.className, element.src || element.dataset.testid);
  });
  
  // Procurar por botões de edição
  const editButtons = document.querySelectorAll('button[aria-label*="edit"], button[title*="edit"], [class*="edit"]');
  
  console.log("🔍 Botões de edição encontrados:", editButtons.length);
  
  return { coverElements, editButtons };
}

// Função principal
async function testAllCoverFunctions() {
  console.log("🚀 Iniciando testes de cover do deck...\n");
  
  const { deckId, updateData, testCoverUrl } = await testUpdateDeckCover();
  
  if (!deckId) return;
  
  // Testar diferentes abordagens
  const supabaseResult = await testSupabaseDeckUpdate(deckId, updateData);
  const operationsResult = await testSupabaseOperations(deckId, updateData);
  
  await testReactHookUpdate();
  const uiElements = await simulateUIUpdate();
  
  console.log("\n📋 RESUMO DOS TESTES:");
  console.log("- Supabase direto:", supabaseResult ? "✅" : "❌");
  console.log("- deckOperations:", operationsResult ? "✅" : "❌");
  console.log("- Elementos UI:", uiElements.coverElements.length > 0 ? "✅" : "❌");
  
  console.log("\n🔧 PRÓXIMOS PASSOS:");
  if (!supabaseResult && !operationsResult) {
    console.log("1. Verificar se o usuário tem permissão para atualizar o deck");
    console.log("2. Verificar se as RLS policies estão configuradas corretamente");
    console.log("3. Verificar logs do Supabase no dashboard");
  } else {
    console.log("1. Verificar se a UI está reagindo às mudanças no banco");
    console.log("2. Testar invalidação do cache do React Query");
    console.log("3. Verificar se há algum componente de UI para alterar cover");
  }
}

// Disponibilizar funções globalmente
if (typeof window !== 'undefined') {
  window.testCoverFunctions = {
    testAllCoverFunctions,
    testUpdateDeckCover,
    testSupabaseDeckUpdate,
    testSupabaseOperations,
    testReactHookUpdate,
    simulateUIUpdate
  };
  
  console.log("🧪 Funções de teste de cover carregadas!");
  console.log("Execute: testCoverFunctions.testAllCoverFunctions()");
}

export { 
  testAllCoverFunctions, 
  testUpdateDeckCover, 
  testSupabaseDeckUpdate, 
  testSupabaseOperations,
  testReactHookUpdate,
  simulateUIUpdate 
};