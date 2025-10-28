// Sistema de conectividade online/offline para DeckMaster
import React from 'react';
import { supabase } from '../supabase';

class ConnectivityManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSupabaseConnected = false;
    this.listeners = new Set();
    this.lastConnectivityCheck = 0;
    this.connectivityCheckInterval = 30000; // 30 segundos
    
    this.initConnectivityMonitoring();
    this.checkSupabaseConnection();
  }

  // Monitora conectividade da rede
  initConnectivityMonitoring() {
    window.addEventListener('online', () => {
      console.log('🟢 Rede online detectada');
      this.isOnline = true;
      this.checkSupabaseConnection();
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      console.log('🔴 Rede offline detectada');
      this.isOnline = false;
      this.isSupabaseConnected = false;
      this.notifyListeners();
    });

    // Verificação periódica da conexão com Supabase
    setInterval(() => {
      if (this.isOnline) {
        this.checkSupabaseConnection();
      }
    }, this.connectivityCheckInterval);
  }

  // Testa conexão com Supabase
  async checkSupabaseConnection() {
    if (!this.isOnline) {
      this.isSupabaseConnected = false;
      return false;
    }

    try {
      const now = Date.now();
      
      // Rate limiting - não verificar muito frequentemente
      if (now - this.lastConnectivityCheck < 5000) {
        return this.isSupabaseConnected;
      }
      
      this.lastConnectivityCheck = now;

      // Teste simples de conectividade com Supabase
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      const wasConnected = this.isSupabaseConnected;
      this.isSupabaseConnected = !error;

      if (wasConnected !== this.isSupabaseConnected) {
        console.log(`🔄 Conexão Supabase: ${this.isSupabaseConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
        this.notifyListeners();
      }

      return this.isSupabaseConnected;
    } catch (err) {
      console.warn('⚠️ Erro ao verificar conexão Supabase:', err);
      this.isSupabaseConnected = false;
      this.notifyListeners();
      return false;
    }
  }

  // Verifica se está totalmente online (rede + Supabase)
  async isFullyOnline() {
    if (!this.isOnline) return false;
    return await this.checkSupabaseConnection();
  }

  // Verifica se pode buscar no Scryfall (rede disponível)
  canSearchScryfall() {
    return this.isOnline;
  }

  // Verifica se pode salvar dados (Supabase conectado)
  canSaveData() {
    return this.isOnline && this.isSupabaseConnected;
  }

  // Verifica se está no modo offline (apenas visualização)
  isOfflineMode() {
    return !this.isOnline || !this.isSupabaseConnected;
  }

  // Adiciona listener para mudanças de conectividade
  addConnectivityListener(callback) {
    this.listeners.add(callback);
    
    // Retorna função para remover listener
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notifica todos os listeners
  notifyListeners() {
    const status = {
      isOnline: this.isOnline,
      isSupabaseConnected: this.isSupabaseConnected,
      canSearchScryfall: this.canSearchScryfall(),
      canSaveData: this.canSaveData(),
      isOfflineMode: this.isOfflineMode()
    };

    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (err) {
        console.error('Erro em listener de conectividade:', err);
      }
    });
  }

  // Estado atual da conectividade
  getConnectivityStatus() {
    return {
      isOnline: this.isOnline,
      isSupabaseConnected: this.isSupabaseConnected,
      canSearchScryfall: this.canSearchScryfall(),
      canSaveData: this.canSaveData(),
      isOfflineMode: this.isOfflineMode(),
      lastCheck: this.lastConnectivityCheck
    };
  }
}

// Instância singleton
export const connectivityManager = new ConnectivityManager();

// Hook React para usar a conectividade
export function useConnectivity() {
  const [status, setStatus] = React.useState(connectivityManager.getConnectivityStatus());

  React.useEffect(() => {
    const unsubscribe = connectivityManager.addConnectivityListener(setStatus);
    
    // Verificar status inicial
    connectivityManager.checkSupabaseConnection().then(() => {
      setStatus(connectivityManager.getConnectivityStatus());
    });

    return unsubscribe;
  }, []);

  return status;
}