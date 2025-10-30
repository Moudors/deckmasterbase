// src/supabase.ts
import { createClient } from '@supabase/supabase-js';

console.log('🔄 Carregando configuração do Supabase...');
console.log('Variables encontradas:', {
  REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? 'DEFINIDA' : 'UNDEFINED',
  REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'UNDEFINED'
});

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas');
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl);
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Definida' : 'Não definida');
  console.error('📋 Verificar arquivo .env na raiz do projeto');
  
  // Em vez de crash, criar um cliente básico com fallback
  throw new Error('❌ SUPABASE NÃO CONFIGURADO: Verifique arquivo .env');
}

console.log('✅ Supabase configurado:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Função para criar documento do usuário automaticamente
async function createUserDocumentFromAuth(user: any) {
  console.log('🔎 [createUserDocumentFromAuth] Usuário recebido:', user);
  // Tenta encontrar o campo correto para o id
  const userId = user?.id || user?.uuid || user?.user?.id;
  if (!userId) {
    console.error('❌ createUserDocumentFromAuth: Nenhum campo de id encontrado no objeto user:', user);
    return;
  }

  try {
    // Buscar se o usuário já existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('uuid')
      .eq('uuid', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Erro ao verificar usuário existente:', fetchError);
      return;
    }

    if (existingUser) {
      console.log('ℹ️ Usuário já existe no banco:', user.email);
      return;
    }

    // Criar novo documento do usuário
    const userData = {
  id: userId, // Chave primária
  uuid: userId, // Compatibilidade
      email: user.email,
      display_name: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário',
      username: user.user_metadata?.username || user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário',
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(userData);

    if (insertError) {
      console.error('❌ Erro ao criar documento do usuário:', insertError);
    } else {
      console.log('✅ Documento do usuário criado:', userData.email);
    }

  } catch (error) {
    console.error('❌ Erro inesperado ao criar documento do usuário:', error);
  }
}

// Sistema de compatibilidade simples para auth
export const auth = {
  currentUser: null as any,
  _callbacks: [] as any[],
  
  onAuthStateChanged(callback: (user: any) => void) {
    this._callbacks.push(callback);
    
    // Listener real do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('👤 Auth state changed:', event, session?.user?.email || 'sem usuário');
        
        if (session?.user) {
          this.currentUser = session.user;
          
          // Criar documento do usuário se necessário
          await createUserDocumentFromAuth(session.user);
        } else {
          this.currentUser = null;
        }
        
        // Notificar todos os callbacks
        this._callbacks.forEach(cb => cb(this.currentUser));
      }
    );
    
    // Retornar função de cleanup
    return () => {
      subscription?.unsubscribe();
      const index = this._callbacks.indexOf(callback);
      if (index > -1) {
        this._callbacks.splice(index, 1);
      }
    };
  }
};

// Verificar sessão inicial
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error('❌ Erro ao verificar sessão inicial:', error);
    auth.currentUser = null;
    auth._callbacks.forEach(cb => cb(null));
    return;
  }
  
  if (session?.user) {
    console.log('✅ Sessão ativa encontrada:', session.user.email);
    auth.currentUser = session.user;
    
    // Criar documento do usuário se necessário
    createUserDocumentFromAuth(session.user).catch(error => {
      console.error('❌ Erro ao criar documento na sessão inicial:', error);
    });
    
    // Notificar todos os callbacks sobre o usuário logado
    auth._callbacks.forEach(cb => cb(auth.currentUser));
  } else {
    console.log('ℹ️ Nenhuma sessão ativa encontrada - usuário deve fazer login');
    auth.currentUser = null;
    auth._callbacks.forEach(cb => cb(null));
  }
}).catch((error) => {
  console.error('❌ Erro ao verificar sessão inicial:', error);
  auth.currentUser = null;
  auth._callbacks.forEach(cb => cb(null));
});

// Provider do Google (compatibilidade)
export const googleProvider = {
  providerId: 'google.com'
};

// Interface compatível com Firestore usando Supabase
export const db = {
  // Será implementado no adaptador se necessário
};

export const supabaseApi = {
  getUser: () => auth.currentUser,
  getSupabaseUser: () => supabase.auth.getUser(),
  supabase: supabase
};