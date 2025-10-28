// Teste final para verificar se o sistema está funcionando completamente
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Suas credenciais
const USER_EMAIL = 'lucardbff@gmail.com';
const USER_PASSWORD = 'senha1234';

async function testFinalSystem() {
  console.log('🔬 TESTE FINAL DO SISTEMA');
  console.log('========================');
  
  try {
    // 1. Login
    console.log('\n1️⃣ Fazendo login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    
    // 2. Verificar sessão
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error('❌ Sessão não encontrada');
      return;
    }
    
    console.log('✅ Sessão ativa:', session.user.email);
    
    // 3. Verificar dados na tabela users
    console.log('\n2️⃣ Verificando dados do usuário...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar dados do usuário:', userError.message);
      return;
    }
    
    console.log('✅ Dados do usuário encontrados:');
    console.log('   Nome:', userData.display_name);
    console.log('   Email:', userData.email);
    console.log('   ID:', userData.id);
    
    // 4. Simular busca que o useUserProfile fará
    console.log('\n3️⃣ Simulando busca do useUserProfile...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id) // Usando user.id como corrigido
      .single();
    
    if (profileError) {
      console.error('❌ Erro na busca do perfil:', profileError.message);
      return;
    }
    
    console.log('✅ Dados do perfil recuperados com sucesso:');
    console.log('   useUserProfile deveria receber:', profileData);
    
    console.log('\n🎯 RESUMO DO TESTE:');
    console.log('===================');
    console.log('✅ Login funcionando');
    console.log('✅ Usuário criado na tabela users');
    console.log('✅ Busca por user.id funcionando');
    console.log('✅ Sistema pronto para funcionar na aplicação');
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Faça login na aplicação com lucardbff@gmail.com');
    console.log('2. Os dados do perfil devem aparecer no UserMenu');
    console.log('3. Se não aparecer, verifique o console do navegador');
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testFinalSystem();