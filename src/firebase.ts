// src/firebase.ts - Adaptador de compatibilidade para migração Supabase
import { auth, googleProvider, supabaseApi } from "./supabase";
import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove
} from "./lib/firestoreAdapter";

// Exporta a instância de auth do Supabase adaptada
export { auth, googleProvider };

// Adaptador do banco de dados
export const db = {
  // Supabase não precisa de inicialização como o Firestore
  // Todas as operações passam pelo adaptador
};

// Re-exporta todas as funções do Firestore através do adaptador
export {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove
};

// API compatível
export const firebaseApi = supabaseApi;
