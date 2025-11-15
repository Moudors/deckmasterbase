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
  try {
    const redirectTo = `${window.location.origin}/`;

    console.log('=== INICIANDO GOOGLE OAUTH ===');
    console.log('Redirect URL:', redirectTo);
    console.log('Origin:', window.location.origin);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
      }
    });

    if (error) {
      console.error('=== ERRO OAUTH ===');
      console.error('Error:', error);
      console.error('Message:', error.message);
      throw error;
    }

    console.log('=== OAUTH SUCESSO ===');
    console.log('Data:', data);
    console.log('URL:', data.url);
    
    return data;
  } catch (err) {
    console.error('=== EXCEPTION ===');
    console.error(err);
    throw err;
  }
}

// Reset de senha - envia email
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('❌ Erro ao enviar email de reset:', error);
    throw error;
  }

  console.log('✅ Email de reset enviado com sucesso');
  return data;
}

// Atualizar senha (após clicar no link do email)
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    console.error('❌ Erro ao atualizar senha:', error);
    throw error;
  }

  console.log('✅ Senha atualizada com sucesso');
  return data;
}

// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}