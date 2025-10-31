// Script para adicionar coluna display_order à tabela decks
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addDisplayOrderColumn() {
  console.log('🔧 Adicionando coluna display_order à tabela decks...\n');

  try {
    // Nota: Não podemos executar ALTER TABLE diretamente via client JS
    // Você precisa executar o SQL no Supabase Dashboard -> SQL Editor
    console.log('⚠️  ATENÇÃO: Este script não pode adicionar a coluna automaticamente.');
    console.log('📋 Por favor, copie e execute o seguinte SQL no Supabase Dashboard:\n');
    console.log('─'.repeat(70));
    console.log(`
-- Adicionar coluna display_order à tabela decks
ALTER TABLE decks 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Criar índice para melhorar performance de ordenação
CREATE INDEX IF NOT EXISTS idx_decks_display_order ON decks(user_id, display_order);

-- Atualizar decks existentes com valores baseados na data de criação
UPDATE decks 
SET display_order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM decks
) AS subquery
WHERE decks.id = subquery.id
AND decks.display_order = 0;
    `);
    console.log('─'.repeat(70));
    console.log('\n📍 Passos:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/editor');
    console.log('2. Clique em "SQL Editor" no menu lateral');
    console.log('3. Cole o SQL acima');
    console.log('4. Clique em "Run" (ou pressione Ctrl+Enter)');
    console.log('5. Verifique se a mensagem de sucesso aparece');
    console.log('\n✅ Após executar o SQL, teste novamente a funcionalidade de reordenação!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addDisplayOrderColumn();
