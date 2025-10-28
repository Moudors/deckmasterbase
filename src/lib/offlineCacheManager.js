// Cache Manager simplificado para modo offline
import { indexedDBStorage } from './indexedDBStorage';

class OfflineCacheManager {
  constructor() {
    this.CACHE_KEYS = {
      DECKS: 'offline_decks_cache',
      DECK_CARDS: 'offline_deck_cards_cache', 
      USER_PROFILE: 'offline_user_profile_cache',
      IMAGES: 'offline_images_cache',
      LAST_SYNC: 'offline_last_sync'
    };
  }

  // ==================== CACHE DE DECKS ====================

  // Salva decks no cache offline
  async cacheDecks(userId, decks) {
    try {
      const cacheData = {
        userId,
        decks,
        timestamp: Date.now()
      };
      
      await indexedDBStorage.setItem(this.CACHE_KEYS.DECKS, cacheData);
      console.log(`💾 ${decks.length} decks salvos no cache offline`);
    } catch (err) {
      console.error('❌ Erro ao cachear decks:', err);
    }
  }

  // Busca decks do cache offline
  async getCachedDecks(userId) {
    try {
      const cacheData = await indexedDBStorage.getItem(this.CACHE_KEYS.DECKS);
      
      if (!cacheData || cacheData.userId !== userId) {
        return [];
      }

      console.log(`📂 ${cacheData.decks.length} decks carregados do cache offline`);
      return cacheData.decks || [];
    } catch (err) {
      console.error('❌ Erro ao buscar decks do cache:', err);
      return [];
    }
  }

  // ==================== CACHE DE CARTAS ====================

  // Salva cartas de decks no cache
  async cacheDeckCards(deckId, cards) {
    try {
      const allCachedCards = await indexedDBStorage.getItem(this.CACHE_KEYS.DECK_CARDS) || {};
      allCachedCards[deckId] = {
        cards,
        timestamp: Date.now()
      };
      
      await indexedDBStorage.setItem(this.CACHE_KEYS.DECK_CARDS, allCachedCards);
      console.log(`💾 ${cards.length} cartas do deck ${deckId} salvas no cache`);
    } catch (err) {
      console.error('❌ Erro ao cachear cartas:', err);
    }
  }

  // Busca cartas de um deck do cache
  async getCachedDeckCards(deckId) {
    try {
      const allCachedCards = await indexedDBStorage.getItem(this.CACHE_KEYS.DECK_CARDS) || {};
      const deckCache = allCachedCards[deckId];
      
      if (!deckCache) {
        return [];
      }

      console.log(`📂 ${deckCache.cards.length} cartas do deck ${deckId} carregadas do cache`);
      return deckCache.cards;
    } catch (err) {
      console.error('❌ Erro ao buscar cartas do cache:', err);
      return [];
    }
  }

  // ==================== CACHE DE PERFIL ====================

  // Salva perfil do usuário no cache
  async cacheUserProfile(profile) {
    try {
      const cacheData = {
        profile,
        timestamp: Date.now()
      };
      
      await indexedDBStorage.setItem(this.CACHE_KEYS.USER_PROFILE, cacheData);
      console.log('💾 Perfil do usuário salvo no cache offline');
    } catch (err) {
      console.error('❌ Erro ao cachear perfil:', err);
    }
  }

  // Busca perfil do cache
  async getCachedUserProfile() {
    try {
      const cacheData = await indexedDBStorage.getItem(this.CACHE_KEYS.USER_PROFILE);
      
      if (!cacheData) {
        return null;
      }

      console.log('📂 Perfil carregado do cache offline');
      return cacheData.profile;
    } catch (err) {
      console.error('❌ Erro ao buscar perfil do cache:', err);
      return null;
    }
  }

  // ==================== CACHE DE IMAGENS ====================

  // Salva URL de imagem no cache
  async cacheImage(imageUrl, blob) {
    try {
      const images = await indexedDBStorage.getItem(this.CACHE_KEYS.IMAGES) || {};
      images[imageUrl] = {
        blob: blob,
        timestamp: Date.now()
      };
      
      await indexedDBStorage.setItem(this.CACHE_KEYS.IMAGES, images);
    } catch (err) {
      console.error('❌ Erro ao cachear imagem:', err);
    }
  }

