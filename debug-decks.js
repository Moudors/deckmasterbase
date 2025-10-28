// Script para testar e debugar o sistema de decks no Supabase
// Execute este arquivo no console do navegador (F12)

console.log('🔍 INICIANDO DEBUG DO SISTEMA DE DECKS');

// Função para testar autenticação
async function testAuth() {
  console.log('\n=== 1. TESTE DE AUTENTICAÇÃO ===');
  
  try {
    const { data: { user }, error } = await window.supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Erro na autenticação:', error);
      return null;
    }
    
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return null;
    }
    
    console.log('✅ Usuário autenticado:');
    console.log('  - Email:', user.email);
    console.log('  - ID:', user.id);
    console.log('  - User object:', user);
    
    return user;
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação:', error);
    return null;
  }
}

// Função para verificar estrutura da tabela decks
async function checkDecksTable() {
  console.log('\n=== 2. VERIFICAÇÃO DA TABELA DECKS ===');
  
  try {
    // Tentar buscar todos os decks (vai falhar por RLS, mas mostra a estrutura)
    const { data, error } = await window.supabase
      .from('decks')
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST301') { // PGRST301 é erro de RLS, esperado
      console.error('❌ Erro na tabela decks:', error);
      return false;
    }
    
    console.log('✅ Tabela decks acessível');
    if (data && data.length > 0) {
      console.log('  - Estrutura encontrada:', Object.keys(data[0]));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao acessar tabela decks:', error);
    return false;
  }
}

// Função para testar busca de decks do usuário
async function testUserDecks(user) {
  console.log('\n=== 3. TESTE DE BUSCA DE DECKS DO USUÁRIO ===');
  
  if (!user) {
    console.error('❌ Usuário não fornecido');
    return;
  }
  
  try {
    console.log(`🔍 Buscando decks para o usuário: ${user.id}`);
    
    const { data, error } = await window.supabase
      .from('decks')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar decks:', error);
      return;
    }
    
    console.log(`✅ Busca realizada com sucesso. ${data.length} decks encontrados:`);
    data.forEach((deck, index) => {
      console.log(`  ${index + 1}. ${deck.name} (${deck.format})`);
      console.log(`     - ID: ${deck.id}`);
      console.log(`     - Owner ID: ${deck.owner_id}`);
      console.log(`     - Criado em: ${deck.created_at}`);
      console.log(`     - Cover URL: ${deck.cover_image_url || 'N/A'}`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Erro na busca de decks:', error);
    return [];
  }
}

// Função para testar criação de deck
async function testCreateDeck(user) {
  console.log('\n=== 4. TESTE DE CRIAÇÃO DE DECK ===');
  
  if (!user) {
    console.error('❌ Usuário não fornecido');
    return;
  }
  
  const testDeckName = `Teste Debug ${new Date().getTime()}`;
  
  try {
    console.log(`🔧 Criando deck de teste: ${testDeckName}`);
    
    const { data, error } = await window.supabase
      .from('decks')
      .insert({
        name: testDeckName,
        format: 'Commander',
        owner_id: user.id,
        cover_image_url: ''
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar deck:', error);
      return null;
    }
    
    console.log('✅ Deck criado com sucesso:');
    console.log('  - ID:', data.id);
    console.log('  - Nome:', data.name);
    console.log('  - Owner ID:', data.owner_id);
    console.log('  - Dados completos:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Erro na criação de deck:', error);
    return null;
  }
}

// Função para testar as operações do deckOperations
async function testDeckOperations(user) {
  console.log('\n=== 5. TESTE DAS FUNÇÕES DE DECK OPERATIONS ===');
  
  try {
    // Tentar usar a função getUserDecks
    console.log('🔍 Testando deckOperations.getUserDecks...');
    
    if (window.deckOperations && window.deckOperations.getUserDecks) {
      const decks = await window.deckOperations.getUserDecks(user.id);
      console.log(`✅ deckOperations.getUserDecks retornou ${decks.length} decks`);
      console.log('  - Decks:', decks);
    } else {
      console.warn('⚠️ deckOperations.getUserDecks não encontrado no window');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar deckOperations:', error);
    return false;
  }
}

// Função principal que executa todos os testes
async function runFullDebug() {
  console.log('🚀 EXECUTANDO DEBUG COMPLETO...\n');
  
  // 1. Teste de autenticação
  const user = await testAuth();
  if (!user) {
    console.error('🛑 PARANDO DEBUG: Usuário não autenticado');
    return;
  }
  
  // 2. Verificação da tabela
  const tableOk = await checkDecksTable();
  if (!tableOk) {
    console.warn('⚠️ Problemas com a tabela decks, mas continuando...');
  }
  
  // 3. Teste de busca de decks
  const userDecks = await testUserDecks(user);
  
  // 4. Teste de criação (opcional - descomente se quiser testar)
  // const newDeck = await testCreateDeck(user);
  
  // 5. Teste das operações
  await testDeckOperations(user);
  
  console.log('\n🏁 DEBUG COMPLETO FINALIZADO');
  console.log('📋 RESUMO:');
  console.log(`  - Usuário: ${user.email} (${user.id})`);
  console.log(`  - Decks encontrados: ${userDecks ? userDecks.length : 0}`);
  
  if (userDecks && userDecks.length === 0) {
    console.log('\n💡 DICA: Se você criou decks mas eles não aparecem:');
    console.log('  1. Verifique se as políticas RLS estão corretas');
    console.log('  2. Verifique se o owner_id dos decks corresponde ao user.id');
    console.log('  3. Execute o SQL: SELECT * FROM decks WHERE owner_id = \'[seu-user-id]\';');
  }
  
  return {
    user,
    userDecks,
    tableOk
  };
}

// Exportar para o window para acesso fácil
window.debugDecks = runFullDebug;
window.testAuth = testAuth;
window.testUserDecks = testUserDecks;
window.testCreateDeck = testCreateDeck;

// Executar automaticamente
console.log('🔧 Para executar o debug completo, use: debugDecks()');
console.log('🔧 Para testar apenas auth: testAuth()');
console.log('🔧 Para executar automaticamente agora, descomente a linha abaixo:');
// runFullDebug();

export { runFullDebug, testAuth, testUserDecks, testCreateDeck };