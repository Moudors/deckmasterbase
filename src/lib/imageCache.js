/**
 * 🖼️ IMAGE CACHE MANAGER
 * =====================
 * Gerencia cache de imagens de cartas no IndexedDB para:
 * - ✅ Reduzir tráfego de rede (não baixa mesma imagem 2x)
 * - ✅ Funcionar 100% offline depois do primeiro download
 * - ✅ Não sobrecarregar Firebase (imagens pesam muito)
 * - ✅ Performance instantânea (carrega do cache local)
 *
 * TAMANHOS TÍPICOS:
 * - normal: ~100-150 KB por imagem
 * - art_crop: ~80-120 KB por imagem
 * - small: ~30-50 KB por imagem
 *
 * ESTIMATIVA DE ARMAZENAMENTO:
 * - 100 cartas × 120 KB = ~12 MB
 * - 500 cartas × 120 KB = ~60 MB
 * - IndexedDB suporta centenas de MB facilmente
 */

const DB_NAME = 'deckmaster_images';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms

/**
 * 🔧 Abre conexão com IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Erro ao abrir IndexedDB para cache de imagens:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Cria object store se não existir
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        
        // Índice por data para limpeza de cache antigo
        store.createIndex('timestamp', 'timestamp', { unique: false });
        
        console.log('✅ Object store de imagens criado');
      }
    };
  });
}

/**
 * 🖼️ Busca imagem no cache
 * @param {string} imageUrl - URL da imagem
 * @returns {Promise<string|null>} - Blob URL local ou null se não estiver em cache
 */
export async function getCachedImage(imageUrl) {
  if (!imageUrl) return null;

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(imageUrl);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Verifica se cache está expirado (30 dias)
        const now = Date.now();
        if (now - result.timestamp > CACHE_DURATION) {
          console.log('⏰ Cache expirado para:', imageUrl);
          resolve(null);
          return;
        }

        // Cria Blob URL local a partir do Blob armazenado
        const blobUrl = URL.createObjectURL(result.blob);
        resolve(blobUrl);
      };

      request.onerror = () => {
        console.error('❌ Erro ao buscar imagem do cache:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error('❌ Erro ao acessar cache de imagens:', error);
    return null;
  }
}

/**
 * 📥 Baixa imagem da internet e salva no cache
 * @param {string} imageUrl - URL da imagem
 * @returns {Promise<string|null>} - Blob URL local ou null se falhar
 */
export async function downloadAndCacheImage(imageUrl) {
  if (!imageUrl) return null;

  try {
    console.log('📥 Baixando imagem:', imageUrl);
    
    // Baixa imagem
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('❌ Falha ao baixar imagem:', response.status);
      return null;
    }

    // Converte para Blob
    const blob = await response.blob();
    const size = (blob.size / 1024).toFixed(2); // KB
    console.log(`✅ Imagem baixada: ${size} KB`);

    // Salva no IndexedDB
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cacheEntry = {
      url: imageUrl,
      blob: blob,
      timestamp: Date.now(),
      size: blob.size,
    };

    store.put(cacheEntry);

    // Aguarda conclusão da transação
    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('✅ Imagem salva no cache');
        resolve();
      };
      transaction.onerror = () => {
        console.error('❌ Erro ao salvar imagem no cache:', transaction.error);
        reject(transaction.error);
      };
    });

    // Retorna Blob URL local
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('❌ Erro ao baixar/cachear imagem:', error);
    return null;
  }
}

/**
 * 🔍 Busca imagem (cache first, fallback para download)
 * @param {string} imageUrl - URL da imagem
 * @returns {Promise<string>} - Blob URL local ou URL original se falhar
 */
export async function getImage(imageUrl) {
  if (!imageUrl) return '';

  try {
    // 1. Tenta buscar do cache
    const cachedUrl = await getCachedImage(imageUrl);
    if (cachedUrl) {
      console.log('⚡ Imagem carregada do cache:', imageUrl);
      return cachedUrl;
    }

    // 2. Se não estiver em cache, baixa e salva
    const downloadedUrl = await downloadAndCacheImage(imageUrl);
    if (downloadedUrl) {
      return downloadedUrl;
    }

    // 3. Se falhar, retorna URL original (fallback)
    console.warn('⚠️ Usando URL original (sem cache):', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('❌ Erro ao obter imagem:', error);
    return imageUrl; // Fallback para URL original
  }
}

/**
 * 🗑️ Remove imagem do cache
 * @param {string} imageUrl - URL da imagem
 */
export async function removeCachedImage(imageUrl) {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(imageUrl);

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('✅ Imagem removida do cache:', imageUrl);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('❌ Erro ao remover imagem do cache:', error);
  }
}

/**
 * 🧹 Limpa cache antigo (imagens não acessadas há 30+ dias)
 * @returns {Promise<number>} - Número de imagens removidas
 */
export async function cleanupOldCache() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    const now = Date.now();
    const expiredBefore = now - CACHE_DURATION;
    
    let deletedCount = 0;

    const request = index.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.timestamp < expiredBefore) {
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      }
    };

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`🧹 Limpeza concluída: ${deletedCount} imagens antigas removidas`);
        resolve(deletedCount);
      };
      transaction.onerror = () => reject(transaction.error);
    });

    return deletedCount;
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    return 0;
  }
}

/**
 * 📊 Retorna estatísticas do cache
 * @returns {Promise<object>} - Estatísticas (total, size, oldestTimestamp)
 */
export async function getCacheStats() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const allImages = request.result;
        
        const stats = {
          total: allImages.length,
          totalSize: allImages.reduce((sum, img) => sum + img.size, 0),
          totalSizeMB: (allImages.reduce((sum, img) => sum + img.size, 0) / (1024 * 1024)).toFixed(2),
          oldestTimestamp: allImages.length > 0 
            ? Math.min(...allImages.map(img => img.timestamp))
            : null,
          newestTimestamp: allImages.length > 0
            ? Math.max(...allImages.map(img => img.timestamp))
            : null,
        };

        console.log('📊 Estatísticas do cache:', stats);
        resolve(stats);
      };

      request.onerror = () => {
        console.error('❌ Erro ao obter estatísticas:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Erro ao acessar estatísticas:', error);
    return {
      total: 0,
      totalSize: 0,
      totalSizeMB: '0.00',
      oldestTimestamp: null,
      newestTimestamp: null,
    };
  }
}

/**
 * 🗑️ Limpa TODO o cache (útil para debug)
 */
export async function clearAllCache() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('🗑️ Cache de imagens limpo completamente');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
  }
}

/**
 * 🔧 Expõe funções no window para debug no console
 */
if (typeof window !== 'undefined') {
  window.imageCacheManager = {
    getStats: getCacheStats,
    cleanup: cleanupOldCache,
    clearAll: clearAllCache,
    getImage: getImage,
  };

  console.log('🖼️ Image Cache Manager carregado. Use window.imageCacheManager no console.');
}

export default {
  getImage,
  getCachedImage,
  downloadAndCacheImage,
  removeCachedImage,
  cleanupOldCache,
  getCacheStats,
  clearAllCache,
};
