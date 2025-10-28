// Script para forçar criação de usuário com dados de exemplo
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function forceCreateTestUser() {
  console.log('🔧 Forçando criação de usuário de teste...');
  
  try {
    // Verificar sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError);
      return;
    }
    
    let userId, userEmail;
    
    if (session?.user) {
      // Se há usuário logado, usar os dados dele
      userId = session.user.id;
      userEmail = session.user.email;
      console.log('✅ Usuário logado encontrado:', userEmail);
    } else {
      // Se não há usuário logado, criar um ID de exemplo
      userId = '00000000-0000-0000-0000-000000000001'; // ID de exemplo
      userEmail = 'exemplo@teste.com';
      console.log('⚠️ Nenhum usuário logado, criando usuário de exemplo');
    }
    
    // Verificar se já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar usuário:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log('✅ Usuário já existe no banco:', existingUser);
      return;
    }
    
    // Criar usuário
    const userData = {
      id: userId,
      uuid: uuidv4(),
      display_name: session?.user?.user_metadata?.full_name || "Usuário Teste",
      email: userEmail,
      username: "",
      bio: "Criado automaticamente pelo sistema",
      friends: [],
      created_at: new Date().toISOString()
    };
    
    console.log('📝 Criando usuário com dados:', userData);
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao criar usuário:', insertError);
    } else {
      console.log('✅ Usuário criado com sucesso:', newUser);
    }
    
    // Verificar todos os usuários
    const { data: allUsers } = await supabase.from('users').select('*');
    console.log('📊 Total de usuários no banco:', allUsers?.length || 0);
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

forceCreateTestUser();