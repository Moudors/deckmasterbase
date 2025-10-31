/**
 * 🔵 TESTE: Sistema de Match Reverso (Bolinha Azul)
 * 
 * Testa se cartas com is_transparent=true no deck pessoal
 * ganham bolinha azul quando amigos têm essa mesma carta no Trade
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://swbxgjytdwwgrdsjhvtq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Ynhnanl0ZHd3Z3Jkc2podnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MjIzMzEsImV4cCI6MjA0ODM5ODMzMX0.oCQVw9GZfTwY82S8Uam3yNqUNhCYVYa6S1rUjHZ9MJU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testReverseMatchSystem() {
  console.log('🔵 TESTANDO SISTEMA DE MATCH REVERSO (Bolinha Azul)\n');
  console.log('='.repeat(70));
  
  try {
    // 1. Buscar usuário atual (vou usar um ID de teste)
    console.log('\n1️⃣ Buscando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name')
      .limit(2);
    
    if (usersError) throw usersError;
    
    if (!users || users.length < 2) {
      console.log('❌ Precisa de pelo menos 2 usuários no sistema para testar');
      return;
    }
    
    const user1 = users[0];
    const user2 = users[1];
    
    console.log(`✅ Usuário 1: ${user1.display_name} (${user1.id})`);
    console.log(`✅ Usuário 2: ${user2.display_name} (${user2.id})`);
    
    // 2. Verificar amizade
    console.log('\n2️⃣ Verificando amizade entre usuários...');
    const { data: friendship, error: friendError } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user1.id},friend_id.eq.${user1.id}`)
      .or(`user_id.eq.${user2.id},friend_id.eq.${user2.id}`)
      .eq('status', 'accepted')
      .limit(1);
    
    if (friendError) throw friendError;
    
    if (!friendship || friendship.length === 0) {
      console.log('⚠️  Usuários não são amigos');
      console.log('💡 Dica: Adicione amizade manualmente no Supabase');
    } else {
      console.log('✅ Usuários são amigos');
    }
    
    // 3. Buscar decks pessoais do user1
    console.log(`\n3️⃣ Buscando decks pessoais de ${user1.display_name}...`);
    const { data: user1Decks, error: decksError1 } = await supabase
      .from('decks')
      .select('id, name, format')
      .eq('user_id', user1.id)
      .neq('format', 'Trade')
      .neq('format', 'Trades')
      .limit(5);
    
    if (decksError1) throw decksError1;
    
    if (!user1Decks || user1Decks.length === 0) {
      console.log('❌ Usuário 1 não tem decks pessoais');
      return;
    }
    
    console.log(`✅ Encontrados ${user1Decks.length} decks pessoais:`);
    user1Decks.forEach(d => console.log(`   - ${d.name} (${d.format})`));
    
    // 4. Buscar cartas com is_transparent=true nesses decks
    console.log(`\n4️⃣ Buscando cartas transparentes de ${user1.display_name}...`);
    const deckIds1 = user1Decks.map(d => d.id);
    
    const { data: transparentCards, error: cardsError } = await supabase
      .from('deck_cards')
      .select('id, card_name, scryfall_id, deck_id, is_transparent')
      .in('deck_id', deckIds1)
      .eq('is_transparent', true);
    
    if (cardsError) throw cardsError;
    
    if (!transparentCards || transparentCards.length === 0) {
      console.log('⚠️  Nenhuma carta transparente encontrada');
      console.log('💡 Dica: Swipe direita em uma carta para marcar como wanted');
      return;
    }
    
    console.log(`✅ Encontradas ${transparentCards.length} cartas transparentes:`);
    transparentCards.forEach(c => console.log(`   - ${c.card_name} (${c.scryfall_id.substring(0, 8)}...)`));
    
    // 5. Buscar deck Trade do user2
    console.log(`\n5️⃣ Buscando deck Trade de ${user2.display_name}...`);
    const { data: user2TradeDecks, error: decksError2 } = await supabase
      .from('decks')
      .select('id, name, format')
      .eq('user_id', user2.id)
      .or('format.eq.Trade,format.eq.Trades');
    
    if (decksError2) throw decksError2;
    
    if (!user2TradeDecks || user2TradeDecks.length === 0) {
      console.log('⚠️  Usuário 2 não tem deck Trade');
      console.log('💡 Dica: Crie um deck com formato "Trade"');
      return;
    }
    
    const tradeDeck = user2TradeDecks[0];
    console.log(`✅ Deck Trade encontrado: ${tradeDeck.name}`);
    
    // 6. Buscar cartas no deck Trade que fazem match
    console.log('\n6️⃣ Buscando matches...');
    const transparentScryfallIds = transparentCards.map(c => c.scryfall_id);
    
    const { data: matchingCards, error: matchError } = await supabase
      .from('deck_cards')
      .select('id, card_name, scryfall_id, deck_id')
      .eq('deck_id', tradeDeck.id)
      .in('scryfall_id', transparentScryfallIds);
    
    if (matchError) throw matchError;
    
    if (!matchingCards || matchingCards.length === 0) {
      console.log('⚠️  Nenhum match encontrado');
      console.log('💡 Dica: Adicione uma das cartas transparentes no deck Trade do amigo');
      return;
    }
    
    console.log(`\n🎯 MATCHES ENCONTRADOS: ${matchingCards.length}`);
    console.log('='.repeat(70));
    
    matchingCards.forEach(match => {
      const originalCard = transparentCards.find(c => c.scryfall_id === match.scryfall_id);
      console.log(`\n🔵 MATCH REVERSO DETECTADO:`);
      console.log(`   Carta: ${match.card_name}`);
      console.log(`   ${user1.display_name} tem no deck: ${user1Decks.find(d => d.id === originalCard.deck_id)?.name}`);
      console.log(`   ${user2.display_name} tem no deck: ${tradeDeck.name}`);
      console.log(`   ✅ Bolinha azul deve aparecer!`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 TESTE CONCLUÍDO!\n');
    console.log('📝 Resumo:');
    console.log(`   - ${transparentCards.length} cartas transparentes no deck de ${user1.display_name}`);
    console.log(`   - ${matchingCards.length} matches encontrados no deck Trade de ${user2.display_name}`);
    console.log(`   - Bolinha azul deve aparecer nas cartas: ${matchingCards.map(c => c.card_name).join(', ')}`);
    console.log('\n💡 Próximo passo: Abra o deck no app e verifique as bolinhas azuis!');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error(error);
  }
}

testReverseMatchSystem();
