// Script para debuggar problemas de carregamento de decks na Home
console.log("🔍 DEBUGGER: Problema de decks não aparecendo na Home");

// Função para testar connection com Supabase
async function testSupabaseConnection() {
  console.log("🌐 Testando conexão com Supabase...");
  
  try {
    // Simula busca direta no Supabase (você pode adaptar com as credenciais reais)
    console.log("📡 Verificando se decks existem no banco...");
    
    // Verificações que devem ser feitas:
    const checks = [
      "1. Usuário está autenticado?",
      "2. RLS policies estão corretas?", 
      "3. Tabela 'decks' existe e tem dados?",
      "4. owner_id corresponde ao user.id?",
      "5. useDecks hook está funcionando?",
      "6. React Query cache está limpo?"
    ];
    
    checks.forEach((check, index) => {
      setTimeout(() => {
        console.log(`✓ ${check}`);
      }, index * 500);
    });
    
  } catch (error) {
    console.error("❌ Erro na conexão:", error);
  }
}

// Função para debug do React Query
function debugReactQuery() {
  console.log("\n🔄 Debugando React Query...");
  
  const issues = [
    {
      issue: "Cache stale ou inválido",
      solution: "Limpar cache e forçar refetch"
    },
    {
      issue: "Query key inconsistente", 
      solution: "Verificar se query key ['decks'] está correto"
    },
    {
      issue: "Enabled false",
      solution: "Verificar se query está habilitada"
    },
    {
      issue: "Auth state não carregou",
      solution: "Aguardar useAuthState retornar user válido"
    }
  ];
  
  issues.forEach((item, index) => {
    setTimeout(() => {
      console.log(`\n❗ ${item.issue}`);
      console.log(`💡 ${item.solution}`);
    }, (index + 1) * 1000);
  });
}

// Função para simular resolução
function suggestSolutions() {
  console.log("\n🛠️ SOLUÇÕES SUGERIDAS:");
  
  const solutions = [
    "🔄 Força invalidação: queryClient.invalidateQueries(['decks'])",
    "🔍 Adiciona logs no useDecks para ver se query está executando",
    "👤 Verifica se user.id está correto no momento da query",
    "🌐 Testa conexão direta com Supabase via SQL",
    "🔃 Implementa botão manual de 'Atualizar' para debug",
    "📱 Verifica se connectivity.canSaveData está true"
  ];
  
  solutions.forEach((solution, index) => {
    setTimeout(() => {
      console.log(solution);
    }, index * 400);
  });
}

// Executar testes
testSupabaseConnection();
setTimeout(debugReactQuery, 3000);
setTimeout(suggestSolutions, 8000);

console.log("🏁 Debug script carregado. Verifique os logs da Home também.");