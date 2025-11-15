/**
 * Script para atualizar o campo "layout" nas cartas existentes no banco de dados
 * Busca informações da API Scryfall e atualiza as cartas
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eqkqzpbcqxxdlyakgsvr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3F6cGJjcXh4ZGx5YWtnc3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0MTU2MzEsImV4cCI6MjA0NTk5MTYzMX0.yWYLnvBQDJk59e-H1cMT7UYDSkmTcZjhCCWaS0xDRHg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateCardLayouts() {
  try {
    console.log('🔄 Buscando todas as cartas do banco...');
    
    // Buscar todas as cartas que não têm layout ou têm layout null
    const { data: cards, error } = await supabase
      .from('deck_cards')
      .select('id, scryfall_id, card_name, layout')
      .or('layout.is.null,layout.eq.');

    if (error) {
      console.error('❌ Erro ao buscar cartas:', error);
      return;
    }

    console.log(`✅ Encontradas ${cards.length} cartas para atualizar`);

    let updated = 0;
    let errors = 0;
    let skipped = 0;

    for (const card of cards) {
      try {
        console.log(`\n🔍 Processando: ${card.card_name} (ID: ${card.id})`);

        // Buscar dados da carta na API Scryfall
        const response = await fetch(
          `https://api.scryfall.com/cards/${card.scryfall_id}`
        );

        if (!response.ok) {
          console.log(`⚠️ Carta não encontrada na API: ${card.card_name}`);
          skipped++;
          await sleep(100); // Rate limit
          continue;
        }

        const cardData = await response.json();
        const layout = cardData.layout || 'normal';

        console.log(`   Layout: ${layout}`);

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('deck_cards')
          .update({ layout })
          .eq('id', card.id);

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
          errors++;
        } else {
          console.log(`   ✅ Atualizado com sucesso`);
          updated++;
        }

        // Rate limit da API Scryfall (10 requisições por segundo)
        await sleep(100);

      } catch (err) {
        console.error(`   ❌ Erro ao processar ${card.card_name}:`, err.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log(`   ✅ Atualizadas: ${updated}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`   ⚠️ Ignoradas: ${skipped}`);
    console.log(`   📝 Total: ${cards.length}`);
    console.log('='.repeat(50));

  } catch (err) {
    console.error('❌ Erro fatal:', err);
  }
}

// Executar
console.log('🚀 Iniciando migração de layouts...\n');
updateCardLayouts();
