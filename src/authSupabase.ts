// src/authSupabase.ts
import { supabase, auth } from "./supabase";

// Cria documento do usuário no Supabase (tabela users)
async function createUserDocument(user: any) {
  // Verifica se o usuário já existe
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.uid)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Erro ao verificar usuário:', checkError);
    return;
  }

  if (!existingUser) {
    // Criar novo usuário na tabela users
    const { error } = await supabase
      .from('users')
      .insert({
        id: user.uid,
        display_name: user.displayName || "",
        email: user.email,
        username: "",
        bio: "",
        friends: [],
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao criar usuário:', error);
    }
  }
}

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
    
    await createUserDocument(user);
    return user;
  }

  throw new Error('Erro ao criar usuário');
}

// Login com email/senha
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    const user = {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.user_metadata?.display_name || data.user.user_metadata?.full_name || "",
      photoURL: data.user.user_metadata?.avatar_url || null
    };
    
    await createUserDocument(user);
    return user;
  }

  throw new Error('Erro ao fazer login');
}

// Login com Google
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) throw error;

  // O usuário será criado automaticamente quando o callback do OAuth for processado
  // através do listener onAuthStateChange no supabase.ts
  
  return data;
}

// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}