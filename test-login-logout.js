// Teste completo de login/logout
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginLogout() {
  console.log('🧪 Teste completo de login/logout...');
  
  const testEmail = 'teste@exemplo.com';
  const testPassword = 'senha123456';
  
  try {
    // 1. Tentar fazer login
    console.log('1️⃣ Tentando fazer login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      if (signInError.code === 'email_not_confirmed') {
        console.log('⚠️ Email não confirmado - tentando criar conta...');
        
        // Tentar criar conta
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
        });
        
        if (signUpError) {
          console.error('❌ Erro ao criar conta:', signUpError.message);
          return;
        }
        
        console.log('📧 Conta criada - necessário confirmar email');
        console.log('ℹ️ Para este teste, vamos pular a confirmação');
        return;
      } else {
        console.error('❌ Erro no login:', signInError.message);
        return;
      }
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('- User ID:', signInData.user.id);
    console.log('- Email:', signInData.user.email);

    // 2. Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Verificar sessão
    const { data: { session } } = await supabase.auth.getSession();
    console.log('📊 Sessão ativa:', session ? 'Sim' : 'Não');

    // 4. Fazer logout
    console.log('2️⃣ Fazendo logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.error('❌ Erro no logout:', logoutError);
    } else {
      console.log('✅ Logout realizado com sucesso!');
    }

    // 5. Verificar se sessão foi removida
    const { data: { session: afterLogout } } = await supabase.auth.getSession();
    console.log('📊 Sessão após logout:', afterLogout ? 'Ainda ativa' : 'Removida');

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testLoginLogout();