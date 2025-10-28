// src/lib/firestoreAdapter.ts
import { supabase } from '../supabase';

// Tipos para compatibilidade com Firestore
export interface DocumentReference {
  id: string;
  path: string;
}

export interface QuerySnapshot {
  docs: DocumentSnapshot[];
  empty: boolean;
  size: number;
}

export interface DocumentSnapshot {
  id: string;
  exists(): boolean;
  data(): any;
}

export interface CollectionReference {
  path: string;
}

// Adaptador que simula funções do Firestore
export function collection(db: any, collectionName: string): CollectionReference {
  return { path: collectionName };
}

export function doc(db: any, collectionName: string, docId: string): DocumentReference {
  return { id: docId, path: `${collectionName}/${docId}` };
}

export async function getDocs(collectionRef: CollectionReference | any): Promise<QuerySnapshot> {
  try {
    let tableName = collectionRef.path || collectionRef.tableName;
    
    // Mapear nomes das coleções para tabelas do Supabase
    const tableMap: { [key: string]: string } = {
      'users': 'users',
      'decks': 'decks', 
      'cards': 'deck_cards',
      'messages': 'messages',
      'friendships': 'friendships',
      'usernames': 'usernames'
    };
    
    tableName = tableMap[tableName] || tableName;
    
    let queryBuilder: any = supabase.from(tableName).select('*');
    
    // Aplicar filtros where se existirem
    if (collectionRef.whereFilters) {
      collectionRef.whereFilters.forEach((filter: any) => {
        const [field, operator, value] = filter;
        switch (operator) {
          case '==':
            queryBuilder = queryBuilder.eq(field, value);
            break;
          case '!=':
            queryBuilder = queryBuilder.neq(field, value);
            break;
          case '>':
            queryBuilder = queryBuilder.gt(field, value);
            break;
          case '>=':
            queryBuilder = queryBuilder.gte(field, value);
            break;
          case '<':
            queryBuilder = queryBuilder.lt(field, value);
            break;
          case '<=':
            queryBuilder = queryBuilder.lte(field, value);
            break;
          case 'in':
            queryBuilder = queryBuilder.in(field, value);
            break;
          case 'array-contains':
            queryBuilder = queryBuilder.contains(field, [value]);
            break;
        }
      });
    }
    
    // Aplicar ordenação se existir
    if (collectionRef.orderByField) {
      queryBuilder = queryBuilder.order(collectionRef.orderByField, { 
        ascending: collectionRef.orderByDirection !== 'desc' 
      });
    }
    
    // Aplicar limite se existir
    if (collectionRef.limitValue) {
      queryBuilder = queryBuilder.limit(collectionRef.limitValue);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    
    const docs = (data || []).map((item: any) => ({
      id: item.id,
      exists: () => true,
      data: () => {
        // Converter created_at e updated_at para Timestamp compatível com Firebase
        const result = { ...item };
        if (result.created_at) {
          result.createdAt = { toDate: () => new Date(result.created_at) };
        }
        if (result.updated_at) {
          result.updatedAt = { toDate: () => new Date(result.updated_at) };
        }
        return result;
      }
    }));
    
    return {
      docs,
      empty: docs.length === 0,
      size: docs.length
    };
  } catch (error) {
    console.error('Erro em getDocs:', error);
    throw error;
  }
}

export async function getDoc(docRef: DocumentReference): Promise<DocumentSnapshot> {
  try {
    const [collectionName, docId] = docRef.path.split('/');
    
    // Mapear nomes das coleções para tabelas do Supabase
    const tableMap: { [key: string]: string } = {
      'users': 'users',
      'decks': 'decks',
      'cards': 'deck_cards', 
      'messages': 'messages',
      'friendships': 'friendships',
      'usernames': 'usernames'
    };
    
    const tableName = tableMap[collectionName] || collectionName;
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', docId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }
    
    return {
      id: docId,
      exists: () => !!data,
      data: () => {
        if (!data) return undefined;
        
        // Converter timestamps
        const result = { ...data };
        if (result.created_at) {
          result.createdAt = { toDate: () => new Date(result.created_at) };
        }
        if (result.updated_at) {
          result.updatedAt = { toDate: () => new Date(result.updated_at) };
        }
        return result;
      }
    };
  } catch (error) {
    console.error('Erro em getDoc:', error);
    throw error;
  }
}

export async function addDoc(collectionRef: CollectionReference, data: any): Promise<DocumentReference> {
  try {
    const collectionName = collectionRef.path;
    
    // Mapear nomes das coleções para tabelas do Supabase
    const tableMap: { [key: string]: string } = {
      'users': 'users',
      'decks': 'decks',
      'cards': 'deck_cards',
      'messages': 'messages', 
      'friendships': 'friendships',
      'usernames': 'usernames'
    };
    
    const tableName = tableMap[collectionName] || collectionName;
    
    // Converter dados para formato do Supabase
    const supabaseData = { ...data };
    
    // Converter timestamps
    if (supabaseData.createdAt) {
      supabaseData.created_at = new Date().toISOString();
      delete supabaseData.createdAt;
    }
    if (supabaseData.updatedAt) {
      supabaseData.updated_at = new Date().toISOString(); 
      delete supabaseData.updatedAt;
    }
    
    // Para decks, ajustar campo ownerId para owner_id
    if (tableName === 'decks' && supabaseData.ownerId) {
      supabaseData.owner_id = supabaseData.ownerId;
      delete supabaseData.ownerId;
    }
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(supabaseData)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: result.id,
      path: `${collectionName}/${result.id}`
    };
  } catch (error) {
    console.error('Erro em addDoc:', error);
    throw error;
  }
}

