// Wrapper para operações Firestore com fallback offline silencioso
import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from "firebase/firestore";
import offlineSyncManager from "./offlineSync";

// 🔇 LOGS DESABILITADOS (mode silencioso)
const ENABLE_LOGS = false;
const log = (...args) => ENABLE_LOGS && console.log(...args);

// Adicionar documento com fallback silencioso
export async function addDocSilent(collectionName, data) {
  try {
    // Timeout de 5 segundos para evitar travamento
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), 5000)
    );
    
    const addPromise = addDoc(collection(db, collectionName), data);
    
    // Race entre timeout e addDoc
    const docRef = await Promise.race([addPromise, timeoutPromise]);
    return docRef.id;
  } catch (error) {
    // Se falhar (quota, timeout ou offline), adiciona à fila silenciosamente
    if (error.code === "resource-exhausted" || error.message === 'TIMEOUT' || !navigator.onLine) {
      log("📦 Operação ADD em fila (offline/quota/timeout):", collectionName);
      const tempId = await offlineSyncManager.queueAdd(collectionName, data);
      return tempId; // Retorna ID temporário
    }
    throw error; // Outros erros são propagados
  }
}

// Atualizar documento com fallback silencioso
export async function updateDocSilent(collectionName, docId, data) {
  try {
    // Timeout de 5 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), 5000)
    );
    
    const docRef = doc(db, collectionName, docId);
    const updatePromise = updateDoc(docRef, data);
    
    await Promise.race([updatePromise, timeoutPromise]);
  } catch (error) {
    if (error.code === "resource-exhausted" || error.message === 'TIMEOUT' || !navigator.onLine) {
      log("📦 Operação UPDATE em fila (offline/quota/timeout):", collectionName, docId);
      await offlineSyncManager.queueUpdate(collectionName, docId, data);
      return; // Sucesso silencioso
    }
    throw error;
  }
}

// Deletar documento com fallback silencioso
export async function deleteDocSilent(collectionName, docId) {
  try {
    // Timeout de 5 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), 5000)
    );
    
    const docRef = doc(db, collectionName, docId);
    const deletePromise = deleteDoc(docRef);
    
    await Promise.race([deletePromise, timeoutPromise]);
  } catch (error) {
    if (error.code === "resource-exhausted" || error.message === 'TIMEOUT' || !navigator.onLine) {
      log("📦 Operação DELETE em fila (offline/quota/timeout):", collectionName, docId);
      await offlineSyncManager.queueDelete(collectionName, docId);
      return; // Sucesso silencioso
    }
    throw error;
  }
}

// Batch delete com fallback silencioso
export async function batchDeleteSilent(collectionName, docIds) {
  try {
    const batch = writeBatch(db);
    docIds.forEach((docId) => {
      const docRef = doc(db, collectionName, docId);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    if (error.code === "resource-exhausted" || !navigator.onLine) {
      log(`📦 Operação BATCH DELETE em fila (${docIds.length} docs)`);
      await offlineSyncManager.queueBatchDelete(collectionName, docIds);
      return; // Sucesso silencioso
    }
    throw error;
  }
}
