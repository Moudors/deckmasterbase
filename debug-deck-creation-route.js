// Script para debuggar problemas de rota na criação de deck
console.log("🔍 DEBUGGER: Problemas de rota após criação de deck");

// Função para testar se o deck existe imediatamente após criação
async function testDeckCreationFlow() {
  console.log("🚀 Testando fluxo de criação de deck...");
  
  try {
    // Simula criação de deck (você pode adaptar para usar a função real)
    const deckName = `Deck Teste ${Date.now()}`;
    const format = "commander";
    
    console.log("1️⃣ Criando deck:", { name: deckName, format });
    
    // Aqui você pode chamar a função real de criação
    // const newDeck = await createDeck({ name: deckName, format, cards: [] });
    
    // Para teste, vamos simular um deck criado
    const simulatedDeck = {
      id: `deck_${Date.now()}`,
      name: deckName,
      format: format,
      created_at: new Date().toISOString()
    };
    
    console.log("2️⃣ Deck criado:", simulatedDeck);
    
    // Simula redirecionamento
    console.log("3️⃣ Redirecionando para:", `/deckbuilder/${simulatedDeck.id}`);
    
    // Simula busca do deck no destino
    console.log("4️⃣ Buscando deck na rota de destino...");
    
    // Aqui seria onde o Deckbuilder tenta encontrar o deck
    setTimeout(() => {
      console.log("5️⃣ Simulando busca do deck após redirecionamento...");
      
      // Simula diferentes cenários
      const scenarios = [
        { found: true, message: "✅ Deck encontrado imediatamente" },
        { found: false, message: "❌ Deck não encontrado - possível problema de timing" },
        { found: true, message: "⏰ Deck encontrado após delay" }
      ];
      
      scenarios.forEach((scenario, index) => {
        setTimeout(() => {
          console.log(`Cenário ${index + 1}:`, scenario.message);
        }, index * 1000);
      });
    }, 100);
    
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

// Função para verificar cache do React Query
function debugReactQueryCache() {
  console.log("🔍 Verificando cache do React Query...");
  
  // Verificar se existe queryClient no contexto
  if (typeof window !== 'undefined' && window.reactQueryDevtools) {
    console.log("📋 React Query DevTools disponível");
  }
  
  // Simular verificação de cache
  console.log("📦 Verificando cache de decks...");
  console.log("- Cache pode estar desatualizado após criação");
  console.log("- Deck pode não aparecer imediatamente no cache");
  console.log("- Timing de invalidação pode estar incorreto");
}

// Função para testar problemas de sincronização
function testSyncIssues() {
  console.log("⚡ Testando problemas de sincronização...");
  
  const issues = [
    "🔄 Cache não atualizado após criação",
    "⏱️ Race condition entre criação e busca",
    "🌐 Delay de sincronização com Supabase",
    "🔍 Query key inconsistente",
    "📡 Problema de conectividade intermitente"
  ];
  
  issues.forEach((issue, index) => {
    setTimeout(() => {
      console.log(`Possível problema ${index + 1}:`, issue);
    }, index * 500);
  });
}

// Executar testes
testDeckCreationFlow();
debugReactQueryCache();
testSyncIssues();

// Função para verificar problemas específicos da rota
function checkRouteIssues() {
  console.log("🛣️ Verificando problemas específicos de rota...");
  
  const routeProblems = [
    {
      problem: "Navigate() chamado antes do deck estar no cache",
      solution: "Aguardar confirmação do cache antes de navegar"
    },
    {
      problem: "useParams() não consegue encontrar deck imediatamente",
      solution: "Implementar retry logic ou loading state"
    },
    {
      problem: "Query não está sendo invalidada corretamente",
      solution: "Verificar queryKey e invalidation strategy"
    },
    {
      problem: "Race condition entre mutação e query",
      solution: "Usar optimistic updates ou await proper"
    }
  ];
  
  routeProblems.forEach((item, index) => {
    setTimeout(() => {
      console.log(`\n❗ Problema ${index + 1}: ${item.problem}`);
      console.log(`💡 Solução: ${item.solution}`);
    }, (index + 1) * 1000);
  });
}

setTimeout(checkRouteIssues, 3000);

console.log("🏁 Debug script carregado. Verifique os logs acima para identificar problemas.");