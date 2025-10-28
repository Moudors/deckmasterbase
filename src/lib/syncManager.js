/**
 * 🔄 SYNC MANAGER - Gerenciador de Sincronização
 * ===============================================
 * Sincroniza dados locais (IndexedDB) com Firebase
 * 
 * ESTRATÉGIA:
 * - IndexedDB é a fonte primária (single source of truth)
 * - Firebase é backup/sincronização
 * - Conflitos resolvidos por timestamp (mais recente ganha)
 * - Sincronização automática a cada 30 segundos
 * - Retry com backoff exponencial
 */

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp 
} from '../firebase';
import unifiedStorage from './unifiedStorage';

const SYNC_INTERVAL = 30000; // 30 segundos
const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 1000; // 1 segundo

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncIntervalId = null;
    this.listeners = new Set();
    
    // Monitor de conectividade
    this.setupConnectivityMonitor();
    
    // Inicia sincronização automática
    this.startAutoSync();
    
    console.log('🔄 SyncManager inicializado');
  }

  /**
   * 🌐 Monitor de conectividade
   */
  setupConnectivityMonitor() {
    window.addEventListener('online', () => {
      console.log('🌐 Online! Iniciando sincronização...');
      this.emit('online');
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Offline - Modo local ativado');
      this.emit('offline');
    });
  }

  /**
   * ⏰ Inicia sincronização automática
   */
  startAutoSync() {
    if (this.syncIntervalId) return;

    this.syncIntervalId = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncPending();
      }
    }, SYNC_INTERVAL);

    console.log('✅ Auto-sync ativado (30s)');
  }

  /**
   * ⏸️ Para sincronização automática
   */
  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('⏸️ Auto-sync desativado');
    }
  }

  /**
   * 🔔 Sistema de eventos
   */
  on(event, callback) {
    this.listeners.add({ event, callback });
  }

  emit(event, data) {
    this.listeners.forEach(listener => {
      if (listener.event === event) {
        listener.callback(data);
      }
    });
  }

  /**
   * 🚀 Sincroniza AGORA (manual)
   */
  async syncNow() {
    if (this.isSyncing) {
      console.log('⏳ Sincronização já em andamento...');
      return;
    }

    if (!navigator.onLine) {
      console.log('📴 Offline - sincronização adiada');
      return;
    }

    console.log('🔄 Iniciando sincronização manual...');
    await this.syncPending();
  }

  /**
   * 🔄 Sincroniza operações pendentes
   */
  async syncPending() {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    this.emit('syncStart');

    try {
      const operations = await unifiedStorage.getPendingSyncOperations();
      
      if (operations.length === 0) {
        console.log('✅ Nenhuma operação pendente');
        this.isSyncing = false;
        return;
      }

      console.log(`🔄 Sincronizando ${operations.length} operações...`);
      
      let successCount = 0;
      let failCount = 0;

      for (const operation of operations) {
        try {
          // Marca como processando
          await unifiedStorage.updateSyncOperation(operation.id, {
            status: 'processing'
          });

          // Executa operação
          await this.executeOperation(operation);

          // Remove da fila
          await unifiedStorage.removeSyncOperation(operation.id);
          
          successCount++;
          console.log(`✅ Sincronizado: ${operation.type}`);

        } catch (error) {
          console.error(`❌ Falha ao sincronizar ${operation.type}:`, error);
          
          // Incrementa tentativas
          const retries = operation.retries + 1;
          
          if (retries >= MAX_RETRIES) {
            // Após 5 tentativas, marca como falha permanente
            await unifiedStorage.updateSyncOperation(operation.id, {
              status: 'failed',
              retries,
              lastError: error.message
            });
            failCount++;
          } else {
            // Volta para pending com backoff
            await unifiedStorage.updateSyncOperation(operation.id, {
              status: 'pending',
              retries,
              lastError: error.message,
              nextRetry: Date.now() + (INITIAL_BACKOFF * Math.pow(2, retries))
            });
          }
        }
      }

      // Log de sincronização
      await unifiedStorage.addSyncLog({
        operation: 'SYNC_BATCH',
        itemsSynced: successCount,
        itemsFailed: failCount,
        totalOperations: operations.length
      });

      console.log(`✅ Sincronização concluída: ${successCount} sucesso, ${failCount} falhas`);
      this.emit('syncComplete', { successCount, failCount });

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      this.emit('syncError', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * ⚡ Executa operação no Firebase
   */
  async executeOperation(operation) {
    const { type, entityType, entityId, data } = operation;

    switch (type) {
      case 'CREATE_DECK':
        return await this.createDeckOnFirebase(data);
      
      case 'UPDATE_DECK':
        return await this.updateDeckOnFirebase(entityId, data);
      
      case 'DELETE_DECK':
        return await this.deleteDeckOnFirebase(entityId);
      
      case 'CREATE_CARD':
        return await this.createCardOnFirebase(data);
      
      case 'UPDATE_CARD':
        return await this.updateCardOnFirebase(entityId, data);
      
      case 'DELETE_CARD':
        return await this.deleteCardOnFirebase(entityId);
      
      default:
        throw new Error(`Tipo de operação desconhecido: ${type}`);
    }
  }

  /**
   * 🎴 Cria deck no Firebase
   */
  async createDeckOnFirebase(deckData) {
    try {
      // Remove campos internos antes de enviar
      const { _synced, _pending, _localChanges, _version, _updatedAt, ...cleanData } = deckData;

      const docRef = await addDoc(collection(db, 'decks'), {
        ...cleanData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Atualiza ID local para ID do Firebase
      const localDeck = await unifiedStorage.getDeck(deckData.id);
      if (localDeck) {
        await unifiedStorage.deleteDeck(deckData.id);
        await unifiedStorage.saveDeck({
          ...localDeck,
          id: docRef.id
        }, { synced: true });
      }

      console.log('✅ Deck criado no Firebase:', docRef.id);
      return docRef.id;

    } catch (error) {
      // Se for quota excedida, não retry
      if (error.code === 'resource-exhausted') {
        console.log('⚠️ Quota do Firebase excedida - operação adiada');
        throw new Error('QUOTA_EXCEEDED');
      }
      throw error;
    }
  }

  /**
   * ✏️ Atualiza deck no Firebase
   */
  async updateDeckOnFirebase(deckId, updates) {
    try {
      // Remove campos internos
      const { _synced, _pending, _localChanges, _version, _updatedAt, ...cleanData } = updates;

      const docRef = doc(db, 'decks', deckId);
      await updateDoc(docRef, {
        ...cleanData,
        updated_at: serverTimestamp()
      });

      // Marca como sincronizado localmente
      const localDeck = await unifiedStorage.getDeck(deckId);
      if (localDeck) {
        await unifiedStorage.saveDeck(localDeck, { synced: true });
      }

      console.log('✅ Deck atualizado no Firebase:', deckId);

    } catch (error) {
      if (error.code === 'resource-exhausted') {
        throw new Error('QUOTA_EXCEEDED');
      }
      throw error;
    }
  }

  /**
   * 🗑️ Deleta deck no Firebase
   */
  async deleteDeckOnFirebase(deckId) {
    try {
      const docRef = doc(db, 'decks', deckId);
      await deleteDoc(docRef);
      console.log('✅ Deck deletado no Firebase:', deckId);

    } catch (error) {
      if (error.code === 'resource-exhausted') {
        throw new Error('QUOTA_EXCEEDED');
      }
      throw error;
    }
  }

  /**
   * 🎴 Cria carta no Firebase
   */
  async createCardOnFirebase(cardData) {
    try {
      const { _synced, _pending, _version, _updatedAt, ...cleanData } = cardData;

      const docRef = await addDoc(collection(db, 'cards'), {
        ...cleanData,
        created_at: serverTimestamp()
      });

      // Atualiza ID local
      const localCard = await unifiedStorage.getCard(cardData.id);
      if (localCard) {
        await unifiedStorage.deleteCard(cardData.id);
        await unifiedStorage.saveCard({
          ...localCard,
          id: docRef.id
        }, { synced: true });
      }

      console.log('✅ Carta criada no Firebase:', docRef.id);
      return docRef.id;

    } catch (error) {
      if (error.code === 'resource-exhausted') {
        throw new Error('QUOTA_EXCEEDED');
      }
      throw error;
    }
  }

  /**
   * ✏️ Atualiza carta no Firebase
   */
  async updateCardOnFirebase(cardId, updates) {
    try {
      const { _synced, _pending, _version, _updatedAt, ...cleanData } = updates;

      const docRef = doc(db, 'cards', cardId);
      await updateDoc(docRef, cleanData);

      // Marca como sincronizado
      const localCard = await unifiedStorage.getCard(cardId);
      if (localCard) {
        await unifiedStorage.saveCard(localCard, { synced: true });
      }

      console.log('✅ Carta atualizada no Firebase:', cardId);

    } catch (error) {
      if (error.code === 'resource-exhausted') {
        throw new Error('QUOTA_EXCEEDED');
      }
      throw error;
    }
  }

  /**
   * 🗑️ Deleta carta no Firebase
   */
  async deleteCardOnFirebase(cardId) {
    try {
      const docRef = doc(db, 'cards', cardId);
      await deleteDoc(docRef);
      console.log('✅ Carta deletada no Firebase:', cardId);

    } catch (error) {
      if (error.code === 'resource-exhausted') {
        throw new Error('QUOTA_EXCEEDED');
      }
      throw error;
    }
  }

  /**
   * 🔄 Merge com dados do Firebase (pull)
   */
  async pullFromFirebase(userId) {
    if (!navigator.onLine) {
      console.log('📴 Offline - pull adiado');
      return;
    }

    console.log('⬇️ Baixando dados do Firebase...');

    try {
      // Busca decks do Firebase
      const decksQuery = query(
        collection(db, 'decks'),
        where('userId', '==', userId)
      );
      const decksSnapshot = await getDocs(decksQuery);

      for (const docSnapshot of decksSnapshot.docs) {
        const firebaseDeck = { id: docSnapshot.id, ...docSnapshot.data() };
        const localDeck = await unifiedStorage.getDeck(docSnapshot.id);

        if (!localDeck) {
          // Não existe localmente - salva
          await unifiedStorage.saveDeck(firebaseDeck, { synced: true });
          console.log('⬇️ Deck baixado:', docSnapshot.id);
        } else {
          // Existe localmente - resolve conflito
          await this.resolveConflict('deck', localDeck, firebaseDeck);
        }
      }

      // Busca cartas (apenas dos decks sincronizados)
      const deckIds = decksSnapshot.docs.map(d => d.id);
      for (const deckId of deckIds) {
        const cardsQuery = query(
          collection(db, 'cards'),
          where('deck_id', '==', deckId)
        );
        const cardsSnapshot = await getDocs(cardsQuery);

        for (const cardDoc of cardsSnapshot.docs) {
          const firebaseCard = { id: cardDoc.id, ...cardDoc.data() };
          const localCard = await unifiedStorage.getCard(cardDoc.id);

          if (!localCard) {
            await unifiedStorage.saveCard(firebaseCard, { synced: true });
            console.log('⬇️ Carta baixada:', cardDoc.id);
          } else {
            await this.resolveConflict('card', localCard, firebaseCard);
          }
        }
      }

      console.log('✅ Pull do Firebase concluído');
      this.emit('pullComplete');

    } catch (error) {
      console.error('❌ Erro no pull do Firebase:', error);
      throw error;
    }
  }

  /**
   * ⚖️ Resolve conflito entre dados locais e Firebase
   * Estratégia: Timestamp - mais recente ganha
   */
  async resolveConflict(entityType, localData, firebaseData) {
    const localTimestamp = localData._updatedAt || localData.updated_at?.toMillis?.() || 0;
    const firebaseTimestamp = firebaseData.updated_at?.toMillis?.() || firebaseData._updatedAt || 0;

    console.log(`⚖️ Resolvendo conflito (${entityType}):`, {
      local: new Date(localTimestamp),
      firebase: new Date(firebaseTimestamp)
    });

    // Se local tem mudanças não sincronizadas, mantém local
    if (localData._pending && localData._pending.length > 0) {
      console.log('✅ Local tem mudanças pendentes - mantém local');
      return;
    }

    // Se Firebase é mais recente, usa Firebase
    if (firebaseTimestamp > localTimestamp) {
      console.log('✅ Firebase mais recente - atualiza local');
      
      if (entityType === 'deck') {
        await unifiedStorage.saveDeck(firebaseData, { synced: true });
      } else if (entityType === 'card') {
        await unifiedStorage.saveCard(firebaseData, { synced: true });
      }
    } else {
      console.log('✅ Local mais recente - mantém local');
      // Local já está atualizado, apenas marca como sincronizado
      if (entityType === 'deck') {
        await unifiedStorage.saveDeck(localData, { synced: true });
      } else if (entityType === 'card') {
        await unifiedStorage.saveCard(localData, { synced: true });
      }
    }
  }

  /**
   * 📊 Status da sincronização
   */
  async getStatus() {
    const pending = await unifiedStorage.getPendingSyncOperations();
    const stats = await unifiedStorage.getStats();
    const logs = await unifiedStorage.getSyncLogs(10);

    return {
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing,
      pendingOperations: pending.length,
      stats,
      recentLogs: logs
    };
  }
}

// Singleton
const syncManager = new SyncManager();

// Expõe no window para debug
if (typeof window !== 'undefined') {
  window.syncManager = syncManager;
  console.log('🔄 SyncManager disponível em window.syncManager');
}

export default syncManager;
