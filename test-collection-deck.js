// Script para testar se o deck de coleção existe no banco de dados
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqmvjmlykbgxqhwwjtqp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbXZqbWx5a2JneHFod3dqdHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4MDA5NTMsImV4cCI6MjA0NTM3Njk1M30.vhPZnfDdMtpLfWK3XGRCpjPf0cHwzEwm2VDsuxMlL4Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCollectionDeck() {
  console.log('🔍 Testando deck de coleção...\n');

  // 1. Verificar usuário autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('❌ Erro de autenticação:', authError?.message || 'Usuário não encontrado');
    console.log('💡 Execute: npm run test:login primeiro\n');
    return;
  }

  console.log('✅ Usuário autenticado:');
  console.log('   Email:', user.email);
  console.log('   ID:', user.id);
  console.log('');

  // 2. Buscar TODOS os decks do usuário
  const { data: allDecks, error: decksError } = await supabase
    .from('decks')
    .select('*')
    .eq('owner_id', user.id);

  if (decksError) {
    console.log('❌ Erro ao buscar decks:', decksError.message);
    return;
  }

  console.log(`📋 Total de decks encontrados: ${allDecks?.length || 0}\n`);

  if (allDecks && allDecks.length > 0) {
    console.log('Lista de decks:');
    allDecks.forEach((deck, index) => {
      console.log(`\n${index + 1}. ${deck.name}`);
      console.log(`   ID: ${deck.id}`);
      console.log(`   Formato: ${deck.format}`);
      console.log(`   Owner ID: ${deck.owner_id}`);
      console.log(`   Capa: ${deck.cover_image_url || 'Sem capa'}`);
      console.log(`   Criado em: ${new Date(deck.created_at).toLocaleString()}`);
    });
  }

  // 3. Buscar especificamente deck de coleção
  const collectionDeck = allDecks?.find(d => d.format === 'Coleção de cartas');
  
  console.log('\n' + '='.repeat(60));
  
  if (collectionDeck) {
    console.log('✅ DECK DE COLEÇÃO ENCONTRADO!');
    console.log('   Nome:', collectionDeck.name);
    console.log('   ID:', collectionDeck.id);
    console.log('   Formato:', collectionDeck.format);
  } else {
    console.log('❌ DECK DE COLEÇÃO NÃO ENCONTRADO');
    console.log('');
    console.log('Verificando possíveis causas:');
    
    // Buscar com formato diferente (case insensitive)
    const { data: similarDecks } = await supabase
      .from('decks')
      .select('*')
      .eq('owner_id', user.id)
      .ilike('format', '%coleção%');
    
    if (similarDecks && similarDecks.length > 0) {
      console.log('   ⚠️ Encontrado deck com formato similar:');
      similarDecks.forEach(deck => {
        console.log(`      - Nome: "${deck.name}", Formato: "${deck.format}"`);
      });
    } else {
      console.log('   ℹ️ Nenhum deck com formato similar encontrado');
    }
  }
  
  console.log('='.repeat(60) + '\n');
}

testCollectionDeck().catch(console.error);