export async function updateDoc(docRef: DocumentReference, data: any): Promise<void> {
  try {
    const [collectionName, docId] = docRef.path.split('/');
    
    // Mapear nomes das coleções para tabelas do Supabase
    const tableMap: { [key: string]: string } = {
      'users': 'users',
      'decks': 'decks',
      'cards': 'deck_cards',
      'messages': 'messages',
      'friendships': 'friendships', 
      'usernames': 'usernames'
    };
    
    const tableName = tableMap[collectionName] || collectionName;
    
    // Converter dados para formato do Supabase
    const supabaseData = { ...data };
    
    // Tratar arrayUnion e arrayRemove
    for (const [key, value] of Object.entries(supabaseData)) {
      if (value && typeof value === 'object' && (value as any).type === 'arrayUnion') {
        // Para arrayUnion, precisamos buscar o valor atual e concatenar
        const { data: currentDoc } = await supabase
          .from(tableName)
          .select(key)
          .eq('id', docId)
          .single();
        
        const currentArray = (currentDoc as any)?.[key] || [];
        const newElements = (value as any).elements;
        const uniqueElements = Array.from(new Set([...currentArray, ...newElements]));
        supabaseData[key] = uniqueElements;
      } else if (value && typeof value === 'object' && (value as any).type === 'arrayRemove') {
        // Para arrayRemove, precisamos buscar o valor atual e remover elementos
        const { data: currentDoc } = await supabase
          .from(tableName)
          .select(key)
          .eq('id', docId)
          .single();
        
        const currentArray = (currentDoc as any)?.[key] || [];
        const elementsToRemove = (value as any).elements;
        const filteredArray = currentArray.filter((item: any) => !elementsToRemove.includes(item));
        supabaseData[key] = filteredArray;
      }
    }
    
    // Converter timestamps
    if (supabaseData.updatedAt) {
      supabaseData.updated_at = new Date().toISOString();
      delete supabaseData.updatedAt;
    }
    
    // Para decks, ajustar campo ownerId para owner_id
    if (tableName === 'decks' && supabaseData.ownerId) {
      supabaseData.owner_id = supabaseData.ownerId;
      delete supabaseData.ownerId;
    }
    
    const { error } = await supabase
      .from(tableName)
      .update(supabaseData)
      .eq('id', docId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Erro em updateDoc:', error);
    throw error;
  }
}

export async function deleteDoc(docRef: DocumentReference): Promise<void> {
  try {
    const [collectionName, docId] = docRef.path.split('/');
    
    // Mapear nomes das coleções para tabelas do Supabase
    const tableMap: { [key: string]: string } = {
      'users': 'users',
      'decks': 'decks',
      'cards': 'deck_cards', 
      'messages': 'messages',
      'friendships': 'friendships',
      'usernames': 'usernames'
    };
    
    const tableName = tableMap[collectionName] || collectionName;
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', docId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Erro em deleteDoc:', error);
    throw error;
  }
}

