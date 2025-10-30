// src/authSupabase.ts
import { supabase } from "./supabase";

// Nota: A criação do documento do usuário agora é feita automaticamente
// no supabase.ts quando o onAuthStateChanged é disparado

// Criar usuário com email/senha
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    const user = {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.user_metadata?.display_name || "",
      photoURL: data.user.user_metadata?.avatar_url || null
    };
    
    // A criação do documento é feita automaticamente no supabase.ts
    return user;
  }

  throw new Error('Erro ao criar usuário');
}

// Login com email/senha
export async function signIn(email: string, password: string) {
  console.log('🔐 Tentando fazer login com:', email);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Erro no login:', error);
    throw error;
  }

  if (data.user) {
    console.log('✅ Login realizado com sucesso:', data.user.email);
    
    const user = {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.user_metadata?.display_name || data.user.user_metadata?.full_name || "",
      photoURL: data.user.user_metadata?.avatar_url || null
    };
    
    // A criação do documento é feita automaticamente no supabase.ts
    return user;
  }

  throw new Error('Erro ao fazer login');
}

// Login com Google
export async function signInWithGoogle() {
  // Determina a URL de redirect baseada no ambiente
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  let redirectTo;
  if (isLocalhost) {
    // Para desenvolvimento local
    redirectTo = `${window.location.protocol}//${window.location.host}/`;
  } else {
    // Para produção (Vercel), sempre usa a raiz
    redirectTo = `${window.location.protocol}//${window.location.host}/`;
  }

  console.log('🔄 Login com Google, redirect para:', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
      // Força redirecionamento para a URL especificada
      skipBrowserRedirect: false
    }
  });

  if (error) {
    console.error('❌ Erro ao iniciar OAuth com Google:', error);
    throw error;
  }

  console.log('✅ OAuth iniciado com sucesso');
  
  // O usuário será criado automaticamente quando o callback do OAuth for processado
  // através do listener onAuthStateChange no supabase.ts
  return data;
}

// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}