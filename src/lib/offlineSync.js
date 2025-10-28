// Sistema de sincronização silenciosa offline-first
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch } from "@/firebase";
import storage from "./indexedDBStorage";

// 🔇 LOGS DESABILITADOS (mode silencioso)
const ENABLE_LOGS = false;
const log = (...args) => ENABLE_LOGS && log(...args);

const PENDING_QUEUE_KEY = "deckmaster_pending_sync";
const SYNC_INTERVAL = 30000; // Tenta sincronizar a cada 30 segundos
const MAX_RETRY_DELAY = 5 * 60 * 1000; // Máximo 5 minutos entre tentativas
const MAX_QUEUE_SIZE = 100; // Reduzido de 500 para 100 - evita crescimento excessivo
const MAX_STORAGE_SIZE = 10 * 1024 * 1024; // Reduzido de 50MB para 10MB
const MAX_QUEUE_AGE = 7 * 24 * 60 * 60 * 1000; // Remove itens mais antigos que 7 dias

class OfflineSyncManager {
  constructor() {
    this.queue = this.loadQueue();
    this.isSyncing = false;
    this.retryCount = 0;
    this.startAutoSync();
  }

  // Carrega fila de operações pendentes do storage (IndexedDB)
  loadQueue() {
    // Retorna promise que será resolvida quando carregar
    storage.getItem(PENDING_QUEUE_KEY).then(queue => {
      if (queue && Array.isArray(queue)) {
        this.queue = queue;
        log(`📥 Carregados ${queue.length} itens da fila`);
      }
    }).catch(error => {
      console.error("Erro ao carregar fila:", error);
    });
    
    // Retorna array vazio por enquanto
    return [];
  }

  // Salva fila no storage (IndexedDB - agora assíncrono)
  async saveQueue() {
    try {
      // Remove itens muito antigos primeiro
      const now = Date.now();
      this.queue = this.queue.filter(item => {
        return !item.timestamp || now - item.timestamp < MAX_QUEUE_AGE;
      });

      // Limita o tamanho da fila (mantém os mais recentes)
      if (this.queue.length > MAX_QUEUE_SIZE) {
        console.warn(`⚠️ Fila muito grande (${this.queue.length}). Removendo itens antigos...`);
        this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
      }

      const queueString = JSON.stringify(this.queue);
      
      // Verifica o tamanho antes de salvar
      const size = new Blob([queueString]).size;
      if (size > MAX_STORAGE_SIZE) {
        console.warn(`⚠️ Fila muito grande (${(size / 1024 / 1024).toFixed(2)}MB). Removendo 75% dos itens antigos...`);
        // Remove 75% dos itens mais antigos para liberar espaço significativo
        this.queue = this.queue.slice(Math.floor(this.queue.length * 0.75));
        return this.saveQueue(); // Tenta salvar novamente com menos itens
      }

      // Usa IndexedDB que suporta muito mais dados
      await storage.setItem(PENDING_QUEUE_KEY, this.queue);
      
    } catch (error) {
      console.error("❌ Erro ao salvar fila:", error);
      
      // Se falhar, tenta limpar e salvar novamente
      if (error.name === 'QuotaExceededError') {
        console.error("🚨 Storage cheio! Limpando fila antiga...");
        this.queue = this.queue.slice(-20); // Mantém apenas últimos 20 itens
        try {
          await storage.setItem(PENDING_QUEUE_KEY, this.queue);
        } catch (e) {
          console.error("❌ Erro crítico ao salvar fila:", e);
          // Como último recurso, limpa tudo
          this.queue = [];
          await storage.removeItem(PENDING_QUEUE_KEY);
        }
      }
    }
  }

  // Adiciona operação à fila
  addToQueue(operation) {
    const item = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      ...operation,
    };
    this.queue.push(item);
    this.saveQueue();
    
