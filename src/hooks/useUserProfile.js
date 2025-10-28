// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useUserProfile(user) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Buscando perfil do usuário:', user.email);
        setLoading(true);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Erro ao buscar perfil:', error);
          setError(error);
        } else {
          console.log('✅ Perfil encontrado:', data);
          setProfile(data);
        }
      } catch (err) {
        console.error('❌ Erro ao buscar perfil:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user?.id]);

  return { profile, loading, error };
}