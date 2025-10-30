// Script de teste para verificar sistema de Trade
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ymzkvlgdfhvfwgakqokn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltemt2bGdkZmh2ZndnYWtxb2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MzQ1NjMsImV4cCI6MjA0NjQxMDU2M30.nqZARlxHLYOJn-v1F4zF8OBLDwZdDZA8kXOVAZR9Sxc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTradeSystem() {
  console.log("\n🔍 ===== TESTE DO SISTEMA DE TRADE =====\n");
  
  try {
    // 1. Verificar se tabela friendships existe
    console.log("1️⃣ Verificando tabela friendships...");
    const { data: friendships, error: friendError } = await supabase
      .from('friendships')
      .select('*')
      .limit(5);
    
    if (friendError) {
      console.error("❌ Erro ao buscar friendships:", friendError.message);
      console.log("\n⚠️  A tabela 'friendships' provavelmente não existe!");
      console.log("📝 Execute o arquivo: create_friendships_table.sql no Supabase\n");
    } else {
      console.log("✅ Tabela friendships existe!");
      console.log(`📊 Total de amizades encontradas: ${friendships?.length || 0}`);
      if (friendships && friendships.length > 0) {
        console.log("👥 Amizades:", friendships);
      }
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // 2. Verificar cartas com is_transparent
    console.log("2️⃣ Verificando cartas com is_transparent=true...");
    const { data: transparentCards, error: cardsError } = await supabase
      .from('deck_cards')
      .select(`
        id,
        card_name,
        scryfall_id,
        is_transparent,
        deck_id,
        decks!inner(
          id,
          name,
          user_id,
          users!inner(id, display_name)
        )
      `)
      .eq('is_transparent', true)
      .limit(10);
    
    if (cardsError) {
      console.error("❌ Erro ao buscar cartas transparentes:", cardsError.message);
    } else {
      console.log(`✅ Encontradas ${transparentCards?.length || 0} cartas com is_transparent=true`);
      if (transparentCards && transparentCards.length > 0) {
        console.log("\n📋 Cartas transparentes:");
        transparentCards.forEach(card => {
          console.log(`  - ${card.card_name} (${card.scryfall_id})`);
          console.log(`    Dono: ${card.decks.users.display_name}`);
          console.log(`    Deck: ${card.decks.name}`);
        });
      } else {
        console.log("\n⚠️  Nenhuma carta com is_transparent=true encontrada!");
        console.log("💡 Dica: Swipe para direita em uma carta para marcá-la como transparente");
      }
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // 3. Verificar decks Trade
    console.log("3️⃣ Verificando decks com formato 'Trade'...");
    const { data: tradeDecks, error: tradeError } = await supabase
      .from('decks')
      .select(`
        id,
        name,
        format,
        user_id,
        users!inner(id, display_name)
      `)
      .eq('format', 'Trade')
      .limit(5);
    
    if (tradeError) {
      console.error("❌ Erro ao buscar decks Trade:", tradeError.message);
    } else {
      console.log(`✅ Encontrados ${tradeDecks?.length || 0} decks Trade`);
      if (tradeDecks && tradeDecks.length > 0) {
        console.log("\n📦 Decks Trade:");
        tradeDecks.forEach(deck => {
          console.log(`  - ${deck.name} (ID: ${deck.id})`);
          console.log(`    Dono: ${deck.users.display_name}`);
        });
      } else {
        console.log("\n⚠️  Nenhum deck Trade encontrado!");
        console.log("💡 Dica: Crie um deck com formato 'Trade' no app");
      }
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // 4. Verificar cartas em decks Trade
    console.log("4️⃣ Verificando cartas em decks Trade...");
    if (tradeDecks && tradeDecks.length > 0) {
      const tradeDeckIds = tradeDecks.map(d => d.id);
      const { data: tradeCards, error: tradeCardsError } = await supabase
        .from('deck_cards')
        .select('id, card_name, scryfall_id, deck_id')
        .in('deck_id', tradeDeckIds)
        .limit(10);
      
      if (tradeCardsError) {
        console.error("❌ Erro ao buscar cartas de Trade:", tradeCardsError.message);
      } else {
        console.log(`✅ Encontradas ${tradeCards?.length || 0} cartas em decks Trade`);
        if (tradeCards && tradeCards.length > 0) {
          console.log("\n🎴 Cartas em Trade:");
          tradeCards.forEach(card => {
            console.log(`  - ${card.card_name} (${card.scryfall_id})`);
          });
        }
      }
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("\n✅ TESTE CONCLUÍDO!\n");
    
  } catch (error) {
    console.error("\n❌ Erro geral:", error);
  }
}

testTradeSystem();
