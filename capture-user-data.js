// Script para capturar dados do usuário real e testar sistema completo
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Suas credenciais reais
const USER_EMAIL = 'lucardbff@gmail.com';
const USER_PASSWORD = 'senha1234';

async function testCompleteUserFlow() {
  console.log('🧪 Testando fluxo completo do usuário...');
  console.log('📧 Email:', USER_EMAIL);
  
  try {
    // Etapa 1: Fazer logout se houver sessão ativa
    console.log('\n1️⃣ Fazendo logout de sessões anteriores...');
    await supabase.auth.signOut();
    
    // Etapa 2: Tentar fazer login
    console.log('\n2️⃣ Tentando fazer login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
    
    if (loginError) {
      console.log('⚠️ Login falhou, tentando criar conta:', loginError.message);
      
      // Se login falhar, tentar criar conta
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        options: {
          data: {
            full_name: 'Lucas Araujo'
          }
        }
      });
      
      if (signupError) {
        console.error('❌ Erro ao criar conta:', signupError);
        return;
      }
      
      console.log('✅ Conta criada com sucesso!');
      console.log('📧 Verifique seu email para confirmar a conta');
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    
    // Etapa 3: Aguardar estabelecimento da sessão
    console.log('\n3️⃣ Aguardando estabelecimento da sessão...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Etapa 4: Verificar sessão atual
    console.log('\n4️⃣ Verificando sessão atual...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError);
      return;
    }
    
    if (!session?.user) {
      console.error('❌ Nenhuma sessão ativa encontrada');
      return;
    }
    
    console.log('✅ Sessão ativa encontrada!');
    console.log('📊 Dados da sessão:');
    console.log('  - ID:', session.user.id);
    console.log('  - Email:', session.user.email);
    console.log('  - Email confirmado:', session.user.email_confirmed_at ? 'Sim' : 'Não');
    console.log('  - Último login:', session.user.last_sign_in_at);
    console.log('  - Metadata:', JSON.stringify(session.user.user_metadata, null, 2));
    
    // Etapa 5: Verificar se usuário existe na tabela users
    console.log('\n5️⃣ Verificando registro na tabela users...');
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
      console.log('✅ Usuário encontrado na tabela users:');
      console.log('  - ID:', existingUser.id);
      console.log('  - Nome:', existingUser.display_name);
      console.log('  - Email:', existingUser.email);
      console.log('  - Username:', existingUser.username);
      console.log('  - Bio:', existingUser.bio);
      console.log('  - Amigos:', existingUser.friends?.length || 0);
      console.log('  - Criado em:', existingUser.created_at);
    } else {
      console.log('⚠️ Usuário não encontrado na tabela users, criando...');
      
      // Etapa 6: Criar usuário na tabela
      const userData = {
        id: session.user.id,
        uuid: uuidv4(),
        display_name: session.user.user_metadata?.full_name || "Lucas Araujo",
        email: session.user.email,
        username: "",
        bio: "Usuário DeckMaster",
        friends: [],
        created_at: new Date().toISOString()
      };
      
      console.log('📝 Criando registro com dados:', userData);
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao criar registro do usuário:', insertError);
      } else {
        console.log('✅ Registro criado com sucesso!');
        console.log('🎉 Dados do novo usuário:', newUser);
      }
    }
    } else {
      console.log('✅ Usuário EXISTE na tabela users:');
      console.log('📝 Display Name:', userData.display_name);
      console.log('👤 Username:', userData.username || 'Não definido');
      console.log('📄 Bio:', userData.bio || 'Não definido');
      console.log('👥 Amigos:', userData.friends?.length || 0);
      console.log('📅 Criado em:', userData.created_at);
    }
    
    // Verificar todos os usuários na tabela
    console.log('\n📊 TODOS OS USUÁRIOS NA TABELA:');
    console.log('===============================');
    
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, display_name, email, created_at');
    
    if (allUsersError) {
      console.error('❌ Erro ao buscar todos os usuários:', allUsersError);
    } else {
      console.log(`📈 Total de usuários: ${allUsers?.length || 0}`);
      if (allUsers && allUsers.length > 0) {
        allUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.display_name} (${user.email}) - ID: ${user.id.substring(0, 8)}...`);
        });
      }
    }
    
    // Criar dados para teste
    console.log('\n🧪 DADOS PARA TESTES:');
    console.log('====================');
    console.log('// Use estes dados para criar testes específicos:');
    console.log(`const testUserData = {`);
    console.log(`  id: "${session.user.id}",`);
    console.log(`  email: "${session.user.email}",`);
    console.log(`  provider: "${session.user.app_metadata?.provider || 'email'}",`);
    console.log(`  fullName: "${session.user.user_metadata?.full_name || 'Usuário Teste'}",`);
    console.log(`  existsInUsersTable: ${userData ? 'true' : 'false'}`);
    console.log(`};`);
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

captureUserData();