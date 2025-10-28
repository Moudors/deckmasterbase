// Script para fazer login de teste e verificar criação de usuário
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔐 Testando sistema de login...');
  
  const testEmail = 'teste@exemplo.com';
  const testPassword = 'senha123456';
  
  try {
    // Primeiro, vamos tentar criar um usuário
    console.log('📝 Criando usuário de teste...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError) {
      console.log('ℹ️ Erro no signup (provavelmente usuário já existe):', signUpError.message);
    } else {
      console.log('✅ Usuário criado:', signUpData.user?.email);
    }

    // Agora tentar fazer login
    console.log('🔑 Fazendo login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error('❌ Erro no login:', signInError);
      return;
    }

    console.log('✅ Login bem-sucedido:', signInData.user?.email);

    // Verificar se usuário foi criado na tabela users
    setTimeout(async () => {
      console.log('🔍 Verificando tabela users...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('id', signInData.user.id);

      if (usersError) {
        console.error('❌ Erro ao buscar usuário:', usersError);
      } else {
        console.log('👤 Usuário na tabela users:', users);
      }
    }, 2000); // Aguarda 2 segundos para a criação automática

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testLogin();