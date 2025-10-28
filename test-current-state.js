// Teste para verificar estado atual do usuário na aplicação
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCurrentState() {
  console.log('🔍 Verificando estado atual...');
  
  try {
    // Verificar se há sessão ativa
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      return;
    }
    
    if (session) {
      console.log('✅ Usuário está logado:');
      console.log('- ID:', session.user.id);
      console.log('- Email:', session.user.email);
      console.log('- Criado em:', new Date(session.user.created_at).toLocaleString());
      
      // Verificar se existe no banco users
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('⚠️ Usuário autenticado mas SEM perfil no banco de dados');
          console.log('- Isso explicaria porque o UserMenu pode não aparecer');
        } else {
          console.error('❌ Erro ao buscar perfil:', profileError);
        }
      } else {
        console.log('✅ Perfil encontrado no banco:', userProfile);
      }
    } else {
      console.log('ℹ️ Nenhum usuário logado');
    }
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testCurrentState();