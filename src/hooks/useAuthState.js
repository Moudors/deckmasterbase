// src/hooks/useAuthState.js
import { useState, useEffect } from 'react';
import { auth } from '../supabase';

export function useAuthState() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return [user, loading];
}