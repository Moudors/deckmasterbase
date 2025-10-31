// src/hooks/useAuthState.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useAuthState() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual primeiro
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          setUser(null);
        } else if (session?.user) {
          setUser(session.user);
        } else {
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