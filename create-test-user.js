// Script para criar um usuário de teste no Supabase
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  console.log('👤 Criando usuário de teste...');
  
  try {
    // Criar um usuário de teste - você deve substituir pelo seu UID real
    const userData = {
      id: 'test-user-id-123', // Substitua pelo UID real do usuário logado
      uuid: uuidv4(),
      display_name: 'Usuário Teste',
      email: 'teste@exemplo.com', // Substitua pelo email real
      username: 'user_teste',
      bio: 'Este é um usuário de teste',
      friends: [],
      created_at: new Date().toISOString()
    };

    console.log('📝 Inserindo usuário:', userData);

    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
    } else {
      console.log('✅ Usuário criado com sucesso:', data);
    }

    // Verificar se foi criado
    const { data: allUsers } = await supabase.from('users').select('*');
    console.log('📊 Todos os usuários:', allUsers);

  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

createTestUser();