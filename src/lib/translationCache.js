// �️ Remove tradução específica do cache
export async function removeTranslation(cardId, cardName) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const key = `${cardId}_${cardName}`;
    await store.delete(key);
    console.log(`🗑️ Tradução removida do cache: ${cardName}`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao remover tradução:", error);
    return false;
  }
}
// �🗣️ Cache de traduções no IndexedDB
// Evita chamadas repetidas à Azure Translator API

const DB_NAME = "deckmaster_translations";
const DB_VERSION = 1;
const STORE_NAME = "translations";

// 📊 Estatísticas de cache
let stats = {
  hits: 0,
  misses: 0,
  saves: 0
};

// Inicializa o IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Cria store se não existir
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        
        // Índices para busca
        store.createIndex("cardId", "cardId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
        
        console.log("✅ Store de traduções criado");
      }
    };
  });
}

// 💾 Salva tradução no cache
export async function saveTranslation(cardId, cardName, translatedName, translatedText, faces) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const cacheEntry = {
      key: `${cardId}_${cardName}`, // Chave única
      cardId,
      cardName,
      translatedName,
      translatedText,
      faces: faces || null, // Array de faces traduzidas (se houver)
      timestamp: Date.now(),
    };

    await store.put(cacheEntry);
    stats.saves++;
    
    console.log(`💾 Tradução salva: ${cardName} → ${translatedName}`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar tradução:", error);
    return false;
  }
}

// 🔍 Busca tradução no cache
export async function getTranslation(cardId, cardName) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    
    const key = `${cardId}_${cardName}`;
    const result = await new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (result) {
      stats.hits++;
      console.log(`✅ Cache HIT: ${cardName}`);
      return result;
    }

    stats.misses++;
    console.log(`❌ Cache MISS: ${cardName}`);
    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar tradução:", error);
    stats.misses++;
    return null;
  }
}

// 🗑️ Remove traduções antigas (mais de 30 dias)
export async function cleanOldTranslations() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("timestamp");

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const range = IDBKeyRange.upperBound(thirtyDaysAgo);

    let deleted = 0;
    const cursorRequest = index.openCursor(range);

    return new Promise((resolve, reject) => {
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deleted++;
          cursor.continue();
        } else {
          console.log(`🧹 ${deleted} traduções antigas removidas`);
          resolve(deleted);
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  } catch (error) {
    console.error("❌ Erro ao limpar traduções:", error);
    return 0;
  }
}

// 📊 Obtém estatísticas do cache
export function getStats() {
  return {
    ...stats,
    hitRate: stats.hits + stats.misses > 0 
      ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
      : '0%'
  };
}

// 🔄 Reseta estatísticas
export function resetStats() {
  stats = { hits: 0, misses: 0, saves: 0 };
}

// 🗑️ Limpa todo o cache (cuidado!)
export async function clearAllTranslations() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    await store.clear();
    console.log("🗑️ Todas as traduções foram removidas");
    return true;
  } catch (error) {
    console.error("❌ Erro ao limpar cache:", error);
    return false;
  }
}

// 📈 Conta total de traduções no cache
export async function countTranslations() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    
    const count = await new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return count;
  } catch (error) {
    console.error("❌ Erro ao contar traduções:", error);
    return 0;
  }
}

// 🌍 Expõe no window para debug
if (typeof window !== 'undefined') {
  window.translationCache = {
    getStats,
    resetStats,
    clearAll: clearAllTranslations,
    count: countTranslations,
    clean: cleanOldTranslations,
  };
  console.log("🗣️ Translation Cache disponível em window.translationCache");
}

export default {
  saveTranslation,
  getTranslation,
  cleanOldTranslations,
  getStats,
  resetStats,
  clearAllTranslations,
  countTranslations,
};
