// Sistema de armazenamento usando IndexedDB para grandes volumes de dados
// Fallback para localStorage se IndexedDB não estiver disponível

const DB_NAME = "deckmaster_db";
const DB_VERSION = 1;
const STORE_NAME = "sync_queue";

class IndexedDBStorage {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.fallbackToLocalStorage = false;
    this.init();
  }

  // Inicializa o banco de dados
  async init() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn("⚠️ IndexedDB não disponível. Usando localStorage como fallback.");
      this.fallbackToLocalStorage = true;
      this.isReady = true;
      return;
    }

    try {
      this.db = await this.openDB();
      this.isReady = true;
      console.log("✅ IndexedDB inicializado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao inicializar IndexedDB:", error);
      this.fallbackToLocalStorage = true;
      this.isReady = true;
    }
  }

  // Abre conexão com IndexedDB
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Cria object store se não existir
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: "id",
            autoIncrement: true 
          });
          
          // Cria índices
          objectStore.createIndex("timestamp", "timestamp", { unique: false });
          objectStore.createIndex("type", "type", { unique: false });
          
          console.log("📦 Object store criado:", STORE_NAME);
        }
      };
    });
  }

  // Aguarda até o DB estar pronto
  async waitForReady() {
    if (this.isReady) return;
    
    // Aguarda até 5 segundos
    const timeout = 5000;
    const start = Date.now();
    
    while (!this.isReady && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.isReady) {
      console.warn("⚠️ Timeout ao aguardar IndexedDB. Usando fallback.");
      this.fallbackToLocalStorage = true;
      this.isReady = true;
    }
  }

  // Salva item no storage
  async setItem(key, value) {
    await this.waitForReady();

    if (this.fallbackToLocalStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error("❌ Erro ao salvar no localStorage:", error);
        throw error;
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({ id: key, data: value, timestamp: Date.now() });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Recupera item do storage
  async getItem(key) {
    await this.waitForReady();

    if (this.fallbackToLocalStorage) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error("❌ Erro ao ler do localStorage:", error);
        return null;
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Remove item do storage
  async removeItem(key) {
    await this.waitForReady();

    if (this.fallbackToLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error("❌ Erro ao remover do localStorage:", error);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Lista todos os itens
  async getAllItems() {
    await this.waitForReady();

    if (this.fallbackToLocalStorage) {
      // No localStorage, retorna apenas o item da fila
      try {
        const queue = localStorage.getItem("deckmaster_pending_sync");
        return queue ? [{ id: "deckmaster_pending_sync", data: JSON.parse(queue) }] : [];
      } catch (error) {
        console.error("❌ Erro ao listar do localStorage:", error);
        return [];
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Limpa todo o storage
  async clear() {
    await this.waitForReady();

    if (this.fallbackToLocalStorage) {
      try {
        // Remove apenas itens relacionados ao DeckMaster
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('deckmaster_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error("❌ Erro ao limpar localStorage:", error);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Obtém estatísticas de uso
  async getStorageStats() {
    await this.waitForReady();

    if (this.fallbackToLocalStorage) {
      let totalSize = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('deckmaster_')) {
          totalSize += localStorage.getItem(key).length;
        }
      });

      return {
        type: 'localStorage',
        itemCount: keys.filter(k => k.startsWith('deckmaster_')).length,
        estimatedSize: totalSize,
        estimatedSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        maxSize: '5-10MB (limite do navegador)',
      };
    }

    const items = await this.getAllItems();
    let totalSize = 0;
    
    items.forEach(item => {
      totalSize += JSON.stringify(item).length;
    });

    // Tenta obter quota do navegador (se disponível)
    let quota = null;
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quota = {
          usage: estimate.usage,
          quota: estimate.quota,
          usageMB: (estimate.usage / 1024 / 1024).toFixed(2),
          quotaMB: (estimate.quota / 1024 / 1024).toFixed(2),
          percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2),
        };
      } catch (error) {
        console.warn("⚠️ Não foi possível obter quota do storage");
      }
    }

    return {
      type: 'IndexedDB',
      itemCount: items.length,
      estimatedSize: totalSize,
      estimatedSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      quota: quota,
    };
  }

  // Método para debug
  async logStats() {
    const stats = await this.getStorageStats();
    
    console.log(`
📊 ESTATÍSTICAS DE ARMAZENAMENTO:
  💾 Tipo: ${stats.type}
  📦 Itens: ${stats.itemCount}
  💽 Tamanho estimado: ${stats.estimatedSizeMB}MB
  ${stats.quota ? `
  📈 Quota do navegador:
    • Usado: ${stats.quota.usageMB}MB
    • Total: ${stats.quota.quotaMB}MB
    • Ocupação: ${stats.quota.percentUsed}%
  ` : `  📏 Limite: ${stats.maxSize || 'Desconhecido'}`}
    `);
  }
}

// Singleton
const storage = new IndexedDBStorage();

export default storage;

// Exporta a instância também como named export para compatibilidade
export const indexedDBStorage = storage;

// Exporta métodos úteis
export const setItem = (key, value) => storage.setItem(key, value);
export const getItem = (key) => storage.getItem(key);
export const removeItem = (key) => storage.removeItem(key);
export const clear = () => storage.clear();
export const getStorageStats = () => storage.getStorageStats();
export const logStats = () => storage.logStats();

// Expõe globalmente para debug
if (typeof window !== 'undefined') {
  window.storageManager = storage;
  console.log("💡 Use window.storageManager.logStats() para ver estatísticas de armazenamento");
}
