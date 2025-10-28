// Teste específico para função de mudar capa do deck

console.log("🖼️ === TESTE ESPECÍFICO MUDAR CAPA ===");

function testCoverChange() {
  console.log("🧪 Testando mudança de capa do deck...");
  
  // 1. Verificar se há modal de busca de capa aberto
  const coverModal = document.querySelector('input[placeholder*="carta"]');
  if (coverModal) {
    console.log("✅ Modal de busca de capa está aberto");
    
    // Testar busca
    console.log("🔍 Testando busca...");
    const testQuery = "Lightning Bolt";
    
    coverModal.value = testQuery;
    coverModal.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log(`📝 Digitado: "${testQuery}"`);
    
    // Verificar se suggestions aparecem
    setTimeout(() => {
      const suggestions = document.querySelectorAll('li[class*="cursor-pointer"]');
      console.log(`📋 Sugestões encontradas: ${suggestions.length}`);
      
      if (suggestions.length > 0) {
        console.log("✅ Busca funcionando!");
        suggestions.forEach((sug, index) => {
          console.log(`  ${index + 1}: ${sug.textContent}`);
        });
        
        // Testar clique na primeira sugestão
        const firstSuggestion = suggestions[0];
        console.log(`🖱️ Clicando na primeira sugestão: "${firstSuggestion.textContent}"`);
        
        // Adicionar listener para interceptar o clique
        firstSuggestion.addEventListener('click', (e) => {
          console.log("🖱️ Clique detectado na sugestão!");
          console.log("📝 Carta selecionada:", firstSuggestion.textContent);
        });
        
        // Simular clique
        setTimeout(() => {
          firstSuggestion.click();
        }, 1000);
        
      } else {
        console.log("❌ Nenhuma sugestão encontrada");
        console.log("💡 Possíveis problemas:");
        console.log("  - API do Scryfall não respondeu");
        console.log("  - Função handleSearchAutocomplete não foi chamada");
        console.log("  - Estado coverSuggestions não foi atualizado");
      }
    }, 2000);
    
  } else {
    console.log("❌ Modal de busca de capa não está aberto");
    console.log("💡 Para abrir o modal:");
    console.log("  1. Clique no botão ⚙ de um deck");
    console.log("  2. Clique em 'Alterar Capa'");
  }
}

// Função para monitorar requests de rede
function monitorNetworkRequests() {
  console.log("\n🌐 Monitorando requests de rede...");
  
  // Interceptar fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url.includes('scryfall.com')) {
      console.log(`🌐 Request Scryfall: ${url}`);
    }
    if (url.includes('supabase')) {
      console.log(`🗄️ Request Supabase: ${url}`);
      if (options?.method === 'PATCH' || options?.method === 'PUT') {
        console.log(`📝 Update request com body:`, options.body);
      }
    }
    
    const response = await originalFetch.apply(this, args);
    
    if (url.includes('scryfall.com') || url.includes('supabase')) {
      console.log(`📡 Response status: ${response.status}`);
    }
    
    return response;
  };
  
  console.log("✅ Interceptador de requests ativo");
}

// Função para debugar estado React
function debugReactState() {
  console.log("\n⚛️ Debugando estado React...");
  
  // Verificar se há erros no console
  const errors = [];
  const originalError = console.error;
  
  console.error = function(...args) {
    errors.push(args);
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} erros encontrados:`);
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}:`, error);
      });
    } else {
      console.log("✅ Nenhum erro encontrado");
    }
    
    console.error = originalError;
  }, 5000);
}

// Função para verificar conectividade
async function testConnectivity() {
  console.log("\n🌐 Testando conectividade...");
  
  try {
    // Testar Scryfall
    const scryfallResponse = await fetch('https://api.scryfall.com/cards/autocomplete?q=test');
    const scryfallData = await scryfallResponse.json();
    console.log("✅ Scryfall API funcionando:", scryfallData.data?.length || 0, "sugestões");
    
    // Testar Supabase
    if (window.supabase) {
      const { data, error } = await window.supabase.from('decks').select('id').limit(1);
      if (error) {
        console.log("❌ Erro no Supabase:", error.message);
      } else {
        console.log("✅ Supabase funcionando:", data?.length || 0, "decks encontrados");
      }
    } else {
      console.log("❌ Supabase client não disponível");
    }
    
  } catch (error) {
    console.error("❌ Erro de conectividade:", error);
  }
}

// Executar testes
setTimeout(testCoverChange, 1000);
setTimeout(testConnectivity, 2000);
monitorNetworkRequests();
debugReactState();

// Funções para execução manual
window.testCoverChange = testCoverChange;
window.monitorNetworkRequests = monitorNetworkRequests;
window.testConnectivity = testConnectivity;

console.log("⏱️ Iniciando testes...");
console.log("💡 Use window.testCoverChange() para testar manualmente");
console.log("💡 Use window.testConnectivity() para verificar conectividade");