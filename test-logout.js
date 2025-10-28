// Teste de logout
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogout() {
  console.log('🧪 Testando sistema de logout...');
  
  try {
    // Verificar sessão atual
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError);
      return;
    }
    
    console.log('📊 Sessão atual:', currentSession ? 'Usuário logado' : 'Sem usuário');
    
    if (currentSession) {
      console.log('🚪 Fazendo logout...');
      const { error: logoutError } = await supabase.auth.signOut();
      
      if (logoutError) {
        console.error('❌ Erro no logout:', logoutError);
      } else {
        console.log('✅ Logout realizado com sucesso');
        
        // Verificar se sessão foi removida
        const { data: { session: afterLogout } } = await supabase.auth.getSession();
        console.log('📊 Sessão após logout:', afterLogout ? 'Ainda logado' : 'Logout confirmado');
      }
    } else {
      console.log('ℹ️ Nenhum usuário logado para fazer logout');
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testLogout();