    // Tenta sincronizar imediatamente
    this.trySync();
  }

  // Adicionar documento
  async queueAdd(collectionName, data) {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    this.addToQueue({
      type: "add",
      collection: collectionName,
      data: { ...data, tempId },
      tempId,
    });

    return tempId;
  }

  // Atualizar documento
  async queueUpdate(collectionName, docId, data) {
    this.addToQueue({
      type: "update",
      collection: collectionName,
      docId,
      data,
    });
  }

  // Deletar documento
  async queueDelete(collectionName, docId) {
    this.addToQueue({
      type: "delete",
      collection: collectionName,
      docId,
    });
  }

  // Batch de deleções
  async queueBatchDelete(collectionName, docIds) {
    this.addToQueue({
      type: "batchDelete",
      collection: collectionName,
      docIds,
    });
  }

  // Tenta sincronizar a fila
  async trySync() {
    if (this.isSyncing || this.queue.length === 0) return;

    this.isSyncing = true;

    try {
      const processedIds = [];
      let hasError = false;

      for (const item of this.queue) {
        try {
          if (item.type === "add") {
            const docRef = await addDoc(collection(db, item.collection), item.data);
            log(`✅ Sincronizado ADD: ${item.collection}/${docRef.id}`);
            processedIds.push(item.id);
          } else if (item.type === "update") {
            const docRef = doc(db, item.collection, item.docId);
            await updateDoc(docRef, item.data);
            log(`✅ Sincronizado UPDATE: ${item.collection}/${item.docId}`);
            processedIds.push(item.id);
          } else if (item.type === "delete") {
            const docRef = doc(db, item.collection, item.docId);
            await deleteDoc(docRef);
            log(`✅ Sincronizado DELETE: ${item.collection}/${item.docId}`);
            processedIds.push(item.id);
          } else if (item.type === "batchDelete") {
            for (const docId of item.docIds) {
              const docRef = doc(db, item.collection, docId);
              await deleteDoc(docRef);
            }
            log(`✅ Sincronizado BATCH DELETE: ${item.docIds.length} docs`);
            processedIds.push(item.id);
          }
        } catch (error) {
          // Se for erro de quota, para de processar e tenta depois
          if (error.code === "resource-exhausted") {
            log("⏸️ Quota excedida - aguardando...");
            hasError = true;
            break;
          }
          
          // Outros erros: remove da fila (operação inválida)
          console.error(`❌ Erro ao sincronizar ${item.type}:`, error);
          processedIds.push(item.id);
        }
      }

      // Remove itens processados da fila
      this.queue = this.queue.filter((item) => !processedIds.includes(item.id));
      this.saveQueue();

      // Reset retry count se conseguiu sincronizar algo
      if (processedIds.length > 0 && !hasError) {
        this.retryCount = 0;
      } else if (hasError) {
        this.retryCount++;
      }
    } catch (error) {
      console.error("Erro na sincronização:", error);
      this.retryCount++;
    } finally {
      this.isSyncing = false;
    }
  }

  // Inicia sincronização automática em background
  startAutoSync() {
    // Tenta sincronizar ao carregar
    setTimeout(() => this.trySync(), 2000);

    // Sincronização periódica com backoff exponencial
    setInterval(() => {
      const delay = Math.min(
        SYNC_INTERVAL * Math.pow(2, this.retryCount),
        MAX_RETRY_DELAY
      );
      
      if (Date.now() % delay < SYNC_INTERVAL) {
        this.trySync();
      }
    }, SYNC_INTERVAL);

    // Limpeza periódica da fila (a cada 1 hora)
    setInterval(() => {
      this.cleanOldItems();
    }, 60 * 60 * 1000);

    // Tenta sincronizar quando online
    window.addEventListener("online", () => {
      log("🌐 Internet reconectada - tentando sincronizar...");
      this.trySync();
    });

    // Tenta sincronizar quando janela ganha foco (após um tempo)
    let lastFocus = Date.now();
    window.addEventListener("focus", () => {
      const now = Date.now();
      // Só sincroniza se passou mais de 1 minuto
      if (now - lastFocus > 60000) {
        this.trySync();
      }
      lastFocus = now;
    });
  }

  // Limpa itens antigos da fila
  cleanOldItems() {
    const now = Date.now();
    const initialLength = this.queue.length;
    
    this.queue = this.queue.filter(item => {
      return !item.timestamp || now - item.timestamp < MAX_QUEUE_AGE;
    });

    if (this.queue.length < initialLength) {
      log(`🧹 Removidos ${initialLength - this.queue.length} itens antigos da fila`);
      this.saveQueue();
    }
  }

  // Verifica se há operações pendentes
  hasPendingOperations() {
    return this.queue.length > 0;
  }

  // Obtém número de operações pendentes
  getPendingCount() {
    return this.queue.length;
  }

  // 🆕 Limpa a fila completamente (CUIDADO!)
  async clearQueue() {
    console.warn("🗑️ Limpando toda a fila de operações pendentes!");
    this.queue = [];
    try {
      await storage.removeItem(PENDING_QUEUE_KEY);
    } catch (error) {
      console.error("Erro ao limpar fila:", error);
    }
  }

  // 🆕 Obtém informações sobre a fila
  getQueueInfo() {
    const queueString = JSON.stringify(this.queue);
    const size = new Blob([queueString]).size;
    const sizeMB = (size / 1024 / 1024).toFixed(2);
    
    return {
      count: this.queue.length,
      size: size,
      sizeMB: sizeMB,
      maxSize: MAX_QUEUE_SIZE,
      maxSizeMB: (MAX_STORAGE_SIZE / 1024 / 1024).toFixed(2),
      percentFull: ((this.queue.length / MAX_QUEUE_SIZE) * 100).toFixed(1),
      oldestTimestamp: this.queue[0]?.timestamp || null,
      newestTimestamp: this.queue[this.queue.length - 1]?.timestamp || null,
    };
  }

  // 🆕 Mostra informações da fila no console
  async logQueueInfo() {
    const info = this.getQueueInfo();
    const storageStats = await storage.getStorageStats();
    
    log(`
📊 FILA DE SINCRONIZAÇÃO:
  📦 Operações pendentes: ${info.count}/${info.maxSize}
  💾 Tamanho: ${info.sizeMB}MB / ${info.maxSizeMB}MB
  📈 Ocupação: ${info.percentFull}%
  🕐 Operação mais antiga: ${info.oldestTimestamp ? new Date(info.oldestTimestamp).toLocaleString() : 'N/A'}
  🕑 Operação mais recente: ${info.newestTimestamp ? new Date(info.newestTimestamp).toLocaleString() : 'N/A'}
  
💾 ARMAZENAMENTO (${storageStats.type}):
  📦 Total de itens: ${storageStats.itemCount}
  💽 Tamanho: ${storageStats.estimatedSizeMB}MB
  ${storageStats.quota ? `📊 Quota: ${storageStats.quota.usageMB}MB / ${storageStats.quota.quotaMB}MB (${storageStats.quota.percentUsed}%)` : ''}
    `);
  }
}

// Singleton global
const offlineSyncManager = new OfflineSyncManager();

export default offlineSyncManager;

// Helpers para uso direto
export const queueAdd = (collection, data) => offlineSyncManager.queueAdd(collection, data);
export const queueUpdate = (collection, docId, data) => offlineSyncManager.queueUpdate(collection, docId, data);
export const queueDelete = (collection, docId) => offlineSyncManager.queueDelete(collection, docId);
export const queueBatchDelete = (collection, docIds) => offlineSyncManager.queueBatchDelete(collection, docIds);

// 🆕 Métodos de gerenciamento da fila
export const clearQueue = () => offlineSyncManager.clearQueue();
export const getQueueInfo = () => offlineSyncManager.getQueueInfo();
export const logQueueInfo = () => offlineSyncManager.logQueueInfo();

// 🆕 Expõe o manager globalmente para debug no console
if (typeof window !== 'undefined') {
  window.offlineSyncManager = offlineSyncManager;
  log("💡 Use window.offlineSyncManager.logQueueInfo() para ver informações da fila");
  log("💡 Use window.offlineSyncManager.clearQueue() para limpar a fila (CUIDADO!)");
}
