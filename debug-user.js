// Debug script para testar conexão do Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🧪 Testando conexão com Supabase...');
  
  try {
    // Teste de conexão básica
    const { data, error } = await supabase.from('users').select('*').limit(5);
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Dados encontrados:', data);
    
    if (error) {
      console.error('❌ Erro:', error);
    }
    
    return data;
  } catch (err) {
    console.error('❌ Erro de conexão:', err);
  }
}

testConnection();