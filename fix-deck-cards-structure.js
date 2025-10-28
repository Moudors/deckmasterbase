// Script para adicionar coluna card_faces à tabela deck_cards
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addCardFacesColumn() {
  console.log('🔧 Adicionando coluna card_faces à tabela deck_cards...');
  
  try {
    // Verificar se a coluna já existe
    const { data: columns, error: checkError } = await supabase
      .rpc('get_table_columns', { table_name: 'deck_cards' });
    
    if (checkError) {
      console.log('⚠️ Não foi possível verificar colunas existentes, tentando adicionar coluna...');
    } else {
      const hasCardFaces = columns?.some(col => col.column_name === 'card_faces');
      if (hasCardFaces) {
        console.log('✅ Coluna card_faces já existe na tabela deck_cards');
        return;
      }
    }
    
    // Tentar adicionar a coluna usando SQL direto
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE deck_cards ADD COLUMN IF NOT EXISTS card_faces JSONB DEFAULT NULL;' 
      });
    
    if (error) {
      console.error('❌ Erro ao adicionar coluna via RPC:', error);
      
      // Método alternativo: tentar inserir uma linha com card_faces para forçar a criação
      console.log('🔄 Tentando método alternativo...');
      
      // Primeiro fazer login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: 'lucardbff@gmail.com',
        password: 'senha1234'
      });
      
      if (loginError) {
        console.error('❌ Erro no login:', loginError);
        return;
      }
      
      console.log('✅ Login realizado para teste de estrutura');
      
      // Tentar inserir um registro de teste para verificar a estrutura
      const testCard = {
        deck_id: '00000000-0000-0000-0000-000000000000', // UUID temporário
        card_name: 'Teste de Estrutura',
        quantity: 1,
        card_faces: null
      };
      
      const { error: insertError } = await supabase
        .from('deck_cards')
        .insert(testCard);
      
      if (insertError) {
        if (insertError.message.includes('card_faces')) {
          console.error('❌ Confirmado: coluna card_faces não existe na tabela');
          console.log('💡 SOLUÇÃO: Execute o seguinte SQL no Dashboard do Supabase:');
          console.log('   ALTER TABLE deck_cards ADD COLUMN card_faces JSONB DEFAULT NULL;');
        } else {
          console.log('ℹ️ Erro esperado (UUID inválido):', insertError.message);
          console.log('✅ A estrutura da tabela parece estar correta');
        }
      } else {
        console.log('✅ Teste de inserção bem-sucedido');
        // Limpar o registro de teste
        await supabase
          .from('deck_cards')
          .delete()
          .eq('card_name', 'Teste de Estrutura');
      }
      
    } else {
      console.log('✅ Coluna card_faces adicionada com sucesso!');
    }
    
    // Verificar a estrutura atual
    console.log('\n📊 Verificando estrutura atual da tabela deck_cards...');
    const { data: tableInfo, error: infoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'deck_cards')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (infoError) {
      console.log('⚠️ Não foi possível verificar estrutura:', infoError.message);
    } else {
      console.log('📋 Colunas da tabela deck_cards:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
    console.log('\n💡 INSTRUÇÕES MANUAIS:');
    console.log('1. Acesse o Dashboard do Supabase');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute: ALTER TABLE deck_cards ADD COLUMN card_faces JSONB DEFAULT NULL;');
  }
}

addCardFacesColumn();