// Script para testar cartas dupla face no banco de dados
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCardFaces() {
  console.log('🔍 Testando cartas dupla face no banco...');
  
  try {
    // Login
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: 'lucardbff@gmail.com',
      password: 'senha1234'
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      return;
    }
    
    // Buscar todas as cartas com card_faces não nulo
    console.log('\n📋 Buscando cartas com card_faces...');
    const { data: cardsWithFaces, error: facesError } = await supabase
      .from('deck_cards')
      .select('card_name, card_faces, image_url')
      .not('card_faces', 'is', null);
    
    if (facesError) {
      console.error('❌ Erro ao buscar cartas com faces:', facesError);
    } else {
      console.log(`✅ Encontradas ${cardsWithFaces?.length || 0} cartas com card_faces`);
      
      if (cardsWithFaces && cardsWithFaces.length > 0) {
        cardsWithFaces.forEach((card, index) => {
          console.log(`\n${index + 1}. ${card.card_name}`);
          console.log('   Faces:', Array.isArray(card.card_faces) ? card.card_faces.length : 'formato inválido');
          if (Array.isArray(card.card_faces)) {
            card.card_faces.forEach((face, faceIndex) => {
              console.log(`     Face ${faceIndex + 1}: ${face.name || 'Sem nome'}`);
            });
          }
        });
      }
    }
    
    // Buscar todas as cartas para verificar estrutura
    console.log('\n📊 Verificando estrutura geral...');
    const { data: allCards, error: allError } = await supabase
      .from('deck_cards')
      .select('card_name, card_faces')
      .limit(5);
    
    if (allError) {
      console.error('❌ Erro ao buscar cartas:', allError);
    } else {
      console.log(`✅ Amostra de ${allCards?.length || 0} cartas:`);
      allCards?.forEach((card, index) => {
        console.log(`  ${index + 1}. ${card.card_name} - card_faces: ${card.card_faces ? 'Sim' : 'Não'}`);
      });
    }
    
    // Testar inserção de uma carta dupla face de exemplo
    console.log('\n🧪 Testando inserção de carta dupla face...');
    
    // Buscar um deck do usuário para teste
    const { data: userDecks } = await supabase
      .from('decks')
      .select('id, name')
      .limit(1);
    
    if (!userDecks || userDecks.length === 0) {
      console.log('⚠️ Nenhum deck encontrado para teste');
      return;
    }
    
    const testDeck = userDecks[0];
    console.log(`📚 Usando deck: ${testDeck.name}`);
    
    // Dados de uma carta dupla face real (Delver of Secrets)
    const doubleFaceCard = {
      deck_id: testDeck.id,
      card_name: 'Delver of Secrets // Insectile Aberration (TESTE)',
      quantity: 1,
      scryfall_id: '11bf83bb-c95b-4b4f-9a56-ce7a1816307a',
      image_url: 'https://cards.scryfall.io/normal/front/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg',
      mana_cost: '{U}',
      type_line: 'Creature — Human Wizard',
      oracle_text: 'At the beginning of your upkeep, look at the top card of your library.',
      card_faces: [
        {
          name: 'Delver of Secrets',
          mana_cost: '{U}',
          type_line: 'Creature — Human Wizard',
          oracle_text: 'At the beginning of your upkeep, look at the top card of your library. You may reveal that card. If an instant or sorcery card is revealed this way, transform Delver of Secrets.',
          power: '1',
          toughness: '1',
          image_uris: {
            normal: 'https://cards.scryfall.io/normal/front/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg'
          }
        },
        {
          name: 'Insectile Aberration',
          type_line: 'Creature — Human Insect',
          oracle_text: 'Flying',
          power: '3',
          toughness: '2',
          image_uris: {
            normal: 'https://cards.scryfall.io/normal/back/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg'
          }
        }
      ]
    };
    
    const { data: insertedCard, error: insertError } = await supabase
      .from('deck_cards')
      .insert(doubleFaceCard)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao inserir carta teste:', insertError);
    } else {
      console.log('✅ Carta dupla face inserida com sucesso!');
      console.log('📋 Dados inseridos:', insertedCard);
      
      // Buscar a carta inserida para confirmar
      const { data: retrievedCard, error: retrieveError } = await supabase
        .from('deck_cards')
        .select('*')
        .eq('id', insertedCard.id)
        .single();
      
      if (retrieveError) {
        console.error('❌ Erro ao recuperar carta:', retrieveError);
      } else {
        console.log('✅ Carta recuperada do banco:');
        console.log('   Nome:', retrievedCard.card_name);
        console.log('   Faces:', retrievedCard.card_faces?.length || 'Nenhuma');
        if (retrievedCard.card_faces) {
          retrievedCard.card_faces.forEach((face, index) => {
            console.log(`     Face ${index + 1}: ${face.name}`);
          });
        }
      }
      
      // Limpar dados de teste
      await supabase
        .from('deck_cards')
        .delete()
        .eq('id', insertedCard.id);
      
      console.log('🧹 Carta de teste removida');
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testCardFaces();