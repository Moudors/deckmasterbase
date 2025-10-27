/**
 * 🗄️ UNIFIED STORAGE - IndexedDB como Single Source of Truth
 * ===========================================================
 * Sistema unificado de armazenamento offline-first
 * 
 * DATABASES:
 * - deckmaster_unified (dados principais)
 * 
 * STORES:
 * 1. user_profile - Perfil do usuário
 * 2. decks - Todos os decks
 * 3. cards - Todas as cartas
 * 4. sync_queue - Operações pendentes
 * 5. sync_log - Histórico de sincronizações
 */

const DB_NAME = 'deckmaster_unified';
const DB_VERSION = 1;

const STORES = {
  USER_PROFILE: 'user_profile',
  DECKS: 'decks',
  CARDS: 'cards',
  SYNC_QUEUE: 'sync_queue',
  SYNC_LOG: 'sync_log'
};

class UnifiedStorage {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.initPromise = this.init();
  }

  /**
   * 🔧 Inicializa IndexedDB
   */
  async init() {
    if (this.isReady) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log('✅ UnifiedStorage inicializado');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store 1: user_profile (keyPath: userId)
        if (!db.objectStoreNames.contains(STORES.USER_PROFILE)) {
          const userStore = db.createObjectStore(STORES.USER_PROFILE, { keyPath: 'userId' });
          userStore.createIndex('email', 'email', { unique: false });
          console.log('✅ Store user_profile criado');
        }

        // Store 2: decks (keyPath: id)
        if (!db.objectStoreNames.contains(STORES.DECKS)) {
          const deckStore = db.createObjectStore(STORES.DECKS, { keyPath: 'id' });
          deckStore.createIndex('userId', 'userId', { unique: false });
          deckStore.createIndex('_synced', '_synced', { unique: false });
          deckStore.createIndex('_lastSync', '_lastSync', { unique: false });
          console.log('✅ Store decks criado');
        }

        // Store 3: cards (keyPath: id)
        if (!db.objectStoreNames.contains(STORES.CARDS)) {
          const cardStore = db.createObjectStore(STORES.CARDS, { keyPath: 'id' });
          cardStore.createIndex('deck_id', 'deck_id', { unique: false });
          cardStore.createIndex('_synced', '_synced', { unique: false });
          console.log('✅ Store cards criado');
        }

        // Store 4: sync_queue (keyPath: id)
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('entityType', 'entityType', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
          console.log('✅ Store sync_queue criado');
        }

        // Store 5: sync_log (keyPath: id, autoIncrement)
        if (!db.objectStoreNames.contains(STORES.SYNC_LOG)) {
          const logStore = db.createObjectStore(STORES.SYNC_LOG, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✅ Store sync_log criado');
        }
      };
    });
  }

  /**
   * 🔍 Garante que DB está pronto
   */
  async ensureReady() {
    if (!this.isReady) {
      await this.initPromise;
    }
    return this.db;
  }

  // ============================================
  // 👤 USER PROFILE
  // ============================================

  /**
   * 💾 Salva perfil do usuário
   */
  async saveUserProfile(profile) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.USER_PROFILE, 'readwrite');
    const store = transaction.objectStore(STORES.USER_PROFILE);

    const userProfile = {
      userId: profile.userId || profile.uid,
      username: profile.username || profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL || null,
      _synced: true,
      _lastSync: Date.now(),
      _version: (profile._version || 0) + 1,
      ...profile
    };

    return new Promise((resolve, reject) => {
      const request = store.put(userProfile);
      request.onsuccess = () => {
        console.log('✅ Perfil salvo:', userProfile.userId);
        resolve(userProfile);
      };
      request.onerror = () => {
        console.error('❌ Erro ao salvar perfil:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 📖 Busca perfil do usuário
   */
  async getUserProfile(userId) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.USER_PROFILE, 'readonly');
    const store = transaction.objectStore(STORES.USER_PROFILE);

    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // 🃏 DECKS
  // ============================================

  /**
   * 💾 Salva deck
   */
  async saveDeck(deck, options = {}) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.DECKS, 'readwrite');
    const store = transaction.objectStore(STORES.DECKS);

    const deckData = {
      ...deck,
      _synced: options.synced !== undefined ? options.synced : false,
      _pending: options.pending || [],
      _lastSync: options.synced ? Date.now() : (deck._lastSync || 0),
      _localChanges: options.localChanges || {},
      _version: (deck._version || 0) + 1,
      _updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(deckData);
      request.onsuccess = () => {
        console.log('✅ Deck salvo:', deckData.id);
        resolve(deckData);
      };
      request.onerror = () => {
        console.error('❌ Erro ao salvar deck:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 📖 Busca deck por ID
   */
  async getDeck(deckId) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.DECKS, 'readonly');
    const store = transaction.objectStore(STORES.DECKS);

    return new Promise((resolve, reject) => {
      const request = store.get(deckId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 📖 Busca todos os decks do usuário
   */
  async getUserDecks(userId) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.DECKS, 'readonly');
    const store = transaction.objectStore(STORES.DECKS);
    const index = store.index('userId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 🗑️ Deleta deck
   */
  async deleteDeck(deckId) {
    const db = await this.ensureReady();
    
    // Deleta deck e suas cartas em transação única
    const transaction = db.transaction([STORES.DECKS, STORES.CARDS], 'readwrite');
    const deckStore = transaction.objectStore(STORES.DECKS);
    const cardStore = transaction.objectStore(STORES.CARDS);
    const cardIndex = cardStore.index('deck_id');

    return new Promise((resolve, reject) => {
      // Deleta deck
      deckStore.delete(deckId);

      // Deleta todas as cartas do deck
      const cardRequest = cardIndex.openCursor(IDBKeyRange.only(deckId));
      cardRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        console.log('✅ Deck deletado:', deckId);
        resolve();
      };
      transaction.onerror = () => {
        console.error('❌ Erro ao deletar deck:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // ============================================
  // 🎴 CARDS
  // ============================================

  /**
   * 💾 Salva carta
   */
  async saveCard(card, options = {}) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.CARDS, 'readwrite');
    const store = transaction.objectStore(STORES.CARDS);

    const cardData = {
      ...card,
      _synced: options.synced !== undefined ? options.synced : false,
      _pending: options.pending || [],
      _lastSync: options.synced ? Date.now() : (card._lastSync || 0),
      _version: (card._version || 0) + 1,
      _updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cardData);
      request.onsuccess = () => {
        console.log('✅ Carta salva:', cardData.id);
        resolve(cardData);
      };
      request.onerror = () => {
        console.error('❌ Erro ao salvar carta:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 📖 Busca carta por ID
   */
  async getCard(cardId) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.CARDS, 'readonly');
    const store = transaction.objectStore(STORES.CARDS);

    return new Promise((resolve, reject) => {
      const request = store.get(cardId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 📖 Busca todas as cartas de um deck
   */
  async getDeckCards(deckId) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.CARDS, 'readonly');
    const store = transaction.objectStore(STORES.CARDS);
    const index = store.index('deck_id');

    return new Promise((resolve, reject) => {
      const request = index.getAll(deckId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 🗑️ Deleta carta
   */
  async deleteCard(cardId) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.CARDS, 'readwrite');
    const store = transaction.objectStore(STORES.CARDS);

    return new Promise((resolve, reject) => {
      const request = store.delete(cardId);
      request.onsuccess = () => {
        console.log('✅ Carta deletada:', cardId);
        resolve();
      };
      request.onerror = () => {
        console.error('❌ Erro ao deletar carta:', request.error);
        reject(request.error);
      };
    });
  }

  // ============================================
  // 🔄 SYNC QUEUE
  // ============================================

  /**
   * ➕ Adiciona operação à fila de sincronização
   */
  async addToSyncQueue(operation) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    const queueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending', // pending, processing, completed, failed
      retries: 0,
      ...operation
    };

    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => {
        console.log('✅ Adicionado à fila de sync:', queueItem.id);
        resolve(queueItem);
      };
      request.onerror = () => {
        console.error('❌ Erro ao adicionar à fila:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 📖 Busca operações pendentes
   */
  async getPendingSyncOperations() {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * ✏️ Atualiza status da operação
   */
  async updateSyncOperation(operationId, updates) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(operationId);
      
      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (!operation) {
          reject(new Error('Operação não encontrada'));
          return;
        }

        const updated = { ...operation, ...updates };
        const putRequest = store.put(updated);
        
        putRequest.onsuccess = () => resolve(updated);
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * 🗑️ Remove operação da fila
   */
  async removeSyncOperation(operationId) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    return new Promise((resolve, reject) => {
      const request = store.delete(operationId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // 📊 SYNC LOG
  // ============================================

  /**
   * 📝 Adiciona entrada no log de sincronização
   */
  async addSyncLog(logEntry) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.SYNC_LOG, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_LOG);

    const log = {
      timestamp: Date.now(),
      ...logEntry
    };

    return new Promise((resolve, reject) => {
      const request = store.add(log);
      request.onsuccess = () => resolve(log);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 📖 Busca últimos logs
   */
  async getSyncLogs(limit = 50) {
    const db = await this.ensureReady();
    const transaction = db.transaction(STORES.SYNC_LOG, 'readonly');
    const store = transaction.objectStore(STORES.SYNC_LOG);
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const logs = [];
      const request = index.openCursor(null, 'prev'); // Ordem decrescente

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && logs.length < limit) {
          logs.push(cursor.value);
          cursor.continue();
        } else {
          resolve(logs);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // 🧹 UTILITIES
  // ============================================

  /**
   * 🗑️ Limpa tudo (usar com cuidado!)
   */
  async clearAll() {
    const db = await this.ensureReady();
    const storeNames = [
      STORES.USER_PROFILE,
      STORES.DECKS,
      STORES.CARDS,
      STORES.SYNC_QUEUE,
      STORES.SYNC_LOG
    ];

    const transaction = db.transaction(storeNames, 'readwrite');

    return new Promise((resolve, reject) => {
      storeNames.forEach(storeName => {
        transaction.objectStore(storeName).clear();
      });

      transaction.oncomplete = () => {
        console.log('🗑️ Todos os dados limpos');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * 📊 Estatísticas gerais
   */
  async getStats() {
    const db = await this.ensureReady();
    const transaction = db.transaction([STORES.DECKS, STORES.CARDS, STORES.SYNC_QUEUE], 'readonly');

    const deckStore = transaction.objectStore(STORES.DECKS);
    const cardStore = transaction.objectStore(STORES.CARDS);
    const queueStore = transaction.objectStore(STORES.SYNC_QUEUE);

    const stats = await Promise.all([
      new Promise(resolve => {
        const request = deckStore.count();
        request.onsuccess = () => resolve(request.result);
      }),
      new Promise(resolve => {
        const request = cardStore.count();
        request.onsuccess = () => resolve(request.result);
      }),
      new Promise(resolve => {
        const request = queueStore.count();
        request.onsuccess = () => resolve(request.result);
      })
    ]);

    return {
      totalDecks: stats[0],
      totalCards: stats[1],
      pendingSync: stats[2]
    };
  }
}

// Singleton instance
const unifiedStorage = new UnifiedStorage();

// Expõe no window para debug
if (typeof window !== 'undefined') {
  window.unifiedStorage = unifiedStorage;
  console.log('🗄️ UnifiedStorage disponível em window.unifiedStorage');
}

export default unifiedStorage;
export { STORES };
