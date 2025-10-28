// Script para fazer login e criar usuário automaticamente
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function loginAndCreateUser() {
  console.log('🔐 Fazendo login e criando usuário...');
  
  try {
    // Tentar fazer login com o usuário de teste
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'teste@exemplo.com',
      password: '123456'
    });
    
    if (loginError) {
      console.log('⚠️ Usuário não existe, tentando criar conta...');
      
      // Se não conseguir fazer login, criar a conta
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: 'teste@exemplo.com',
        password: '123456',
        options: {
          data: {
            full_name: 'Usuário Teste DeckMaster'
          }
        }
      });
      
      if (signupError) {
        console.error('❌ Erro ao criar conta:', signupError);
        return;
      }
      
      console.log('✅ Conta criada:', signupData.user?.email);
    } else {
      console.log('✅ Login realizado:', loginData.user?.email);
    }
    
    // Aguardar um pouco para garantir que a sessão foi estabelecida
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error('❌ Não foi possível obter sessão');
      return;
    }
    
    console.log('👤 Usuário autenticado:', session.user.email, 'ID:', session.user.id);
    
    // Verificar se usuário já existe na tabela users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar usuário na tabela:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log('✅ Usuário já existe na tabela users:', existingUser);
    } else {
      console.log('📝 Criando registro na tabela users...');
      
      // Criar usuário na tabela
      const userData = {
        id: session.user.id,
        uuid: uuidv4(),
        display_name: session.user.user_metadata?.full_name || "Usuário Teste",
        email: session.user.email,
        username: "",
        bio: "Usuário criado automaticamente",
        friends: [],
        created_at: new Date().toISOString()
      };
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao criar registro do usuário:', insertError);
      } else {
        console.log('✅ Registro criado com sucesso:', newUser);
      }
    }
    
    // Listar todos os usuários
    const { data: allUsers } = await supabase.from('users').select('*');
    console.log('📊 Total de usuários no banco:', allUsers?.length || 0);
    if (allUsers && allUsers.length > 0) {
      console.log('👥 Usuários encontrados:');
      allUsers.forEach(user => {
        console.log(`  - ${user.display_name} (${user.email})`);
      });
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

loginAndCreateUser();