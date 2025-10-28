// src/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Compatibilidade com auth do Firebase
export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (callback: (user: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      if (user) {
        // Adapta o formato do usuário para ser compatível com Firebase
        auth.currentUser = {
          uid: user.id,
          email: user.email,
          displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || '',
          photoURL: user.user_metadata?.avatar_url || null
        };
      } else {
        auth.currentUser = null;
      }
      callback(auth.currentUser);
    });
  },
  signOut: () => supabase.auth.signOut()
};

// Inicializa currentUser se já estiver logado
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    const user = session.user;
    auth.currentUser = {
      uid: user.id,
      email: user.email,
      displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || '',
      photoURL: user.user_metadata?.avatar_url || null
    };
  }
});

// Provider do Google (compatibilidade)
export const googleProvider = {
  providerId: 'google.com'
};

// Interface compatível com Firestore usando Supabase
export const db = {
  // Será implementado no adaptador
};

export const supabaseApi = {
  getUser: () => auth.currentUser,
  getSupabaseUser: () => supabase.auth.getUser(),
  supabase: supabase
};