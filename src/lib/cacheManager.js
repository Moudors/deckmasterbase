// Sistema de gerenciamento de cache para prevenir problemas de quota
// Limpa automaticamente cache antigo e gerencia limites de storage

class CacheManager {
  constructor() {
    this.MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias
    this.MAX_CACHE_ITEMS = 100; // Máximo de itens no cache
    this.CACHE_PREFIX = "deckmaster_cache_";
    this.LAST_CLEANUP_KEY = "deckmaster_last_cleanup";
    
    // Executa limpeza automática ao iniciar
    this.autoCleanup();
  }

  // Limpeza automática executada uma vez por dia
  async autoCleanup() {
    try {
      const lastCleanup = localStorage.getItem(this.LAST_CLEANUP_KEY);
      const now = Date.now();
      
      // Se já limpou hoje, não faz nada
      if (lastCleanup && now - parseInt(lastCleanup) < 24 * 60 * 60 * 1000) {
        console.log("✅ Cache limpo recentemente, nenhuma ação necessária");
        return;
      }

      console.log("🧹 Iniciando limpeza automática de cache...");
      
      // Limpa localStorage antigo
      await this.cleanLocalStorage();
      
      // Limpa cache do React Query
      await this.cleanReactQueryCache();
      
      // Limpa fila offline excessiva
      await this.cleanOfflineQueue();
      
      // Marca última limpeza
      localStorage.setItem(this.LAST_CLEANUP_KEY, now.toString());
      
      console.log("✅ Limpeza de cache concluída!");
    } catch (error) {
      console.error("❌ Erro na limpeza automática:", error);
    }
  }

  // Limpa itens antigos do localStorage
  async cleanLocalStorage() {
    const keysToRemove = [];
    const now = Date.now();

    // Itera sobre todas as chaves
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Remove itens de cache antigos do DeckMaster
      if (key.startsWith(this.CACHE_PREFIX)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.timestamp && now - item.timestamp > this.MAX_CACHE_AGE) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // Se não consegue parsear, remove
          keysToRemove.push(key);
        }
      }
    }

    // Remove chaves identificadas
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    if (keysToRemove.length > 0) {
      console.log(`🗑️ Removidos ${keysToRemove.length} itens antigos do localStorage`);
    }
  }

  // Limpa cache do React Query (acessível via window.queryClient)
  async cleanReactQueryCache() {
    if (typeof window === 'undefined' || !window.queryClient) {
      return;
    }

    const queryClient = window.queryClient;
    const queryCache = queryClient.getQueryCache();
    const allQueries = queryCache.getAll();
    
    const now = Date.now();
    let removedCount = 0;

    allQueries.forEach(query => {
      const state = query.state;
      
      // Remove queries antigas ou com erro
      if (
        (state.dataUpdatedAt && now - state.dataUpdatedAt > this.MAX_CACHE_AGE) ||
        state.status === 'error'
      ) {
        queryClient.removeQueries({ queryKey: query.queryKey });
        removedCount++;
      }
    });

    if (removedCount > 0) {
      console.log(`🗑️ Removidas ${removedCount} queries antigas do cache`);
    }
  }

  // Limpa fila offline excessiva
  async cleanOfflineQueue() {
    const storage = (await import('./indexedDBStorage')).default;
    const PENDING_QUEUE_KEY = "deckmaster_pending_sync";
    
    try {
      const queue = await storage.getItem(PENDING_QUEUE_KEY);
      
      if (!queue || !Array.isArray(queue)) {
        return;
      }

      const now = Date.now();
      const MAX_QUEUE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias
      const MAX_QUEUE_SIZE = 100; // Máximo de 100 itens na fila

      // Remove itens muito antigos
      let cleanedQueue = queue.filter(item => {
        return item.timestamp && now - item.timestamp < MAX_QUEUE_AGE;
      });

      // Limita tamanho da fila (mantém os mais recentes)
      if (cleanedQueue.length > MAX_QUEUE_SIZE) {
        cleanedQueue = cleanedQueue.slice(-MAX_QUEUE_SIZE);
      }

      if (cleanedQueue.length < queue.length) {
        await storage.setItem(PENDING_QUEUE_KEY, cleanedQueue);
        console.log(`🗑️ Fila offline reduzida de ${queue.length} para ${cleanedQueue.length} itens`);
      }
    } catch (error) {
      console.error("Erro ao limpar fila offline:", error);
    }
  }

  // Força limpeza completa (para ser usada manualmente se necessário)
  async forceCleanup() {
    console.log("🧹 Forçando limpeza completa do cache...");
    
    // Limpa todo localStorage do DeckMaster (exceto autenticação)
    const keysToKeep = ['firebase:authUser', 'firebase:host', 'firebaseui::'];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.some(k => key.includes(k))) {
        localStorage.removeItem(key);
      }
    }

    // Limpa todo cache do React Query
    if (window.queryClient) {
      window.queryClient.clear();
    }

    // Limpa fila offline
    const storage = (await import('./indexedDBStorage')).default;
    const PENDING_QUEUE_KEY = "deckmaster_pending_sync";
    await storage.setItem(PENDING_QUEUE_KEY, []);

    console.log("✅ Limpeza completa concluída!");
    console.log("💡 Dica: Recarregue a página para aplicar as mudanças");
  }

  // Verifica uso de storage
  async checkStorageUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = ((usage / quota) * 100).toFixed(2);

      console.log(`📊 Storage Usage: ${(usage / 1024 / 1024).toFixed(2)}MB / ${(quota / 1024 / 1024).toFixed(2)}MB (${percentUsed}%)`);

      // Alerta se uso > 80%
      if (parseFloat(percentUsed) > 80) {
        console.warn(`⚠️ Storage está ${percentUsed}% cheio! Considere limpar dados antigos.`);
        return { usage, quota, percentUsed, warning: true };
      }

      return { usage, quota, percentUsed, warning: false };
    }

    return null;
  }

  // Obtém informações sobre o cache
  getCacheInfo() {
    const info = {
      localStorage: {
        items: localStorage.length,
        keys: []
      },
      reactQuery: {
        queries: 0
      }
    };

    // Lista chaves do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) info.localStorage.keys.push(key);
    }

    // Conta queries do React Query
    if (window.queryClient) {
      const queryCache = window.queryClient.getQueryCache();
      info.reactQuery.queries = queryCache.getAll().length;
    }

    return info;
  }
}

// Singleton
const cacheManager = new CacheManager();

// Exporta funções úteis para o console
if (typeof window !== 'undefined') {
  window.cacheManager = {
    checkUsage: () => cacheManager.checkStorageUsage(),
    forceClean: () => cacheManager.forceCleanup(),
    getInfo: () => cacheManager.getCacheInfo(),
  };
}

export default cacheManager;