  // Busca imagem do cache
  async getCachedImage(imageUrl) {
    try {
      const images = await indexedDBStorage.getItem(this.CACHE_KEYS.IMAGES) || {};
      const imageCache = images[imageUrl];
      
      if (!imageCache) {
        return null;
      }

      // Verifica se a imagem não é muito antiga (30 dias)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (imageCache.timestamp < thirtyDaysAgo) {
        delete images[imageUrl];
        await indexedDBStorage.setItem(this.CACHE_KEYS.IMAGES, images);
        return null;
      }

      return imageCache.blob;
    } catch (err) {
      console.error('❌ Erro ao buscar imagem do cache:', err);
      return null;
    }
  }

  // ==================== SINCRONIZAÇÃO ====================

  // Salva timestamp da última sincronização
  async setLastSyncTime(timestamp = Date.now()) {
    try {
      await indexedDBStorage.setItem(this.CACHE_KEYS.LAST_SYNC, timestamp);
    } catch (err) {
      console.error('❌ Erro ao salvar timestamp de sync:', err);
    }
  }

  // Busca timestamp da última sincronização
  async getLastSyncTime() {
    try {
      return await indexedDBStorage.getItem(this.CACHE_KEYS.LAST_SYNC) || 0;
    } catch (err) {
      console.error('❌ Erro ao buscar timestamp de sync:', err);
      return 0;
    }
  }

  // ==================== LIMPEZA ====================

  // Limpa cache antigo (mais de 7 dias)
  async cleanOldCache() {
    try {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      // Limpar imagens antigas
      const images = await indexedDBStorage.getItem(this.CACHE_KEYS.IMAGES) || {};
      let cleanedImages = 0;
      
      for (const [url, data] of Object.entries(images)) {
        if (data.timestamp < sevenDaysAgo) {
          delete images[url];
          cleanedImages++;
        }
      }
      
      if (cleanedImages > 0) {
        await indexedDBStorage.setItem(this.CACHE_KEYS.IMAGES, images);
        console.log(`🧹 ${cleanedImages} imagens antigas removidas do cache`);
      }
      
    } catch (err) {
      console.error('❌ Erro ao limpar cache:', err);
    }
  }

  // Limpa todo o cache
  async clearAllCache() {
    try {
      for (const key of Object.values(this.CACHE_KEYS)) {
        await indexedDBStorage.removeItem(key);
      }
      console.log('🧹 Todo o cache offline foi limpo');
    } catch (err) {
      console.error('❌ Erro ao limpar cache:', err);
    }
  }

  // ==================== ESTATÍSTICAS ====================

  // Retorna estatísticas do cache
  async getCacheStats() {
    try {
      const stats = {
        decks: 0,
        deckCards: 0,
        images: 0,
        lastSync: await this.getLastSyncTime(),
        hasProfile: false
      };

      // Contar decks
      const decksCache = await indexedDBStorage.getItem(this.CACHE_KEYS.DECKS);
      if (decksCache?.decks) {
        stats.decks = decksCache.decks.length;
      }

      // Contar cartas
      const cardsCache = await indexedDBStorage.getItem(this.CACHE_KEYS.DECK_CARDS) || {};
      stats.deckCards = Object.keys(cardsCache).length;

      // Contar imagens
      const imagesCache = await indexedDBStorage.getItem(this.CACHE_KEYS.IMAGES) || {};
      stats.images = Object.keys(imagesCache).length;

      // Verificar perfil
      const profileCache = await indexedDBStorage.getItem(this.CACHE_KEYS.USER_PROFILE);
      stats.hasProfile = !!profileCache;

      return stats;
    } catch (err) {
      console.error('❌ Erro ao obter estatísticas do cache:', err);
      return null;
    }
  }
}

// Instância singleton
export const offlineCacheManager = new OfflineCacheManager();