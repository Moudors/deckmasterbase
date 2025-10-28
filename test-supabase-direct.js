// Teste direto do Supabase para verificar se decks existem
console.log("🔍 TESTE DIRETO SUPABASE");

// Função para testar busca direta de decks
async function testDirectSupabaseQuery() {
  console.log("📡 Testando busca direta no Supabase...");
  
  try {
    // Simula o que deveria acontecer (você pode adaptar com imports reais)
    console.log("1. Verificando autenticação...");
    
    // Seria algo como:
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("👤 Usuário autenticado: [verificar se user.id existe]");
    
    console.log("2. Executando query de decks...");
    // Seria algo como:
    // const { data, error } = await supabase
    //   .from('decks')
    //   .select('*')
    //   .eq('owner_id', user.id)
    //   .order('created_at', { ascending: false });
    
    console.log("📋 Query SQL equivalente:");
    console.log("SELECT * FROM decks WHERE owner_id = $1 ORDER BY created_at DESC");
    
    console.log("3. Verificações importantes:");
    console.log("   ✓ Tabela 'decks' existe?");
    console.log("   ✓ RLS policies permitem SELECT para owner_id?");
    console.log("   ✓ user.id está correto?");
    console.log("   ✓ Deck foi criado com owner_id correto?");
    
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

// Função para verificar RLS policies
function checkRLSPolicies() {
  console.log("\n🔒 VERIFICAÇÃO RLS POLICIES");
  
  const expectedPolicies = [
    "SELECT: Users can view their own decks",
    "INSERT: Users can create their own decks", 
    "UPDATE: Users can update their own decks",
    "DELETE: Users can delete their own decks"
  ];
  
  console.log("Policies esperadas:");
  expectedPolicies.forEach(policy => {
    console.log(`✓ ${policy}`);
  });
  
  console.log("\nSQL para verificar policies:");
  console.log("SELECT * FROM pg_policies WHERE tablename = 'decks';");
}

// Função para debug do useAuthState
function debugAuthState() {
  console.log("\n👤 DEBUG USEAUTHSTATE");
  
  const commonIssues = [
    "useAuthState retorna [null, true] (loading)",
    "useAuthState retorna [null, false] (não autenticado)",
    "user.id não corresponde ao owner_id no banco",
    "Auth state mudou após criação do deck"
  ];
  
  console.log("Problemas comuns:");
  commonIssues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

// Executar testes
testDirectSupabaseQuery();
setTimeout(checkRLSPolicies, 2000);
setTimeout(debugAuthState, 4000);

console.log("🔧 Para resolver:");
console.log("1. Verifique os logs do console da Home");
console.log("2. Use os botões de debug na interface");
console.log("3. Teste a query SQL diretamente no Supabase Dashboard");