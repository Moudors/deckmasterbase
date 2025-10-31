// Teste para verificar se a coluna display_order existe
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDisplayOrder() {
  console.log('🔍 Verificando coluna display_order...\n');

  try {
    // Buscar primeiro deck para ver se tem a coluna
    const { data: decks, error } = await supabase
      .from('decks')
      .select('id, name, display_order, created_at')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar decks:', error.message);
      
      if (error.message.includes('display_order')) {
        console.log('\n⚠️  A coluna display_order NÃO existe!');
        console.log('\n📋 Execute este SQL no Supabase Dashboard:\n');
        console.log('─'.repeat(70));
        console.log(`
ALTER TABLE decks 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_decks_display_order ON decks(owner_id, display_order);

UPDATE decks 
SET display_order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at) as row_num
  FROM decks
) AS subquery
WHERE decks.id = subquery.id
AND decks.display_order = 0;
        `);
        console.log('─'.repeat(70));
      }
      return;
    }

    console.log('✅ Coluna display_order existe!\n');
    console.log('📊 Primeiros 5 decks:');
    decks.forEach(deck => {
      console.log(`  - ${deck.name}`);
      console.log(`    ID: ${deck.id}`);
      console.log(`    display_order: ${deck.display_order}`);
      console.log(`    created_at: ${deck.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkDisplayOrder();
