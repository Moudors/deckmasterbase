// Teste para simular problema de refresh
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRefreshScenario() {
  console.log('🔄 Testando cenário de refresh...');
  
  try {
    console.log('⏰ Simulando delay de rede...');
    
    // Simular a verificação que acontece no refresh
    const startTime = Date.now();
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    const endTime = Date.now();
    console.log(`⏱️ Tempo de resposta: ${endTime - startTime}ms`);
    
    if (error) {
      console.error('❌ Erro na verificação:', error);
      return;
    }
    
    if (session) {
      console.log('✅ Sessão encontrada:', {
        user_id: session.user.id,
        email: session.user.email,
        expires_at: new Date(session.expires_at * 1000).toLocaleString()
      });
    } else {
      console.log('ℹ️ Nenhuma sessão ativa (usuário não logado)');
    }
    
    // Testar listener de mudanças
    console.log('🔔 Configurando listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`📢 Auth state change: ${event}, sessão: ${session ? 'presente' : 'ausente'}`);
    });
    
    // Aguardar um pouco e depois limpar
    setTimeout(() => {
      subscription.unsubscribe();
      console.log('✅ Teste concluído');
    }, 2000);
    
  } catch (err) {
    console.error('❌ Erro no teste:', err);
  }
}

testRefreshScenario();