// Script para verificar o estado de autenticação no Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygzyshbfmcwegxgqcuwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenlzaGJmbWN3ZWd4Z3FjdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDIxOTgsImV4cCI6MjA3NjIxODE5OH0.KNJbGlO38w0cp61VA0GJ_-UpwBfZ13u1plZ_PT4LRk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuth() {
  console.log('🔐 Verificando estado de autenticação...');
  
  try {
    // Verificar sessão atual
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('📊 Sessão atual:', session ? {
      user: session.user.id,
      email: session.user.email,
      created_at: session.user.created_at
    } : 'Nenhuma sessão ativa');
    
    if (error) {
      console.error('❌ Erro:', error);
    }

    // Verificar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('👤 Usuário atual:', user ? {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    } : 'Nenhum usuário logado');
    
    if (userError) {
      console.error('❌ Erro do usuário:', userError);
    }

    return { session, user };
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

checkAuth();