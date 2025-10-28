// src/lib/supabaseSilent.js
// Wrapper para operações Supabase com fallback offline silencioso
import { supabase } from "../supabase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from "./firestoreAdapter";
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
    
    const collectionRef = collection(null, collectionName);
    const addPromise = addDoc(collectionRef, data);
    
    // Race entre timeout e addDoc
    const docRef = await Promise.race([addPromise, timeoutPromise]);
    return docRef.id;
  } catch (error) {
    // Se falhar (quota, timeout ou offline), adiciona à fila silenciosamente
    if (error.message === 'TIMEOUT' || !navigator.onLine || error.code === '23505') { // 23505 = unique violation
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
    
    const docRef = doc(null, collectionName, docId);
    const updatePromise = updateDoc(docRef, data);
    
    // Race entre timeout e updateDoc
    await Promise.race([updatePromise, timeoutPromise]);
    log("✅ Documento atualizado:", collectionName, docId);
  } catch (error) {
    // Se falhar, adiciona à fila silenciosamente
    if (error.message === 'TIMEOUT' || !navigator.onLine) {
      log("📦 Operação UPDATE em fila (offline/timeout):", collectionName, docId);
      await offlineSyncManager.queueUpdate(collectionName, docId, data);
    } else {
      throw error; // Outros erros são propagados
    }
  }
}

// Apagar documento com fallback silencioso
export async function deleteDocSilent(collectionName, docId) {
  try {
    // Timeout de 5 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), 5000)
    );
    
    const docRef = doc(null, collectionName, docId);
    const deletePromise = deleteDoc(docRef);
    
    // Race entre timeout e deleteDoc
    await Promise.race([deletePromise, timeoutPromise]);
    log("✅ Documento apagado:", collectionName, docId);
  } catch (error) {
    // Se falhar, adiciona à fila silenciosamente
    if (error.message === 'TIMEOUT' || !navigator.onLine) {
      log("📦 Operação DELETE em fila (offline/timeout):", collectionName, docId);
      await offlineSyncManager.queueDelete(collectionName, docId);
    } else {
      throw error; // Outros erros são propagados
    }
  }
}

// Apagar múltiplos documentos em batch com fallback silencioso
export async function batchDeleteSilent(collectionName, docIds) {
  try {
    // Timeout de 10 segundos para batch
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), 10000)
    );
    
    const batch = writeBatch(null);
    docIds.forEach(docId => {
      const docRef = doc(null, collectionName, docId);
      batch.delete(docRef);
    });
    
    const batchPromise = batch.commit();
    
    // Race entre timeout e batch
    await Promise.race([batchPromise, timeoutPromise]);
    log("✅ Batch delete executado:", collectionName, docIds.length, "docs");
  } catch (error) {
    // Se falhar, adiciona operações individuais à fila
    if (error.message === 'TIMEOUT' || !navigator.onLine) {
      log("📦 Batch DELETE em fila (offline/timeout):", collectionName, docIds.length, "docs");
      for (const docId of docIds) {
        await offlineSyncManager.queueDelete(collectionName, docId);
      }
    } else {
      throw error; // Outros erros são propagados
    }
  }
}