export async function setDoc(docRef: DocumentReference, data: any): Promise<void> {
  try {
    const [collectionName, docId] = docRef.path.split('/');
    
    // Mapear nomes das coleções para tabelas do Supabase
    const tableMap: { [key: string]: string } = {
      'users': 'users',
      'decks': 'decks',
      'cards': 'deck_cards',
      'messages': 'messages',
      'friendships': 'friendships',
      'usernames': 'usernames'
    };
    
    const tableName = tableMap[collectionName] || collectionName;
    
    // Converter dados para formato do Supabase
    const supabaseData = { ...data, id: docId };
    
    // Converter timestamps
    if (supabaseData.createdAt) {
      supabaseData.created_at = new Date().toISOString();
      delete supabaseData.createdAt;
    }
    if (supabaseData.updatedAt) {
      supabaseData.updated_at = new Date().toISOString();
      delete supabaseData.updatedAt;
    }
    
    // Para decks, ajustar campo ownerId para owner_id
    if (tableName === 'decks' && supabaseData.ownerId) {
      supabaseData.owner_id = supabaseData.ownerId;
      delete supabaseData.ownerId;
    }
    
    const { error } = await supabase
      .from(tableName)
      .upsert(supabaseData);
    
    if (error) throw error;
  } catch (error) {
    console.error('Erro em setDoc:', error);
    throw error;
  }
}

// Funções de query
export function query(collectionRef: CollectionReference, ...filters: any[]) {
  const queryObj: any = {
    ...collectionRef,
    whereFilters: [] as any[],
    orderByField: null,
    orderByDirection: 'asc',
    limitValue: null,
    tableName: collectionRef.path
  };
  
  // Aplicar filtros
  filters.forEach(filter => {
    if (filter.type === 'where') {
      queryObj.whereFilters.push([filter.field, filter.operator, filter.value]);
    } else if (filter.type === 'orderBy') {
      queryObj.orderByField = filter.field;
      queryObj.orderByDirection = filter.direction;
    } else if (filter.type === 'limit') {
      queryObj.limitValue = filter.value;
    }
  });
  
  return queryObj;
}

export function where(field: string, operator: string, value: any) {
  return { type: 'where', field, operator, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(value: number) {
  return { type: 'limit', value };
}

// Timestamp compatível com Firebase
export function serverTimestamp() {
  return new Date().toISOString();
}

// Array operations para compatibilidade com Firebase
export function arrayUnion(...elements: any[]) {
  return {
    type: 'arrayUnion',
    elements
  };
}

export function arrayRemove(...elements: any[]) {
  return {
    type: 'arrayRemove', 
    elements
  };
}

// Batch operations (simplificado)
export function writeBatch(db: any) {
  const operations: any[] = [];
  
  return {
    set: (docRef: DocumentReference, data: any) => {
      operations.push({ type: 'set', docRef, data });
    },
    update: (docRef: DocumentReference, data: any) => {
      operations.push({ type: 'update', docRef, data });
    },
    delete: (docRef: DocumentReference) => {
      operations.push({ type: 'delete', docRef });
    },
    commit: async () => {
      // Executar operações em sequência (Supabase não tem transações como Firestore)
      for (const op of operations) {
        switch (op.type) {
          case 'set':
            await setDoc(op.docRef, op.data);
            break;
          case 'update':
            await updateDoc(op.docRef, op.data);
            break;
          case 'delete':
            await deleteDoc(op.docRef);
            break;
        }
      }
    }
  };
}