/**
 * 🚀 INITIALIZATION SCRIPT
 * ========================
 * Inicializa o sistema unificado de cache offline
 * Execute automaticamente ao iniciar o app
 */

import unifiedStorage from './unifiedStorage';
import syncManager from './syncManager';
import queryManager from './queryManager';
import { auth } from '../firebase';

class AppInitializer {
  constructor() {
    this.initialized = false;
  }

  /**
   * 🔧 Inicializa o sistema
   */
  async initialize() {
    if (this.initialized) {
      console.log('✅ Sistema já inicializado');
      return;
    }

    console.log('🚀 Inicializando sistema offline-first...');

    try {
      // 1. Aguarda IndexedDB estar pronto
      await unifiedStorage.ensureReady();
      console.log('✅ UnifiedStorage pronto');

      // 2. Carrega perfil do usuário se autenticado
      const user = auth.currentUser;
      if (user) {
        await this.loadUserProfile(user);
      }

      // 3. Inicia sincronização automática
      syncManager.startAutoSync();
      console.log('✅ Auto-sync ativado');

      // 4. Se estiver online, faz pull inicial
      if (navigator.onLine && user) {
        console.log('🌐 Fazendo pull inicial do Firebase...');
        await syncManager.pullFromFirebase(user.uid);
      }

      this.initialized = true;
      console.log('🎉 Sistema inicializado com sucesso!');

      // Log de estatísticas
      const stats = await unifiedStorage.getStats();
      console.log('📊 Estatísticas:', stats);

    } catch (error) {
      console.error('❌ Erro ao inicializar sistema:', error);
    }
  }

  /**
   * 👤 Carrega perfil do usuário
   */
  async loadUserProfile(user) {
    try {
      // Verifica se já tem perfil em cache
      const cachedProfile = await unifiedStorage.getUserProfile(user.uid);
      
      if (!cachedProfile) {
        // Salva perfil do Firebase Auth no cache
        await unifiedStorage.saveUserProfile({
          userId: user.uid,
          username: user.displayName || 'Usuário',
          email: user.email,
          photoURL: user.photoURL
        });
        console.log('✅ Perfil do usuário salvo em cache');
      } else {
        console.log('✅ Perfil do usuário carregado do cache');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
    }
  }

  /**
   * 🔄 Reinicializa (útil para testes)
   */
  async reinitialize() {
    this.initialized = false;
    await this.initialize();
  }

  /**
   * 📊 Status do sistema
   */
  async getStatus() {
    const stats = await unifiedStorage.getStats();
    const syncStatus = await syncManager.getStatus();
    
    return {
      initialized: this.initialized,
      online: navigator.onLine,
      stats,
      sync: syncStatus
    };
  }
}

// Singleton
const appInitializer = new AppInitializer();

// Expõe no window para debug
if (typeof window !== 'undefined') {
  window.appInitializer = appInitializer;
  console.log('🚀 AppInitializer disponível em window.appInitializer');
}

export default appInitializer;
