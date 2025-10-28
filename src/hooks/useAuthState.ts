// src/hooks/useAuthState.ts
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

export function useAuthState(): [User | null, boolean] {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('🔄 useAuthState - Configurando listener de auth...');
    
    // Verificar sessão atual primeiro
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          setUser(null);
        } else if (session?.user) {
          console.log('✅ Sessão encontrada:', session.user.email);
          setUser(session.user);
        } else {
          console.log('ℹ️ Nenhuma sessão ativa');
          setUser(null);
        }
      } catch (err) {
        console.error('❌ Erro inesperado ao verificar sessão:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Configurar listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('👤 useAuthState - Auth state changed:', event, session?.user?.email || 'sem usuário');
        
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Verificar sessão atual
    checkSession();

    // Cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return [user, loading];
}